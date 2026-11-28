# Préparation Google Play — Solid'Aid

Ce document décrit la configuration présente dans le dépôt. Il ne prouve pas le contenu du binaire final, l'état du compte Play Console, les services de production ou l'approbation de Google. Toute déclaration Console doit être vérifiée à partir de la version effectivement compilée et des prestataires réellement utilisés.

## Configuration Android observée

- Package configuré : `fr.solidaid.app`.
- Version : `1.0.0`, `versionCode: 4` (à incrémenter à chaque nouvel envoi en Console).
- Target API / compile SDK : 36, configurés via le plugin `expo-build-properties` (vérifié dans le manifeste généré par `expo prebuild`).
- `android:allowBackup="false"` et `usesCleartextTraffic="false"` : pas de sauvegarde cloud des données de session, pas de trafic HTTP non chiffré.
- Profil EAS production : AAB (`app-bundle`).
- Permissions du manifeste final : `INTERNET`, `VIBRATE`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` (premier plan uniquement), `CAMERA`. Sont explicitement retirées (`tools:node="remove"`) : stockage externe, `READ_MEDIA_*`, `RECORD_AUDIO`, `ACCESS_BACKGROUND_LOCATION`, `SYSTEM_ALERT_WINDOW`. Les photos utilisent le Photo Picker système.
- Jeton de session stocké chiffré (Android Keystore via `expo-secure-store`).
- Le dépôt ne contient pas de résultat de build signé. Vérifier dans l'AAB la cible SDK, le manifeste fusionné, la signature, le package et Play App Signing avant téléversement.

## Déclarations Play Console à effectuer

1. **Data Safety** : inventorier l'ensemble des données ci-dessous et les SDK/prestataires réellement actifs. Le code traite e-mail, identifiants de connexion, identité/profil, téléphone/adresse/SIREN, localisation, photos, signalements/commentaires, informations de dons, activité et journaux d'audit. Vérifier les finalités, partages, chiffrement et rétention auprès de l'exploitant et des prestataires.
2. **Suppression de compte** : renseigner la page publique `/delete-account`. Le formulaire envoie un lien à usage unique valable une heure ; la confirmation supprime le compte, les signalements et dons associés. Des journaux d'audit sans acteur et les sauvegardes jusqu'à leur expiration peuvent subsister.
3. **Ads** : aucun SDK publicitaire n'est déclaré dans les dépendances mobiles actuellement observées. Confirmer aussi les services externes et contenus sponsorisés avant de répondre.
4. **Health Apps** : compléter la déclaration même si aucune fonction médicale n'est déclarée. Le code comprend une catégorie « urgence médicale », des besoins de soins et des appels aux numéros d'urgence ; il ne faut pas déclarer du diagnostic ou du suivi médical sans fonction correspondante.
5. **Financial Features** : compléter la déclaration pour l'app. Le dépôt expose des liens HelloAsso et une estimation de dons alimentaires, mais pas de portefeuille ni de paiement in-app identifiés. Confirmer les services réellement promus.
6. **Public cible** : sélectionner les âges réellement visés ; le dépôt ne montre pas de fonction explicitement destinée aux enfants.
7. **Classification du contenu** : remplir le questionnaire IARC selon les textes, photos et contenus effectivement accessibles.
8. **Accès de l'examinateur** : fournir des identifiants de démonstration non privilégiés et les instructions pour citoyen, association et commerce si l'accès est restreint. Ne jamais communiquer de comptes d'administration personnels.
9. **Permissions** : le manifeste final doit être inspecté. Justifier seulement la localisation au premier plan et la caméra si requises ; le Photo Picker doit suffire pour les photos choisies.

## Fiche Play et assets

- Icône source : `client/assets/icon.png` (1024×1024). Préparer l'asset Play conforme selon l'interface Console.
- Feature graphic : `client/assets/play-store-feature-graphic.jpg` (1024×500).
- Captures d'écran téléphone : à capturer depuis une build réelle après validation fonctionnelle ; aucune capture de l'application réelle n'est fournie ici.
- URL de confidentialité : `https://<domaine-de-production>/privacy-policy`.
- URL de suppression : `https://<domaine-de-production>/delete-account`.
- Description courte proposée : « Signalez un besoin, trouvez des associations proches et suivez les actions solidaires locales. »
- Description complète proposée : « Solid'Aid met en relation citoyens, associations et commerces solidaires. Les citoyens peuvent transmettre un signalement avec localisation et besoins observés, puis suivre sa prise en charge. Les associations consultent les signalements qui leur sont affectés. Les commerces peuvent déclarer des invendus alimentaires disponibles pour des associations. La localisation et les photos sont facultatives et utilisées lors des actions choisies. Solid'Aid ne remplace pas les services d'urgence. En cas de danger immédiat, contactez les services d'urgence de votre pays. »

## Build

Depuis `client` : `npx eas build --platform android --profile production`. Vérifier que le versionCode est supérieur au dernier publié, que le target SDK du manifeste est 36 ou plus, que l'AAB est signé et que Play App Signing est activé. L'envoi en Console et la soumission à l'examen sont des étapes manuelles nécessitant l'accès au compte éditeur.

## Configuration serveur obligatoire

- `JWT_SECRET` : secret aléatoire d'au moins 32 caractères ; le serveur refuse de démarrer sans lui.
- `MONGODB_URI` : base de production.
- `CORS_ORIGINS` : origines Web autorisées, séparées par des virgules ; les clients mobiles sans Origin restent autorisés.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` : nécessaire à l'envoi des liens de confirmation Web.
- `PUBLIC_BASE_URL` : URL HTTPS publique du backend, sans slash final.
- Confirmer avec l'hébergeur les régions, sauvegardes, durées de rétention et sous-traitants afin de finaliser la politique et Data Safety.

## Sécurité (à indiquer dans Data Safety)

- Données chiffrées en transit : oui (HTTPS uniquement, trafic en clair désactivé dans l'app, HSTS côté API).
- Suppression des données sur demande : oui (dans l'app et via la page Web `/delete-account`).
- Protections API : limitation de débit (connexion, inscription, signalements anonymes), validation stricte des entrées (zod), protection contre l'injection NoSQL, JWT HS256 avec secret ≥ 32 caractères, mots de passe bcrypt.
- **Action obligatoire** : un identifiant MongoDB Atlas a été publié dans l'historique git (`server/.env.example`). Changer ce mot de passe dans Atlas et mettre à jour `MONGODB_URI` sur Render.

## Checklist avant soumission

- [ ] Changer le mot de passe MongoDB Atlas exposé et mettre à jour `MONGODB_URI` sur Render.
- [ ] Déployer et vérifier les variables serveur requises, SMTP, HTTPS, CORS et base de production.
- [ ] Tester la suppression in-app et le lien Web de bout en bout avec un compte de test, y compris les données associées.
- [ ] Créer des comptes de démonstration pour l'examen.
- [ ] Construire l'AAB, contrôler le manifeste, le target API, la signature et le versionCode.
- [ ] Compléter Data Safety, Ads, Health Apps, Financial Features, public cible, IARC et App Access dans Play Console.
- [ ] Vérifier les URLs légales depuis un réseau public.
- [ ] Capturer et ajouter des captures d'écran de la build finale.
- [ ] Importer en test interne, vérifier les parcours réels et ensuite envoyer la version à l'examen.
