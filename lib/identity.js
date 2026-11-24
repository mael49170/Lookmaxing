// Identité : e-mails, IP, cookies (quiz et session membre), anti-robot.
import { HttpError } from "./http.js";
import { db, sha256, randomId, now, DAY } from "./db.js";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function emailKey(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(e) || e.length > 200) return "";
  let [local, domain] = e.split("@");
  if (domain === "googlemail.com") domain = "gmail.com";
  local = local.split("+")[0];
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return local + "@" + domain;
}

export const clientIp = (request) => request.headers.get("cf-connecting-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
export const ipHash = async (request, env) => (await sha256((env.IP_SALT || "lm") + ":" + clientIp(request))).slice(0, 32);

export function readCookie(request, name) {
  const m = (request.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : "";
}
function cookie(name, value, request, maxAgeSec) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

// ---------- Quiz (anonyme) ----------
export const QUIZ_COOKIE = "lm_q";
export const quizCookie = (id, request) => cookie(QUIZ_COOKIE, id, request, 30 * 86400);

// Le quiz de la personne : l'identifiant vient du cookie, jamais du corps de la requête
export async function currentQuiz(request, env, { required = true } = {}) {
  const d = await db(env);
  if (!d) throw new HttpError(503, "Base de données non branchée");
  const id = readCookie(request, QUIZ_COOKIE);
  const quiz = id ? await d.prepare("SELECT * FROM quizzes WHERE id = ?").bind(id).first() : null;
  if (!quiz && required) throw new HttpError(401, "Recommence le quiz depuis le début.");
  return { d, quiz };
}

// ---------- Session membre ----------
const SESSION = "lm_s";
const SESSION_DAYS = 90;
export const sessionCookie = (token, request) => cookie(SESSION, token, request, SESSION_DAYS * 86400);
export const clearSession = () => `${SESSION}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export async function createSession(d, customerId) {
  const token = randomId(32);
  await d.prepare("INSERT INTO sessions (token_hash, customer_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), customerId, now(), now() + SESSION_DAYS * DAY).run();
  return token;
}

export async function currentCustomer(request, env, { required = true } = {}) {
  const d = await db(env);
  if (!d) throw new HttpError(503, "Base de données non branchée");
  const token = readCookie(request, SESSION);
  if (token) {
    const s = await d.prepare("SELECT customer_id, expires_at FROM sessions WHERE token_hash = ?").bind(await sha256(token)).first();
    if (s && s.expires_at > now()) {
      const customer = await d.prepare("SELECT * FROM customers WHERE id = ?").bind(s.customer_id).first();
      if (customer) return { d, customer, token };
    }
  }
  if (required) throw new HttpError(401, "Connecte-toi pour continuer.");
  return { d, customer: null };
}

// ---------- Anti-robot (Cloudflare Turnstile) ----------
// "ok", "missing" ou "invalid". Une panne ou un mauvais réglage de notre côté ne bloque jamais un client.
export async function checkTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return "ok";
  if (!token) return "missing";
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token).slice(0, 2048) });
    if (ip && ip !== "local") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (data.success) return "ok";
    const codes = data["error-codes"] || [];
    if (!res.ok || codes.some((c) => /secret|internal-error|bad-request/.test(c))) { console.error("Turnstile : réglage à vérifier", codes.join(",")); return "ok"; }
    return "invalid";
  } catch (err) {
    console.error("Turnstile injoignable", err.message);
    return "ok";
  }
}
