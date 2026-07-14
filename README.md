# SOS Link MERN

MVP full stack MERN pour coordonner les signalements citoyens, les associations humanitaires et les dons alimentaires restaurateurs en Ile-de-France.

## Stack

- Frontend web: React, Vite, Zustand, Axios, React Leaflet
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Zod
- Emails: Nodemailer, avec mode mock si SMTP non configure
- IA dons alimentaires: service `valuation` remplaçable par une API vision

## Plan expert

1. MVP socle
   - Authentification email/mot de passe avec JWT.
   - Roles `citizen`, `association`, `restaurant`, `admin`.
   - Validation manuelle admin pour associations et restaurateurs.
   - Signalements individuels et groupes avec geolocalisation.
   - Vue citoyen limitee a ses propres signalements.
   - Vue association limitee aux signalements affectes.
   - Matching automatique par zone geographique et besoins.

2. Module anti-gaspillage
   - Declaration d'invendus par restaurateur.
   - Affectation a une association locale.
   - Estimation financiere MVP par regles metier.
   - Recapitulatif annuel pour reçus fiscaux.

3. Admin
   - Tableau de bord global.
   - Validation/refus des comptes.
   - Moderation via routes admin.

4. Prochaines evolutions
   - Brancher Mapbox ou Google Maps pour geocodage/adresses.
   - Remplacer `valuation.js` par une API vision.
   - Ajouter verification email reelle.
   - Ajouter tests API et tests e2e.
   - Ajouter stockage photos S3/Cloudinary.
   - Ajouter React Native/Expo en partageant les contrats API.

## Installation

```bash
npm run install:all
```

Copier les fichiers d'environnement:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Demarrer MongoDB localement, puis creer un admin:

```bash
npm run seed:admin --prefix server
```

Identifiants par defaut:

- Email: `admin@soslink.fr`
- Mot de passe: `Admin12345!`

## Lancement

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000/api/health`

## API principale

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/reports`
- `POST /api/reports`
- `PATCH /api/reports/:id`
- `GET /api/donations`
- `POST /api/donations`
- `GET /api/donations/annual-summary/:year`
- `GET /api/admin/dashboard`
- `GET /api/admin/organizations/pending`
- `PATCH /api/admin/organizations/:id/status`

## RGPD et securite deja pris en compte

- Collecte minimale pour citoyens.
- Suppression logique du compte.
- Acces restreints par role.
- Donnees de valorisation visibles par admin, et recap annuel cote restaurateur.
- Aucun signalement public.
