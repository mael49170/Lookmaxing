// Serveur local : node dev/server.mjs [port]   puis http://localhost:8788/q/
// Sert src/ et fait tourner les fonctions de functions/api comme sur Cloudflare Pages.
// Les clés se mettent dans .dev.vars (CLE=valeur). Sans clés : DEV_FAKE_SCAN=1 et DEV_FAKE_PAY=1 font des essais gratuits.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { localD1 } from "./d1.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = parseInt(process.argv[2] || "8788", 10);
export const env = { DEV_FAKE_SCAN: "1", DEV_FAKE_PAY: "1", DEV_SHOW_CODE: "1" };
const varsFile = join(root, ".dev.vars");
if (existsSync(varsFile)) {
  for (const line of readFileSync(varsFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
}
// Pour un essai ponctuel sans toucher à .dev.vars : DEV_SET_CLE=valeur node dev/server.mjs (ex. DEV_SET_META_PIXEL_ID=123)
for (const [k, v] of Object.entries(process.env)) if (k.startsWith("DEV_SET_")) env[k.slice(8)] = v;
env.DB = localD1(env.LOCAL_DB_FILE ? join(root, env.LOCAL_DB_FILE) : ":memory:");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain; charset=utf-8" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:" + port);
  try {
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, "");
      const file = join(root, "functions/api", name + ".js");
      if (!existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
      const mod = await import(pathToFileURL(file).href + "?t=" + statSync(file).mtimeMs);
      const method = req.method.charAt(0) + req.method.slice(1).toLowerCase();
      const fn = mod["onRequest" + method] || mod.onRequest;
      if (!fn) { res.writeHead(405); return res.end("Method not allowed"); }
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const request = new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) });
      const response = await fn({ request, env, params: {} });
      const headers = Object.fromEntries(response.headers);
      const cookies = response.headers.getSetCookie?.() || [];
      if (cookies.length) headers["set-cookie"] = cookies;
      res.writeHead(response.status, headers);
      return res.end(Buffer.from(await response.arrayBuffer()));
    }
    let p = join(root, "src", decodeURIComponent(url.pathname));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
    // comme Cloudflare Pages : une adresse inconnue reçoit src/404.html avec le code 404
    if (!existsSync(p)) { res.writeHead(404, { "content-type": "text/html; charset=utf-8" }); return res.end(readFileSync(join(root, "src", "404.html"))); }
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(readFileSync(p));
  } catch (err) {
    console.error(err);
    res.writeHead(500); res.end(String(err));
  }
}).listen(port, () => console.log("En local : http://localhost:" + port + "/q/"));
