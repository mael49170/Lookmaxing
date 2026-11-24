// Base de données Cloudflare D1 (SQLite) et petites aides partagées.
import { SCHEMA } from "./schema.js";

export const DAY = 864e5;
export const now = () => Date.now();

const ready = new WeakSet();
export async function db(env) {
  const d = env.DB;
  if (!d) return null;
  if (!ready.has(d)) {
    await d.batch(SCHEMA.map((s) => d.prepare(s)));
    ready.add(d);
  }
  return d;
}

export function randomId(bytes = 16) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export const uuid = () => crypto.randomUUID();

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", typeof text === "string" ? new TextEncoder().encode(text) : text);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Limite simple : au plus `limit` passages par fenêtre de `windowMs` pour une clé
export async function hit(d, key, limit, windowMs) {
  const t = now();
  const row = await d.prepare("SELECT count, reset_at FROM hits WHERE key = ?").bind(key).first();
  if (!row || row.reset_at <= t) {
    await d.prepare("INSERT INTO hits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at").bind(key, t + windowMs).run();
    return true;
  }
  if (row.count >= limit) return false;
  await d.prepare("UPDATE hits SET count = count + 1 WHERE key = ?").bind(key).run();
  return true;
}

// Jour à Paris (AAAA-MM-JJ) : le « jour » du plan et des rappels
export function parisDay(ts = now()) {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts));
}
export function daysBetween(a, b) {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / DAY);
}

// Compteur du tunnel, sans donnée personnelle
export async function track(d, step, { variant = "a", source = "" } = {}) {
  const s = String(step || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
  if (!s) return;
  await d.prepare(`INSERT INTO funnel (day, step, variant, source, n) VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(day, step, variant, source) DO UPDATE SET n = n + 1`)
    .bind(parisDay(), s, String(variant).slice(0, 4), String(source).replace(/[^a-z0-9_.-]/gi, "").slice(0, 40)).run();
}
