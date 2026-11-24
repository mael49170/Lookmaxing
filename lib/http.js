// Petites aides pour les fonctions Cloudflare Pages.

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

export async function readJson(request, maxBytes = 200_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, "Requête trop grande");
  try { return JSON.parse(text || "{}"); } catch { throw new HttpError(400, "JSON invalide"); }
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function handle(fn) {
  return async (context) => {
    try {
      return await fn(context);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      return json({ error: err.message || "Erreur", ...(err.code ? { code: err.code } : {}), ...(err.details ? { details: err.details } : {}) }, status);
    }
  };
}

