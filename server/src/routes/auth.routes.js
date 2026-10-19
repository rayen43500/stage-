import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { Report } from "../models/Report.js";
import { signToken } from "../services/token.js";
import { auth } from "../middleware/auth.js";
import { sendMail } from "../services/mailer.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["citizen", "association", "restaurant"]).default("citizen"),
  consentRgpd: z.literal(true),
  organizationName: z.string().optional(),
  sirenSiret: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  services: z.array(z.string()).optional(),
  interventionZone: z
    .object({
      center: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
      radiusKm: z.number().min(0).max(100)
    })
    .optional(),
  helloAssoUrl: z.string().url().optional()
});

router.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const exists = await User.findOne({ email: data.email });
  if (exists) return res.status(409).json({ message: "Email deja utilise." });
  const passwordHash = await User.hashPassword(data.password);
  // Citizens are immediately active. Associations and restaurants require admin validation.
  const status = data.role === "citizen" ? "active" : "pending";

  // Build intervention zone:
  // - Associations: user provides center + radius
  // - Restaurants: user provides coordinates; radius is 0 (point location for geo-matching)
  let interventionZone;
  if (data.interventionZone) {
    interventionZone = {
      center: { type: "Point", coordinates: data.interventionZone.center.coordinates },
      radiusKm: data.interventionZone.radiusKm
    };
  }

  const user = await User.create({
    ...data,
    passwordHash,
    status,
    interventionZone
  });

  // Send welcome/pending notification email
  if (data.role === "citizen") {
    await sendMail({
      to: data.email,
      subject: "Bienvenue sur SOS Link",
      text: `Bonjour,\n\nVotre compte citoyen SOS Link a ete cree avec succes. Vous pouvez maintenant signaler des personnes en difficulte en Ile-de-France.\n\nMerci pour votre engagement solidaire.\n\nL'equipe SOS Link`
    }).catch(() => {});
  } else {
    await sendMail({
      to: data.email,
      subject: "Inscription SOS Link — En attente de validation",
      text: `Bonjour ${data.organizationName || ""},\n\nVotre inscription sur SOS Link a bien ete recue. Votre compte est en attente de validation par notre administrateur. Vous recevrez un email de confirmation une fois votre compte active.\n\nL'equipe SOS Link`
    }).catch(() => {});
  }

  res.status(201).json({ token: signToken(user), user: sanitize(user) });
});

router.post("/login", async (req, res) => {
  const data = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
  const user = await User.findOne({ email: data.email, deletedAt: { $exists: false } });
  if (!user || !(await user.comparePassword(data.password))) return res.status(401).json({ message: "Identifiants invalides." });
  res.json({ token: signToken(user), user: sanitize(user) });
});

router.get("/me", auth, (req, res) => res.json({ user: req.user }));

const profileUpdateSchema = z.object({
  email: z.string().email().optional(),
  organizationName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().optional(),
  services: z.array(z.string()).optional(),
  radiusKm: z.number().min(1).max(100).optional(),
  helloAssoUrl: z.string().optional()
});

router.patch("/profile", auth, async (req, res) => {
  const data = profileUpdateSchema.parse(req.body);
  const updates = {};

  if (data.email !== undefined && data.email.toLowerCase() !== req.user.email.toLowerCase()) {
    const existing = await User.findOne({
      email: data.email.toLowerCase().trim(),
      _id: { $ne: req.user._id },
      deletedAt: { $exists: false }
    });
    if (existing) {
      return res.status(409).json({ message: "Cette adresse e-mail est déjà associée à un autre compte." });
    }
    updates.email = data.email.toLowerCase().trim();
  }

  if (data.organizationName !== undefined) updates.organizationName = data.organizationName.trim();
  if (data.phone !== undefined) updates.phone = data.phone.trim();
  if (data.address !== undefined) updates.address = data.address.trim();
  if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;
  if (data.services !== undefined && req.user.role === "association") updates.services = data.services;
  if (data.helloAssoUrl !== undefined) updates.helloAssoUrl = data.helloAssoUrl.trim();
  if (data.radiusKm !== undefined && req.user.role === "association") {
    updates["interventionZone.radiusKm"] = data.radiusKm;
  }

  const updated = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
  res.json({ user: sanitize(updated) });
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

router.patch("/password", auth, async (req, res) => {
  const data = passwordChangeSchema.parse(req.body);
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

  const valid = await user.comparePassword(data.currentPassword);
  if (!valid) {
    return res.status(400).json({ message: "Le mot de passe actuel est incorrect." });
  }

  user.passwordHash = await User.hashPassword(data.newPassword);
  await user.save();

  res.json({ message: "Mot de passe modifié avec succès." });
});

// RGPD: citizen can delete their own account + all reports they created
router.delete("/me", auth, async (req, res) => {
  const userId = req.user._id;
  // Soft-delete the user account
  await User.findByIdAndUpdate(userId, {
    deletedAt: new Date(),
    email: `deleted-${userId}@soslink.local`
  });
  // RGPD: also remove all reports created by this citizen
  if (req.user.role === "citizen") {
    await Report.deleteMany({ createdBy: userId });
  }
  res.status(204).send();
});

function sanitize(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  return obj;
}

export default router;
