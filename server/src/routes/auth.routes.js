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
