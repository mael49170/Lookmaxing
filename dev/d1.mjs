// Petit équivalent local de Cloudflare D1, basé sur le SQLite intégré à Node 22.
// Sert au serveur local (dev/server.mjs) et aux tests ; en ligne, c'est la vraie base D1.
import { DatabaseSync } from "node:sqlite";

class Stmt {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Stmt(this.db, this.sql, args.map((a) => (typeof a === "boolean" ? Number(a) : a))); }
  _p() { return this.db.prepare(this.sql); }
  async first(col) { const r = this._p().get(...this.args); return r === undefined ? null : col ? r[col] : { ...r }; }
  async all() { return { results: this._p().all(...this.args).map((r) => ({ ...r })), success: true, meta: {} }; }
  async run() { const r = this._p().run(...this.args); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; }
}

export function localD1(path = ":memory:") {
  const db = new DatabaseSync(path);
  return {
    prepare: (sql) => new Stmt(db, sql),
    async batch(stmts) {
      db.exec("BEGIN");
      try {
        const out = [];
        for (const s of stmts) out.push(/^\s*select/i.test(s.sql) ? await s.all() : await s.run());
        db.exec("COMMIT");
        return out;
      } catch (err) { db.exec("ROLLBACK"); throw err; }
    },
    async exec(sql) { db.exec(sql); return { count: 1 }; },
  };
}
