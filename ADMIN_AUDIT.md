# Audit du module administrateur

| Fonctionnalité | Implémentation existante | Fonctionnalité manquante | Correction requise |
|---|---|---|---|
| Authentification admin | JWT et `requireRole("admin")` sur `/api/admin` | Aucun contrôle métier de décision | Contrôles conservés et renforcés sur les actions |
| Tableau de bord | Comptages utilisateurs, rapports, résolus et dons | Organisations approuvées et demandes réellement en attente absentes/incomplètes | Ajout des statistiques MongoDB |
| Modération des rapports | Liste, urgence, type, photo, suppression et approbation simple | Recherche, dates, besoins, transitions valides, rejet motivé et historique absents | Filtres backend/frontend et historique persistant |
| Demandes d’associations | `pendingStatus` préserve temporairement le statut courant | Pas de statut de demande, décision, administrateur, date ou motif | Ajout de `statusChangeHistory` et workflow pending/approved/rejected |
| Organisations | Liste des organisations en attente et activation/refus | Refus sans motif, pas de validation admin/date, pas de vue globale | Métadonnées de validation, endpoint global et motif obligatoire |
| Utilisateurs | Liste par rôle et soft-delete admin | Recherche et filtre de statut absents | Ajout des filtres et conservation des références historiques |
| Dons | Vue par année et valorisation IA | Filtres restaurant/association/statut et transitions non contrôlées | Ajout des filtres et transitions `DECLARED → ASSIGNED → COLLECTED` |
| Blog | Création et suppression d’articles publiés | Validation structurée et mise à jour de publication absentes | Validation Zod et endpoint de mise à jour |
| Reçus fiscaux | Calcul annuel et envoi e-mail d’un récapitulatif texte | Ce n’est pas un justificatif fiscal légal vérifié | Fonction conservée, limite explicitement signalée |
| Journal d’audit | Aucun journal persistant | Actions admin non traçables | Ajout du modèle `AuditLog` et des événements principaux |
| Mobile admin | Statistiques et validation simple des organisations | Motif de refus et statistiques complètes absents | Motif guidé et statistiques approuvées/en attente |

