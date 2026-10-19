# Guide de Déploiement & Mise en Production — Google Play Console
## Application : SOS CONNECT (Package : `fr.sosconnect.app`)

Ce guide récapitule toutes les exigences et la conformité aux normes strictes de **Google Play Console (2024 / 2026)** pour la mise en production de l'application **SOS CONNECT**.

---

## 1. Synthèse de Conformité Google Play

| Exigence Google Play | Statut SOS CONNECT | Détail d'implémentation |
| :--- | :---: | :--- |
| **Format du binaire** | Conforme | Android App Bundle (**`.aab`**) via EAS Build (`eas.json`). |
| **Niveau d'API cible (Target SDK)** | Conforme | Expo SDK 54 cible **Android 15 (API 35)** (exigence minimale Google : API 34+). |
| **Architecture 64 bits** | Conforme | Hermes Bytecode et binaires React Native 64-bit (`arm64-v8a`, `x86_64`). |
| **Package ID unique** | Conforme | `fr.sosconnect.app` configuré dans `client/app.json`. |
| **Version & VersionCode** | Conforme | `version: "1.0.0"`, `versionCode: 1` configurés. |
| **Icônes adaptatives Android** | Conforme | `adaptive-icon.png` (premier plan) avec fond vert émeraude `#0F7D63` dans `client/assets/`. |
| **Écran de démarrage (Splash)** | Conforme | `splash.png` configuré dans `client/assets/` et `app.json`. |
| **Politique de confidentialité (RGPD)** | Conforme | Accessible dans l'application via un modal et en ligne sur `/privacy-policy`. |
| **Suppression du compte (Règle Google)** | Conforme | Accessible directement dans l'app (profil) et via URL web publique `/delete-account`. |
| **Permissions justifiées** | Conforme | Déclarées avec descriptions précises en français (`expo-location`, `expo-image-picker`). |
| **Aucun tracking arrière-plan** | Conforme | Aucune demande de permission `ACCESS_BACKGROUND_LOCATION`. |

---

## 2. Visuels et Assets pour la fiche Play Store

Les fichiers nécessaires pour la fiche du magasin sont disponibles dans [client/assets/](file:///c:/Users/AXELL/Desktop/stage/client/assets/) :

- **Icône de l'application (512x512)** : [client/assets/icon.png](file:///c:/Users/AXELL/Desktop/stage/client/assets/icon.png)
- **Icône adaptative Android** : [client/assets/adaptive-icon.png](file:///c:/Users/AXELL/Desktop/stage/client/assets/adaptive-icon.png)
- **Graphique de fonctionnalité / Bannière Play Store (1024x500)** : [client/assets/play-store-banner.jpg](file:///c:/Users/AXELL/Desktop/stage/client/assets/play-store-banner.jpg)
- **Écran de chargement (Splash)** : [client/assets/splash.png](file:///c:/Users/AXELL/Desktop/stage/client/assets/splash.png)

---

## 3. URLs Obligatoires pour la Console Google Play

Lors de la configuration de votre fiche Google Play, vous devez renseigner deux URLs obligatoires servies directement par votre backend :

1. **URL de la politique de confidentialité :**
   `https://[votre-domaine-en-production]/privacy-policy`
   *(ou `https://[votre-domaine-en-production]/api/legal/privacy`)*

2. **URL de demande de suppression du compte et des données :**
   `https://[votre-domaine-en-production]/delete-account`
   *(Obligatoire depuis la mise à jour Google Play sur la gestion des comptes utilisateurs)*

---

## 4. Fiche « Sécurité des Données » (Data Safety) Google Play

Voici les réponses exactes à cocher lors du remplissage du questionnaire Google Play :

### A. Collecte et partage des données
- **Votre application collecte-t-elle ou partage-t-elle des types de données utilisateur ?**  
  👉 **Oui**
- **Toutes les données utilisateur collectées par votre application sont-elles chiffrées en transit ?**  
  👉 **Oui** (via HTTPS / TLS)
- **Fournissez-vous un moyen pour les utilisateurs de demander la suppression de leurs données ?**  
  👉 **Oui** (dans l'application et via l'URL web `/delete-account`)

### B. Types de données collectées
1. **Localisation :**
   - *Position approximative* : Oui
   - *Position précise* : Oui
   - *Finalité* : Fonctionnalité de l'application (situer les signalements et orienter les équipes vers les personnes en difficulté).
   - *Partage* : Partagé avec des tiers (uniquement les associations humanitaires habilitées).
   - *Éphémère ?* : Non.

2. **Informations personnelles :**
   - *Adresse e-mail* : Oui (gestion de compte, authentification, notifications).
   - *Nom ou Nom de la structure* : Oui (associations et commerçants).
   - *Numéro de téléphone* : Facultatif (pour coordination terrain des associations).

3. **Photos et vidéos :**
   - *Photos* : Oui (facultatif, uniquement si l'utilisateur prend ou joint une photo pour illustrer un signalement ou un don d'invendus).

---

## 5. Comment générer le fichier de production `.aab`

### Prérequis
Installer EAS CLI si ce n'est pas déjà fait :
```bash
npm install -g eas-cli
```

### Connexion à votre compte Expo
```bash
eas login
```

### Lancer la compilation de production
Rendez-vous dans le dossier `client` ou exécutez depuis la racine :
```bash
npm run build:android
```
*(ou `cd client && eas build --platform android --profile production`)*

Le service EAS génère automatiquement un fichier **`.aab`** signé, prêt à être téléchargé et uploadé dans la console Google Play sous :
**Google Play Console > Production > Créer une version**.

---

## 6. Variables d'environnement en production

Avant le build final de production, assurez-vous que `EXPO_PUBLIC_API_URL` dans [client/.env](file:///c:/Users/AXELL/Desktop/stage/client/.env) pointe vers votre domaine sécurisé HTTPS :
```env
EXPO_PUBLIC_API_URL=https://api.votre-domaine.fr/api
```
