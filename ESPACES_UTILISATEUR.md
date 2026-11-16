# Espaces utilisateur de SOS Link

Ce document décrit les espaces fonctionnels de l'application et les actions
accessibles selon le rôle connecté.

## 1. Espace public

Accessible sans compte :

- Présentation du service SOS Link et de son objectif solidaire.
- Présentation des acteurs : citoyens, associations et restaurateurs.
- Accès à l'inscription et à la connexion.
- Consultation des articles du blog.
- Consultation des informations légales et de la politique de confidentialité.
- Accès aux informations de contact et aux liens utiles.

Les signalements ne sont pas publics. La carte et les informations
opérationnelles sont accessibles uniquement aux utilisateurs autorisés.

## 2. Espace commun aux utilisateurs connectés

Après connexion, tous les utilisateurs peuvent :

- Consulter un tableau de bord adapté à leur rôle.
- Accéder à leur profil et modifier leurs informations autorisées.
- Se déconnecter.
- Demander la suppression de leur compte (suppression logique).
- Consulter les messages d'erreur et les confirmations liées à leurs actions.

L'accès aux données est limité par rôle. Un compte association ou restaurant
reste en attente de validation administrative avant d'utiliser les fonctions
opérationnelles de son organisation.

## 3. Espace citoyen

### Signalements

- Créer un signalement individuel ou concernant un groupe.
- Localiser la situation avec une position GPS ou des coordonnées.
- Ajouter une adresse ou un repère.
- Décrire la situation et préciser les besoins : alimentation, hébergement,
  soins, vêtements, hygiène, soutien psychologique ou autre.
- Indiquer le niveau d'urgence :
  - **Stable** : besoins non critiques ;
  - **Important** : intervention souhaitée ;
  - **Critique** : appeler le 15 ou le 18.
- Ajouter les informations utiles sur la personne ou le groupe : tranche
  d'âge, genre apparent, barrière de la langue, échange avec la personne et
  demande d'aide.
- Consulter uniquement ses propres signalements.
- Modifier un signalement et suivre son état : nouveau, en cours, résolu ou
  retiré.

### Actions rapides

- Accéder rapidement à la création d'un signalement.
- Consulter ses signalements depuis le tableau de bord.
- Accéder aux informations d'aide et aux ressources disponibles.

## 4. Espace association partenaire

### File d'intervention

- Consulter les signalements qui lui sont affectés.
- Filtrer les situations selon leur statut, leur urgence et leurs besoins.
- Consulter la localisation, la description et les besoins à couvrir.
- Marquer les besoins pris en charge.
- Ajouter des notes d'intervention.
- Proposer un changement de statut du signalement.
- Suivre les signalements jusqu'à leur résolution.

### Dons alimentaires

- Consulter les dons alimentaires affectés à l'association.
- Voir les informations utiles du restaurateur et du retrait.
- Mettre à jour le don lorsqu'il est collecté.

### Profil de l'organisation

- Gérer le nom, les coordonnées et les services proposés.
- Déclarer la zone d'intervention et les besoins couverts.
- Fournir les informations administratives nécessaires à la validation.

## 5. Espace restaurateur / commerce

### Déclaration d'invendus

- Déclarer un don alimentaire avec sa description et sa quantité.
- Ajouter une photo ou un lien vers une photo.
- Indiquer la date de disponibilité et les créneaux de retrait.
- Consulter l'association affectée automatiquement au don.
- Suivre l'état du don : déclaré, affecté, collecté ou annulé.

### Valorisation et suivi

- Consulter l'estimation de quantité, de prix unitaire et de valeur du don.
- Consulter le récapitulatif annuel des dons.
- Télécharger ou demander le reçu fiscal annuel lorsque cette fonction est
  disponible côté administration.

### Profil de l'organisation

- Gérer les informations du commerce : nom, adresse, téléphone et SIREN/SIRET.
- Fournir les informations nécessaires à la validation du compte.

## 6. Espace administrateur

L'administrateur dispose d'une supervision globale de la plateforme.

### Tableau de bord

- Voir le nombre d'utilisateurs.
- Voir le nombre de signalements et de signalements résolus.
- Voir les statuts de signalements en attente de confirmation.
- Voir le nombre de dons déclarés.

### Gestion des utilisateurs et organisations

- Consulter les utilisateurs.
- Consulter les demandes d'inscription des associations et restaurateurs.
- Activer ou refuser une organisation.
- Informer l'organisation de la décision par e-mail.
- Supprimer un compte utilisateur.

### Modération des signalements

- Consulter l'ensemble des signalements.
- Vérifier les changements de statut proposés par les associations.
- Confirmer ou refuser ces changements.
- Ajouter des notes de modération.
- Retirer un signalement si nécessaire.

### Gestion des dons et de la valorisation

- Consulter tous les dons.
- Vérifier les affectations et les statuts de collecte.
- Consulter les données de valorisation utilisées pour les dons.

### Blog et articles

- Créer un article.
- Consulter les articles publiés.
- Supprimer un article.

### Reçus fiscaux

- Rechercher les dons d'un restaurateur pour une année donnée.
- Générer et envoyer le récapitulatif ou le reçu fiscal annuel.

## 7. Authentification et règles d'accès

- Inscription avec e-mail, mot de passe, rôle et consentement RGPD.
- Les citoyens sont activés automatiquement.
- Les associations et restaurateurs sont créés avec le statut **en attente**.
- Connexion par e-mail et mot de passe avec session JWT.
- Les routes opérationnelles vérifient le rôle et, lorsque nécessaire, la
  validation de l'organisation.
- Les données personnelles sont limitées au besoin fonctionnel de chaque rôle.

## 8. Fonctionnalités prévues, mais pas encore garanties par le MVP

Ces éléments sont mentionnés comme évolutions dans le projet et ne doivent pas
être considérés comme entièrement disponibles :

- Géocodage automatique avec Mapbox ou Google Maps.
- Remplacement de l'estimation actuelle par une véritable API de vision.
- Vérification réelle des adresses e-mail.
- Stockage de photos avec S3 ou Cloudinary.
- Application mobile React Native/Expo complète partageant les contrats API.
- Tests API et tests end-to-end supplémentaires.
