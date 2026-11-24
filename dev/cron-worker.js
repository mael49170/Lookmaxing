// Petit Worker Cloudflare qui lance les tâches du jour (nettoyage, rappels, relances).
// Cloudflare -> Workers & Pages -> Créer -> Worker, coller ce fichier, puis :
//  - Settings -> Variables : SITE_URL (ex. https://monsite.fr) et CRON_SECRET (le même que sur le site)
//  - Triggers -> Cron : "0 7 * * *" (7 h UTC = 8 h l'hiver à Paris, 9 h l'été)
export default {
  async scheduled(event, env) {
    const res = await fetch(env.SITE_URL + "/api/cron", { method: "POST", headers: { authorization: "Bearer " + env.CRON_SECRET } });
    console.log("cron", res.status, await res.text());
  },
};
