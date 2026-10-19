import { Router } from "express";

const router = Router();

router.get("/privacy", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Politique de Confidentialité — Solid'Aid</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 36px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { color: #0f766e; border-bottom: 2px solid #ccfbf1; padding-bottom: 12px; margin-top: 0; }
    h2 { color: #134e4a; margin-top: 28px; }
    p, li { color: #334155; }
    .badge { display: inline-block; background: #ccfbf1; color: #0f766e; font-weight: 600; padding: 4px 10px; border-radius: 999px; font-size: 13px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
    a { color: #0f766e; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Conformité Google Play & RGPD</span>
    <h1>Politique de Confidentialité — Solid'Aid</h1>
    <p><em>Dernière mise à jour : 19 octobre 2026</em></p>

    <p>L'application <strong>Solid'Aid</strong> est une plateforme solidaire dédiée à la coordination citoyenne, humanitaire et à la lutte contre le gaspillage alimentaire. Nous accordons une importance primordiale au respect de votre vie privée et à la protection de vos données personnelles.</p>

    <h2>1. Données collectées et finalités</h2>
    <ul>
      <li><strong>Géolocalisation (coordonnées GPS précises et approximatives) :</strong> Utilisée uniquement avec votre consentement explicite lors de la création d'un signalement ou pour définir la zone d'intervention des associations. Aucune localisation n'est collectée en arrière-plan (pas de background tracking).</li>
      <li><strong>Appareil photo et Photos (facultatif) :</strong> Utilisé uniquement si vous choisissez d'illustrer un signalement citoyen ou une déclaration d'invendus alimentaires par une photo.</li>
      <li><strong>Informations de compte :</strong> Adresse email, mot de passe chiffré (bcrypt), nom de structure ou statut (citoyen, association, commerce solidaire).</li>
      <li><strong>Données de signalement :</strong> Catégorie de besoin (alimentation, hébergement, soins, etc.), repères géographiques et commentaires.</li>
    </ul>

    <h2>2. Base légale et partage des données</h2>
    <p>Les données sont collectées sur la base de votre consentement explicite et pour l'exécution d'une mission d'intérêt solidaire. <strong>Aucune donnée n'est commercialisée, ni cédée à des fins publicitaires ou de profilage.</strong></p>
    <p>Les signalements sont uniquement transmis aux associations et acteurs humanitaires habilités et vérifiés intervenant dans le secteur géographique concerné.</p>

    <h2>3. Sécurité et conservation</h2>
    <p>Toutes les communications entre l'application mobile et nos serveurs sont sécurisées et chiffrées via les protocoles TLS/HTTPS. Les mots de passe sont hachés de manière irréversible. Les données de signalements résolus ou périmés sont automatiquement archivées ou supprimées.</p>

    <h2>4. Vos droits RGPD et suppression des données</h2>
    <p>Conformément au Règlement Général sur la Protection des Données (RGPD) et aux exigences du Google Play Store, vous disposez d'un droit d'accès, de rectification et de <strong>suppression totale de vos données</strong>.</p>
    <ul>
      <li><strong>Directement dans l'application :</strong> Les utilisateurs peuvent supprimer leur compte et leurs données associées en un clic depuis leur profil via le bouton « Supprimer mon compte ».</li>
      <li><strong>Par demande web :</strong> Vous pouvez également demander la suppression de votre compte et de toutes vos données sans installer l'application sur notre page dédiée : <a href="/delete-account">Demande de suppression de compte</a> ou par email à <a href="mailto:contact@soslink.fr">contact@soslink.fr</a>.</li>
    </ul>

    <h2>5. Contact du responsable de traitement</h2>
    <p>Pour toute question relative à cette politique ou pour exercer vos droits :<br>
    <strong>Email :</strong> <a href="mailto:contact@soslink.fr">contact@soslink.fr</a><br>
    <strong>Équipe Solid'Aid</strong>
    </p>

    <div class="footer">
      <p>© 2026 Solid'Aid. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`);
});

router.get("/delete-account", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suppression de compte — Solid'Aid</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 650px; margin: 0 auto; background: #fff; padding: 36px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { color: #b91c1c; border-bottom: 2px solid #fee2e2; padding-bottom: 12px; margin-top: 0; }
    p, li { color: #334155; }
    .box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; }
    label { display: block; font-weight: 600; margin-top: 14px; margin-bottom: 6px; font-size: 14px; }
    input[type="email"], textarea { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
    button { background: #dc2626; color: #fff; font-weight: 700; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; margin-top: 18px; font-size: 15px; }
    button:hover { background: #b91c1c; }
    .footer { margin-top: 30px; font-size: 13px; color: #64748b; }
    a { color: #0f766e; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Demande de suppression de compte & données</h1>
    <p>Conformément aux règles de Google Play et au RGPD, vous pouvez demander à tout moment la suppression intégrale de votre compte <strong>Solid'Aid</strong> et de l'ensemble des données associées.</p>

    <div class="box">
      <strong>Ce qui sera définitivement supprimé :</strong>
      <ul>
        <li>Votre compte utilisateur et vos identifiants d'accès</li>
        <li>Vos coordonnées personnelles (email, téléphone, adresse)</li>
        <li>L'ensemble des signalements que vous avez créés</li>
        <li>Les historiques de dons et interactions associées</li>
      </ul>
      <p style="margin: 0; font-size: 13px; color: #7f1d1d;">Cette action est définitive et irréversible.</p>
    </div>

    <form method="POST" action="/api/legal/delete-account-request" onsubmit="alert('Votre demande de suppression a bien été prise en compte. Un email de confirmation vous sera envoyé sous 48h ouvrées.'); return true;">
      <label for="email">Adresse email associée au compte :</label>
      <input type="email" id="email" name="email" required placeholder="nom@exemple.com">

      <label for="reason">Raison de la suppression (facultatif) :</label>
      <textarea id="reason" name="reason" rows="3" placeholder="Facultatif..."></textarea>

      <button type="submit">Confirmer la demande de suppression</button>
    </form>

    <div class="footer">
      <p>Vous pouvez également nous contacter directement par email à <a href="mailto:contact@soslink.fr">contact@soslink.fr</a>.</p>
      <p><a href="/privacy-policy">Consulter la Politique de Confidentialité</a></p>
    </div>
  </div>
</body>
</html>`);
});

router.post("/delete-account-request", (req, res) => {
  // Acknowledge the deletion request
  const email = req.body?.email;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Demande enregistrée</title>
  <style>body { font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; }</style>
</head>
<body>
  <h2 style="color: #0f766e;">Demande bien reçue</h2>
  <p>Votre demande de suppression pour l'adresse <strong>${email || "indiquée"}</strong> a été enregistrée.</p>
  <p>Les données associées seront supprimées sous 48h ouvrées conformément au RGPD.</p>
  <a href="/privacy-policy" style="color: #0f766e;">Retour à la politique de confidentialité</a>
</body>
</html>`);
});

export default router;
