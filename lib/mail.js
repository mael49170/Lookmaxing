import { OFFERS, DEFAULT_OFFER, priceLines, guaranteeText } from "../src/shared/plans.js";
// E-mails (Resend), écrits pour ce projet. Sans clé, rien n'est envoyé : en local, le contenu s'affiche dans la console.
const FROM_DEFAULT = "Lookmaxing <bonjour@example.com>"; // à remplacer par l'adresse du vrai domaine (MAIL_FROM)

export async function sendMail(env, { to, subject, html, text, headers }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[e-mail non envoyé, RESEND_API_KEY absente] À : ${to} · ${subject}\n${text}`);
    return { sent: false };
  }
  const res = await (env.FETCH || fetch)("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM || FROM_DEFAULT, to: [to], subject, html, text, ...(env.MAIL_REPLY_TO ? { reply_to: env.MAIL_REPLY_TO } : {}), ...(headers ? { headers } : {}) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error("Envoi de l'e-mail impossible (" + (data.message || res.status) + ")");
  }
  return { sent: true };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const btn = (href, label) => `<tr><td style="padding:8px 0 16px"><a href="${esc(href)}" style="display:inline-block;background:#3346d3;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">${esc(label)}</a></td></tr>`;
const p = (t) => `<tr><td style="font-size:15px;line-height:1.5;padding-bottom:12px">${t}</td></tr>`;

function layout(title, rows, foot) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f5f6;font-family:Arial,Helvetica,sans-serif;color:#0d0d0f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:28px">
<tr><td style="font-size:20px;font-weight:800;padding-bottom:18px">Lookmaxing</td></tr>
<tr><td style="font-size:18px;font-weight:700;padding-bottom:12px">${esc(title)}</td></tr>
${rows}
<tr><td style="font-size:12px;color:#5f5f68;padding-top:20px">${foot}</td></tr>
</table></td></tr></table></body></html>`;
}
const FOOT = "Tu reçois cet e-mail parce que cette adresse a été saisie sur Lookmaxing.";
const unsubFoot = (u) => `${FOOT} <a href="${esc(u)}" style="color:#5f5f68">Ne plus recevoir ces e-mails</a>.`;
const listUnsub = (u) => ({ "List-Unsubscribe": `<${u}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });

export function loginMail(code, link) {
  return {
    subject: `Ton code : ${code}`,
    html: layout("Ton code de connexion", p("Entre ce code :") + `<tr><td style="font-size:32px;font-weight:800;letter-spacing:8px;padding-bottom:16px">${esc(code)}</td></tr>` + p("Ou connecte-toi directement depuis ce téléphone :") + btn(link, "Me connecter") + p("Le code et le lien marchent 15 minutes."), FOOT + " Si ce n'est pas toi, ignore-le."),
    text: `Ton code : ${code}\nOu ce lien : ${link}\nValable 15 minutes.`,
  };
}

// Récapitulatif de l'offre, envoyé juste après l'achat : le client sait ce qu'il a accepté et comment arrêter
// (les réseaux de cartes l'exigent pour les offres d'essai, et c'est ce qui évite les litiges)
export function welcomeMail(link, { offer = DEFAULT_OFFER, trial = true } = {}) {
  const lines = priceLines(OFFERS[offer] || OFFERS[DEFAULT_OFFER], trial);
  return {
    subject: "Ton plan est prêt",
    html: layout("C'est parti", p("Ta note, ton détail critère par critère et ton plan de 28 jours t'attendent. Ce bouton t'ouvre directement ton espace, sans mot de passe (il marche 3 jours).") + btn(link, "Ouvrir mon espace")
      + p("<b>Ton abonnement :</b> " + esc(lines.full))
      + p("Pour arrêter : dans ton espace, « Résilier mon abonnement », en un clic.")
      + p("<b>Satisfait ou remboursé :</b> " + esc(guaranteeText()))
      + p("Plus tard, depuis n'importe quel téléphone : entre ton e-mail sur la page de connexion, on t'envoie un code."), FOOT),
    text: `Ton rapport et ton plan t'attendent : ${link}\nTon abonnement : ${lines.full}\nPour arrêter : dans ton espace, « Résilier mon abonnement ».`,
  };
}

export function paymentFailedMail(link) {
  return {
    subject: "Ton paiement n'est pas passé",
    html: layout("Ton paiement n'est pas passé", p("Ta banque a refusé le dernier prélèvement. Mets ta carte à jour pour garder ton plan.") + btn(link, "Mettre ma carte à jour") + p("Tu préfères arrêter ? Tu peux aussi résilier depuis le même endroit."), FOOT),
    text: `Ton dernier prélèvement n'est pas passé. Mets ta carte à jour : ${link}`,
  };
}

export function reminderMail({ day, tasks, link, unsubscribe }) {
  const list = tasks.map((t) => `<li style="margin-bottom:6px">${esc(t)}</li>`).join("");
  return {
    subject: `Jour ${day} : ${tasks.length} choses à faire aujourd'hui`,
    html: layout(`Jour ${day}`, `<tr><td style="font-size:15px;line-height:1.5;padding-bottom:12px"><ul style="padding-left:18px;margin:0">${list}</ul></td></tr>` + btn(link, "Cocher ce que j'ai fait"), unsubFoot(unsubscribe)),
    text: `Jour ${day} :\n${tasks.map((t) => "- " + t).join("\n")}\n${link}\nNe plus recevoir ces e-mails : ${unsubscribe}`,
    headers: listUnsub(unsubscribe),
  };
}

export function nudgeMail(n, { link, unsubscribe }) {
  const first = n === 1;
  return {
    subject: first ? "Ton plan t'attend" : "Dernier rappel pour ton plan",
    html: layout(first ? "Ton plan t'attend" : "Dernier rappel", p(first ? "Tu as fait le quiz hier. Ton plan de 28 jours est prêt, il te reste juste à l'ouvrir." : "On ne t'écrira plus à ce sujet. Si tu veux ton plan, il est toujours là.") + btn(link, "Voir mon plan"), unsubFoot(unsubscribe)),
    text: `${first ? "Ton plan t'attend" : "Dernier rappel"} : ${link}\nNe plus recevoir ces e-mails : ${unsubscribe}`,
    headers: listUnsub(unsubscribe),
  };
}

// Lien de désinscription signé (pas besoin de se connecter pour se désinscrire)
// ref : "c:<id client>" ou "l:<id quiz>" (jamais l'adresse e-mail dans un lien)
export async function unsubToken(env, ref) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.UNSUB_SECRET || "dev-seulement"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("unsub:" + ref));
  return [...new Uint8Array(mac)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function unsubLink(env, origin, ref) {
  return `${origin}/api/unsubscribe?r=${encodeURIComponent(ref)}&t=${await unsubToken(env, ref)}`;
}
