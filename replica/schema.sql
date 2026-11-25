-- Base Cloudflare D1 (SQLite). Même façon de faire que Kadrio (lib/db.js) :
-- identifiants texte (crypto.randomUUID()), dates en millisecondes UTC (INTEGER),
-- argent en centimes + devise, contrôle d'accès dans le code (une vérification par requête :
-- D1 n'a pas de « row level security »).
-- Aucune photo n'est jamais enregistrée : pas de colonne pour elles, nulle part.

-- Un passage dans le quiz (anonyme jusqu'à l'e-mail)
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  variant TEXT NOT NULL DEFAULT 'a',                 -- test A/B de l'accueil
  gender TEXT CHECK (gender IN ('homme','femme')),
  age_band TEXT CHECK (age_band IN ('18-24','25-34','35-44','45-54','55+')), -- jamais « moins de 18 » : on n'enregistre rien
  answers TEXT NOT NULL DEFAULT '{}',                -- JSON { question_id: valeur(s) }
  bet TEXT CHECK (bet IN ('a_travailler','moyen','correct','beau','canon')),
  scan_consent_at INTEGER,                           -- consentement biométrique (null = refusé ou pas encore)
  scan_consent_version TEXT,                         -- quel texte a été accepté
  utm_source TEXT NOT NULL DEFAULT '', utm_campaign TEXT NOT NULL DEFAULT '', utm_content TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',                  -- pour limiter les scans par IP, jamais l'IP en clair
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS quizzes_created ON quizzes(created_at);

-- Le résultat du scan : des notes, jamais les photos ni les mesures du visage
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL UNIQUE REFERENCES quizzes(id) ON DELETE CASCADE, -- 1 scan par quiz : limite le coût
  score_now INTEGER NOT NULL CHECK (score_now BETWEEN 0 AND 100),
  score_max INTEGER NOT NULL CHECK (score_max BETWEEN 0 AND 100),
  factors TEXT NOT NULL,                             -- JSON : 15 critères { id, note, phrase }
  model TEXT NOT NULL,                               -- modèle Claude utilisé (pour les logs et le coût)
  cost_microusd INTEGER NOT NULL DEFAULT 0,          -- coût réel de l'appel, d'après usage
  delete_after INTEGER NOT NULL,                     -- effacement auto si pas d'achat (politique biométrique)
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS scans_delete ON scans(delete_after);

-- L'e-mail laissé à l'écran S25
CREATE TABLE IF NOT EXISTS leads (
  quiz_id TEXT PRIMARY KEY REFERENCES quizzes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_key TEXT NOT NULL,                           -- e-mail en minuscules, pour retrouver
  marketing_optin INTEGER NOT NULL DEFAULT 0 CHECK (marketing_optin IN (0,1)), -- case décochée par défaut
  unsubscribed_at INTEGER,
  last_nudge_at INTEGER,
  nudges INTEGER NOT NULL DEFAULT 0,                 -- relances déjà envoyées (2 au plus)
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS leads_email ON leads(email_key);

-- Le client, créé au premier paiement
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_key TEXT NOT NULL UNIQUE,
  quiz_id TEXT REFERENCES quizzes(id) ON DELETE SET NULL, -- le quiz qui a mené à l'achat
  stripe_customer TEXT NOT NULL DEFAULT '',
  reminder_optin INTEGER NOT NULL DEFAULT 0 CHECK (reminder_optin IN (0,1)), -- rappel quotidien (S24)
  last_reminder_day TEXT NOT NULL DEFAULT '',         -- dernier rappel envoyé (jour de Paris), un par jour au plus
  unsubscribed_at INTEGER,                            -- désinscrit de tous les e-mails non indispensables
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Connexion sans mot de passe (copie de Kadrio)
CREATE TABLE IF NOT EXISTS login_codes (
  email_key TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL, link_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, ip TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_customer ON sessions(customer_id);

-- L'abonnement (copie locale de Stripe, Stripe fait foi)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,                               -- id Stripe sub_...
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'membre' CHECK (kind IN ('membre','coach')),
  offer TEXT NOT NULL,                               -- clé de l'offre dans src/plans.js
  intro_cents INTEGER NOT NULL, renew_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'eur',
  interval TEXT NOT NULL CHECK (interval IN ('week','month','quarter','year')),
  status TEXT NOT NULL CHECK (status IN ('active','past_due','canceled','incomplete')),
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  current_period_end INTEGER NOT NULL,              -- fin de la période en cours (fin de l'essai pendant l'essai)
  trial_end INTEGER,                                 -- fin des 3 jours à 0,99 €
  ends_at INTEGER,                                   -- fin de l'accès si résilié (après la semaine d'engagement)
  withdrawal_waived_at INTEGER,                      -- renonciation au délai de 14 jours (UE), cochée au paiement
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS subs_customer ON subscriptions(customer_id, status);

-- Le plan jour par jour, tiré de notre bibliothèque de tâches (pas écrit par l'IA)
CREATE TABLE IF NOT EXISTS plans (
  customer_id TEXT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  library_version TEXT NOT NULL,                     -- version de la bibliothèque de tâches
  days TEXT NOT NULL,                                -- JSON : [{ jour, taches: [task_id] }]
  start_day TEXT NOT NULL,                           -- AAAA-MM-JJ, heure de Paris
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);

-- Les cases cochées (le suivi)
CREATE TABLE IF NOT EXISTS task_checks (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  day TEXT NOT NULL,                                 -- AAAA-MM-JJ, heure de Paris
  task_id TEXT NOT NULL,
  done_at INTEGER NOT NULL,
  PRIMARY KEY (customer_id, day, task_id)            -- cocher deux fois = une seule ligne
);

-- Les événements Stripe déjà traités (un webhook arrive parfois deux fois)
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,                               -- evt_...
  type TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);

-- Achats d'options (could) : rapport peau, rapport tenue, pack
CREATE TABLE IF NOT EXISTS addon_purchases (
  id TEXT PRIMARY KEY,                               -- id Stripe pi_...
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  addon TEXT NOT NULL CHECK (addon IN ('coach','pack','rapport_peau','rapport_tenue')),
  amount_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'eur',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS addons_customer ON addon_purchases(customer_id);

-- Limites (scans par IP, codes de connexion) : copie de Kadrio
CREATE TABLE IF NOT EXISTS hits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);

-- Compteur du tunnel, sans donnée personnelle : combien passent chaque écran, par jour, variante et source
CREATE TABLE IF NOT EXISTS funnel (
  day TEXT NOT NULL, step TEXT NOT NULL, variant TEXT NOT NULL DEFAULT 'a', source TEXT NOT NULL DEFAULT '',
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, step, variant, source)
);
