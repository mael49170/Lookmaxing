// Le scan du visage : 2 photos -> Claude -> 15 notes. Les photos ne sont jamais écrites nulle part,
// ni en base, ni sur disque, ni dans les journaux (aucun console.log ne doit recevoir une image).
import { HttpError } from "./http.js";
import { FACTORS, overall, potential } from "../src/shared/factors.js";
import { SCAN_SYSTEM, SCAN_USER, SCAN_USER_FEMME, SCAN_SCHEMA, SCAN_PROMPT_VERSION } from "./prompts.js";

export const SCAN_MODEL = "claude-opus-5-5";
// Prix publics par million de jetons (USD), pour enregistrer le coût réel de chaque scan
const PRICES = { "claude-opus-5-5": [4, 20], "claude-sonnet-5-5": [2, 10], "claude-haiku-5-5": [0.1, 0.5] };
export const MAX_IMAGE_BYTES = 1_500_000; // une photo réduite dans le téléphone pèse ~150 Ko

const MESSAGES = {
  pas_de_visage: "On ne trouve pas de visage sur une des photos. Recommence face à une fenêtre.",
  plusieurs_visages: "Il y a plusieurs visages. Prends la photo seul.",
  photo_inutilisable: "Les photos sont trop floues ou trop sombres. Recommence face à une fenêtre, en pleine lumière.",
  semble_mineur: "Ce service est réservé aux adultes. On ne peut pas analyser ces photos.",
};

// data:image/jpeg;base64,... -> { media_type, data }
export function parseImage(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) throw new HttpError(400, "Photo illisible. Reprends-la.");
  if (m[2].length * 0.75 > MAX_IMAGE_BYTES) throw new HttpError(413, "Photo trop lourde.");
  return { media_type: m[1], data: m[2] };
}

export function costMicroUsd(model, usage = {}) {
  const [inp, out] = PRICES[model] || PRICES[SCAN_MODEL];
  const input = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) * 1.25 + (usage.cache_read_input_tokens || 0) * 0.1;
  return Math.round(input * inp + (usage.output_tokens || 0) * out); // jetons × $/million = micro-dollars
}

// Transforme la réponse de l'IA en résultat propre (notes bornées, les 15 critères présents)
export function toResult(parsed) {
  if (parsed.probleme && parsed.probleme !== "aucun") {
    return { ok: false, problem: parsed.probleme, message: MESSAGES[parsed.probleme] || MESSAGES.photo_inutilisable };
  }
  const byId = Object.fromEntries((parsed.criteres || []).map((c) => [c.id, c]));
  const factors = [];
  for (const f of FACTORS) {
    const c = byId[f.id];
    if (!c) return { ok: false, problem: "incomplet", message: MESSAGES.photo_inutilisable };
    factors.push({ id: f.id, note: Math.max(0, Math.min(100, Math.round(Number(c.note) || 0))), phrase: String(c.phrase || "").slice(0, 160) });
  }
  const scores = Object.fromEntries(factors.map((f) => [f.id, f.note]));
  return { ok: true, factors, now: overall(scores), max: potential(scores) };
}

// Mode essai en local (DEV_FAKE_SCAN=1) : des notes stables tirées des octets de la photo, sans appel payant
async function fakeScan(images) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(images.map((i) => i.data.slice(0, 5000)).join("")));
  const b = new Uint8Array(buf);
  return {
    parsed: { probleme: "aucun", criteres: FACTORS.map((f, i) => ({ id: f.id, note: 42 + (b[i] % 36), phrase: `${f.label} : exemple de phrase (mode essai, aucune IA appelée).` })) },
    model: "essai", cost: 0,
  };
}

export async function runScan(env, images, { fetchImpl = fetch, genre = "" } = {}) {
  if (!env.ANTHROPIC_API_KEY) {
    if (env.DEV_FAKE_SCAN === "1") return { ...toResult((await fakeScan(images)).parsed), model: "essai", cost: 0, version: SCAN_PROMPT_VERSION };
    throw new HttpError(503, "L'analyse n'est pas encore branchée.");
  }
  const model = env.SCAN_MODEL || SCAN_MODEL;
  const content = [
    ...images.map((img) => ({ type: "image", source: { type: "base64", media_type: img.media_type, data: img.data } })),
    { type: "text", text: SCAN_USER + (genre === "femme" ? SCAN_USER_FEMME : "") },
  ];
  const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system: [{ type: "text", text: SCAN_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
      output_config: { effort: env.SCAN_EFFORT || "low", format: { type: "json_schema", schema: SCAN_SCHEMA } },
      fallbacks: "default",
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // jamais le corps de la requête dans le journal : il contient les photos
    console.error("Scan : erreur de l'IA", res.status, data?.error?.type || "", String(data?.error?.message || "").slice(0, 200));
    throw new HttpError(502, "L'analyse n'a pas marché. Réessaie dans un instant.");
  }
  const used = data.model || model;
  const cost = costMicroUsd(used, data.usage);
  if (data.stop_reason === "refusal") {
    return { ok: false, problem: "refus", message: "L'analyse n'a pas pu se faire sur ces photos. Tu peux continuer sans scan : ton plan sera fait d'après tes réponses.", model: used, cost, version: SCAN_PROMPT_VERSION };
  }
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new HttpError(502, "L'analyse n'a pas marché. Réessaie dans un instant."); }
  console.log(`Scan ${SCAN_PROMPT_VERSION} · ${used} · ${(cost / 1e6).toFixed(4)} $`);
  return { ...toResult(parsed), model: used, cost, version: SCAN_PROMPT_VERSION };
}
