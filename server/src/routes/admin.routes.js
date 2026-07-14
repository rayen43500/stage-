import { Router } from "express";
import { z } from "zod";
import { auth, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Report } from "../models/Report.js";
import { FoodDonation } from "../models/FoodDonation.js";
import { sendMail } from "../services/mailer.js";

const router = Router();
router.use(auth, requireRole("admin"));

// Global dashboard stats
router.get("/dashboard", async (req, res) => {
  const [users, pendingOrganizations, reports, donations, resolvedReports] = await Promise.all([
    User.countDocuments({ deletedAt: { $exists: false } }),
    User.countDocuments({ role: { $in: ["association", "restaurant"] }, status: "pending" }),
    Report.countDocuments(),
    FoodDonation.countDocuments(),
    Report.countDocuments({ status: "resolved" })
  ]);
  res.json({ users, pendingOrganizations, reports, resolvedReports, donations });
});

// Pending organizations (associations + restaurants awaiting validation)
router.get("/organizations/pending", async (req, res) => {
  const users = await User.find({
    role: { $in: ["association", "restaurant"] },
    status: "pending"
  }).select("-passwordHash");
  res.json(users);
});

// Validate or reject organization
router.patch("/organizations/:id/status", async (req, res) => {
  const { status } = z.object({ status: z.enum(["active", "rejected"]) }).parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "Compte introuvable." });

  // Notify the organization of their account status change
  const statusLabel = status === "active" ? "active" : "refuse";
  const message =
    status === "active"
      ? `Bonjour ${user.organizationName || ""},\n\nVotre compte sur SOS Link a ete valide. Vous pouvez maintenant vous connecter et acceder a toutes les fonctionnalites de votre interface.\n\nL'equipe SOS Link`
      : `Bonjour ${user.organizationName || ""},\n\nNous avons examine votre demande d'inscription sur SOS Link. Malheureusement, votre compte n'a pas pu etre valide. Si vous pensez qu'il s'agit d'une erreur, contactez-nous.\n\nL'equipe SOS Link`;

  await sendMail({
    to: user.email,
    subject: `SOS Link — Compte ${statusLabel}`,
    text: message
  }).catch(() => {});

  res.json(user);
});

// List all users (for admin moderation)
router.get("/users", async (req, res) => {
  const { role, status } = req.query;
  const filter = { deletedAt: { $exists: false } };
  if (role) filter.role = role;
  if (status) filter.status = status;
  const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

// Delete any user account (admin moderation)
router.delete("/users/:id", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
  res.status(204).send();
});

// Get all reports (admin view with optional filters)
router.get("/reports", async (req, res) => {
  const { status, urgency, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (urgency) filter.urgency = urgency;
  if (type) filter.type = type;
  const reports = await Report.find(filter)
    .sort({ createdAt: -1 })
    .populate("assignedAssociations", "organizationName email")
    .populate("createdBy", "email");
  res.json(reports);
});

// Admin view: all food donations with IA valuation details
router.get("/donations", async (req, res) => {
  const { year } = req.query;
  const filter = {};
  if (year) {
    const y = Number(year);
    filter.availableDate = {
      $gte: new Date(`${y}-01-01T00:00:00.000Z`),
      $lt: new Date(`${y + 1}-01-01T00:00:00.000Z`)
    };
  }
  const donations = await FoodDonation.find(filter)
    .sort({ availableDate: -1 })
    .populate("restaurant", "organizationName email address phone sirenSiret")
    .populate("assignedAssociation", "organizationName email");
  res.json(donations);
});

// Admin: generate and send annual fiscal receipt to a restaurateur
router.post("/donations/:restaurantId/fiscal-receipt/:year", async (req, res) => {
  const restaurant = await User.findById(req.params.restaurantId).select("-passwordHash");
  if (!restaurant || restaurant.role !== "restaurant") {
    return res.status(404).json({ message: "Restaurateur introuvable." });
  }

  const year = Number(req.params.year);
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const donations = await FoodDonation.find({
    restaurant: restaurant._id,
    availableDate: { $gte: start, $lt: end },
    status: { $ne: "cancelled" }
  });

  if (!donations.length) {
    return res.status(404).json({ message: "Aucun don trouve pour cet exercice." });
  }

  const totalValueEur = Number(
    donations.reduce((sum, d) => sum + (d.valuation?.estimatedValueEur || 0), 0).toFixed(2)
  );

  const donationLines = donations
    .map(
      (d, i) =>
        `${i + 1}. ${new Date(d.availableDate).toLocaleDateString("fr-FR")} — ${d.description} (${d.quantity}) — Valorisation : ${d.valuation?.estimatedValueEur?.toFixed(2) || "N/A"} EUR`
    )
    .join("\n");

  const receiptText = `RECU FISCAL — DON EN NATURE — ANNEE ${year}
===============================================

Beneficiaire : SOS Link (Service of Solidarity)
Donateur : ${restaurant.organizationName || restaurant.email}
SIREN/SIRET : ${restaurant.sirenSiret || "Non renseigne"}
Adresse : ${restaurant.address || "Non renseignee"}
Email : ${restaurant.email}

Nombre total de dons declares : ${donations.length}
Valorisation totale estimee : ${totalValueEur} EUR

DETAIL DES DONS :
${donationLines}

METHODE DE VALORISATION :
La valorisation financiere de chaque don alimentaire a ete calculee automatiquement par le module d'intelligence artificielle de SOS Link, base sur les references de prix moyens par categorie d'aliment.

Ce document atteste que ${restaurant.organizationName || restaurant.email} a effectue des dons en nature a des associations humanitaires partenaires de SOS Link au cours de l'annee ${year}, pour un equivalent financier total de ${totalValueEur} EUR.

Ce recu peut etre utilise pour votre declaration fiscale conformement a l'article 238 bis du CGI (deduction de 60% du montant des dons en nature dans la limite de 5‰ du chiffre d'affaires).

Emis le ${new Date().toLocaleDateString("fr-FR")} par l'administrateur SOS Link.
===============================================`;

  await sendMail({
    to: restaurant.email,
    subject: `SOS Link — Recu fiscal ${year} — ${restaurant.organizationName || restaurant.email}`,
    text: receiptText
  });

  res.json({
    ok: true,
    year,
    restaurantEmail: restaurant.email,
    totalValueEur,
    donationCount: donations.length
  });
});

export default router;
