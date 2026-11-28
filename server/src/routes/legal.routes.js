import { asyncRouter } from "../utils/asyncRouter.js";
import crypto from "node:crypto";
import { z } from "zod";
import { AccountDeletionRequest } from "../models/AccountDeletionRequest.js";
import { User } from "../models/User.js";
import { sendMail } from "../services/mailer.js";
import { permanentlyDeleteAccount } from "./auth.routes.js";

const router = asyncRouter();
const deletionRequestWindows = new Map();

router.get("/privacy", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Politique de confidentialité — Solid'Aid</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#1e293b;background:#f8fafc;margin:0;padding:24px}.container{max-width:800px;margin:auto;background:white;padding:32px;border-radius:12px}h1,h2{color:#0f766e}a{color:#0f766e}</style></head><body><main class="container">
<h1>Politique de confidentialité — Solid'Aid</h1><p>Dernière mise à jour : 16 novembre 2026.</p>
<p>Cette politique décrit les données traitées par l'application Solid'Aid, service de signalement solidaire et de mise en relation de citoyens, associations et commerces.</p>
<h2>Données traitées</h2><ul><li>Compte : adresse e-mail, mot de passe haché avec bcrypt, prénom, nom, téléphone, adresse, nom et identifiant de structure, avatar et rôle.</li><li>Localisation : coordonnées précises d'un signalement et position/zone d'intervention fournie pour l'affectation géographique. L'app ne demande pas de localisation en arrière-plan.</li><li>Signalements : besoins, urgence, commentaires, photos facultatives, adresse/repère et caractéristiques estimées des personnes décrites (tranche d'âge, genre apparent, taille de groupe, besoins observés).</li><li>Dons alimentaires : description, quantité, photo facultative, date et créneaux de retrait, association affectée et valorisation estimative.</li><li>Journaux : événements techniques et d'audit des actions administratives.</li></ul>
<h2>Utilisation et partage</h2><p>Les données servent à fournir le service, affecter les signalements et dons aux associations concernées, assurer la sécurité et administrer les comptes. Les informations de contact nécessaires à la coordination peuvent être communiquées à l'association affectée. Les e-mails transactionnels sont envoyés par le service SMTP configuré par l'exploitant. Les données sont hébergées par les prestataires configurés pour l'API et la base MongoDB ; l'exploitant doit tenir à jour la liste de ces prestataires et leurs lieux de traitement. Aucune régie publicitaire n'est intégrée dans le code examiné.</p>
<h2>Protection et conservation</h2><p>Les mots de passe sont hachés avec bcrypt. L'application cliente utilise HTTPS pour l'API de production configurée. Les signalements et dons sont conservés tant qu'ils sont nécessaires au fonctionnement du service ou jusqu'à une demande de suppression applicable. Les journaux d'audit de sécurité peuvent être conservés sous forme anonymisée. Les copies de sauvegarde peuvent persister jusqu'à la fin du cycle de rétention du prestataire. Les durées exactes des sauvegardes et journaux doivent être confirmées par l'exploitant.</p>
<h2>Suppression et droits</h2><p>La suppression peut être initiée dans les paramètres du compte ou depuis la page Web <a href="/delete-account">Suppression de compte Solid'Aid</a>. La demande Web requiert une confirmation par e-mail. La suppression efface le compte, ses signalements et les dons qui lui sont liés ; les journaux d'audit conservés sont dissociés de l'identifiant du compte. Pour exercer vos droits ou poser une question : <a href="mailto:contact@soslink.fr">contact@soslink.fr</a>.</p>
<h2>Responsable et contact</h2><p>Équipe Solid'Aid — <a href="mailto:contact@soslink.fr">contact@soslink.fr</a>. L'entité juridique responsable doit être précisée dans cette politique et dans la fiche Google Play par l'éditeur avant publication.</p>
</main></body></html>`);
});

router.get("/delete-account", (req, res) => {
  res.type("html").send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Suppression de compte — Solid'Aid</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:680px;margin:40px auto;padding:20px;color:#1e293b}label,input,button{display:block;width:100%;box-sizing:border-box;margin:12px 0;padding:12px}button{background:#b91c1c;color:white;border:0;border-radius:6px;font-weight:700}</style></head><body><h1>Suppression de compte Solid'Aid</h1><p>Indiquez l'adresse e-mail du compte. Si un compte correspondant existe, nous enverrons un lien de confirmation valable une heure. La confirmation supprime le compte, ses signalements et ses dons associés. Les journaux de sécurité peuvent être conservés sous forme anonymisée et les sauvegardes jusqu'à leur expiration.</p><form method="post" action="/api/legal/delete-account-request"><label for="email">Adresse e-mail du compte</label><input id="email" type="email" name="email" required maxlength="254" autocomplete="email"><button type="submit">Envoyer le lien de confirmation</button></form><p><a href="/privacy-policy">Politique de confidentialité</a> · <a href="mailto:contact@soslink.fr">Contacter Solid'Aid</a></p></body></html>`);
});

router.post("/delete-account-request", async (req, res, next) => {
  try {
    const now = Date.now();
    const window = deletionRequestWindows.get(req.ip);
    if (window && now - window.startedAt < 15 * 60 * 1000 && window.count >= 5) {
      return res.status(429).send("Trop de demandes. Réessayez plus tard.");
    }
    if (!window || now - window.startedAt >= 15 * 60 * 1000) {
      deletionRequestWindows.set(req.ip, { startedAt: now, count: 1 });
    } else {
      window.count += 1;
    }
    const { email } = z.object({ email: z.string().email().max(254) }).parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, deletedAt: { $exists: false }, role: { $ne: "admin" } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      await AccountDeletionRequest.create({
        email: normalizedEmail,
        tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      });
      const baseUrl = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      await sendMail({
        to: normalizedEmail,
        subject: "Confirmez la suppression de votre compte Solid'Aid",
        text: `Pour confirmer la suppression de votre compte et de ses données, ouvrez ce lien dans l'heure : ${baseUrl}/delete-account/confirm?token=${rawToken}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`
      });
    }
    res.type("html").send("<!doctype html><html lang=\"fr\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Solid'Aid — Suppression</title><h1>Vérifiez votre messagerie</h1><p>Si un compte correspond à cette adresse, un lien de confirmation valable une heure a été envoyé.</p><a href=\"/privacy-policy\">Politique de confidentialité</a></html>");
  } catch (error) { next(error); }
});

router.get("/delete-account/confirm", async (req, res, next) => {
  try {
    const parsed = z.string().regex(/^[a-f0-9]{64}$/).safeParse(req.query.token);
    if (!parsed.success) return res.status(400).send("Lien de confirmation invalide ou expiré.");
    const tokenHash = crypto.createHash("sha256").update(parsed.data).digest("hex");
    const request = await AccountDeletionRequest.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
    if (!request) return res.status(400).send("Lien de confirmation invalide ou expiré.");
    res.type("html").send(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solid'Aid — Confirmation</title><h1>Confirmer la suppression</h1><p>Cette action supprimera votre compte, vos signalements et les dons associés.</p><form method="post" action="/api/legal/delete-account/confirm"><input type="hidden" name="token" value="${parsed.data}"><button type="submit">Supprimer définitivement mon compte</button></form></html>`);
  } catch (error) { next(error); }
});

router.post("/delete-account/confirm", async (req, res, next) => {
  try {
    const parsed = z.string().regex(/^[a-f0-9]{64}$/).safeParse(req.body?.token);
    if (!parsed.success) return res.status(400).send("Lien de confirmation invalide ou expiré.");
    const tokenHash = crypto.createHash("sha256").update(parsed.data).digest("hex");
    const request = await AccountDeletionRequest.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
    if (!request) return res.status(400).send("Lien de confirmation invalide ou expiré.");
    const user = await User.findOne({ email: request.email, deletedAt: { $exists: false }, role: { $ne: "admin" } });
    if (user) await permanentlyDeleteAccount(user._id);
    await AccountDeletionRequest.deleteMany({ email: request.email });
    res.type("html").send("<!doctype html><html lang=\"fr\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Solid'Aid — Suppression</title><h1>Compte supprimé</h1><p>Le compte et les données qui lui sont associées ont été supprimés.</p></html>");
  } catch (error) { next(error); }
});

export default router;
