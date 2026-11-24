# Bugs

Ouverts : aucun. S1 : 0. S2 : 0. S3 : 3 (corrigés). S4 : 0.

### BUG-001 : au clavier, la flèche valide la réponse et change d'écran
- Severity: S3
- Flow / case: F01 / F01-E4
- Screen: S02, S03, S12–S22 (choix unique)
- Build: 80ae5b3  Browser / device: Chromium, 390 px

Steps
1. Ouvrir /q/, Tab sur « Commencer », Entrée.
2. Tab sur la 1re réponse, flèche bas.

Expected: la 2e réponse est choisie, on reste sur l'écran ; Entrée ou Espace valide.
Actual: l'écran suivant s'ouvre tout de suite, avec la 2e réponse : impossible d'atteindre la 3e au clavier.
Evidence: e2e F01-E4 (échouait avant la correction).
Suspected cause: le passage automatique se faisait sur chaque changement de bouton radio, y compris aux flèches.
Status: fixed (flèches = choisir, Entrée / Espace / clic = valider)

### BUG-002 : 3 scans par jour et par adresse IP, trop peu en 4G
- Severity: S3
- Flow / case: F01 / F01-E9
- Screen: S07
- Build: 80ae5b3

Steps
1. Faire 4 quiz avec scan depuis la même connexion.

Expected: les personnes qui partagent une adresse IP (4G, wifi d'entreprise) peuvent toutes faire leur scan.
Actual: le 4e scan est refusé (429). Les opérateurs mobiles français partagent une même adresse entre beaucoup de clients.
Evidence: test « limite de scans par connexion » ; e2e qui échouaient en série avec des 429.
Status: fixed (10 par défaut, réglable avec SCANS_PER_IP ; la vraie protection reste l'anti-robot et « 1 scan par quiz »)

### BUG-003 : page de connexion, les deux formulaires s'affichent ensemble
- Severity: S3
- Flow / case: F04 / F04-H1
- Screen: S30
- Build: 80ae5b3

Steps
1. Ouvrir /connexion/.

Expected: seulement le champ e-mail ; le champ code apparaît après l'envoi.
Actual: le champ code et « Me connecter » sont visibles dès le départ, et le restent après.
Evidence: e2e/echec-F04-H1.png (avant correction).
Suspected cause: la classe .stack (display: flex) passait devant l'attribut hidden.
Status: fixed (règle [hidden] { display: none !important } dans components.css)

## À vérifier (pas reproduit)
- L'analyse réelle de Claude sur de vraies photos : stabilité de la note (test à la main, voir test-plan.md).
- Rechargement pendant l'analyse sur iPhone : les photos sont perdues, on propose de les reprendre (code prévu, pas essayé sur un vrai téléphone).
