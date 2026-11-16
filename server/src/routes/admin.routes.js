import { Router } from "express";
import { z } from "zod";
import { auth, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Report } from "../models/Report.js";
import { FoodDonation } from "../models/FoodDonation.js";
import { sendMail } from "../services/mailer.js";
import { AuditLog } from "../models/AuditLog.js";
import { recordAudit } from "../services/audit.js";
import { permanentlyDeleteAccount } from "./auth.routes.js";

const router = Router();
router.use(auth, requireRole("admin"));

// Global dashboard stats
router.get("/dashboard", async (req, res) => {
  const activeUsers = { deletedAt: { $exists: false } };
  const activeOrganizations = { role: { $in: ["association", "restaurant"] }, ...activeUsers };
  const [users, citizens, associations, restaurants, pendingOrganizations, approvedOrganizations, rejectedOrganizations, reports, newReports, inProgressReports, donations, assignedDonations, collectedDonations, resolvedReports, pendingStatusReports] = await Promise.all([
    User.countDocuments(activeUsers),
    User.countDocuments({ ...activeUsers, role: "citizen" }),
    User.countDocuments({ ...activeUsers, role: "association" }),
    User.countDocuments({ ...activeUsers, role: "restaurant" }),
    User.countDocuments({ role: { $in: ["association", "restaurant"] }, status: "pending" }),
    User.countDocuments({ ...activeOrganizations, status: "active" }),
    User.countDocuments({ ...activeOrganizations, status: "rejected" }),
    Report.countDocuments(),
    Report.countDocuments({ status: "new" }),
    Report.countDocuments({ status: "in_progress" }),
    FoodDonation.countDocuments(),
    FoodDonation.countDocuments({ status: "assigned" }),
    FoodDonation.countDocuments({ status: "collected" }),
    Report.countDocuments({ status: "resolved" }),
    Report.countDocuments({ "pendingStatus.requestStatus": "pending" })
  ]);
  res.json({
    users, citizens, associations, restaurants, pendingOrganizations,
    approvedOrganizations, rejectedOrganizations, reports, newReports,
    inProgressReports, resolvedReports, donations, assignedDonations,
    collectedDonations, pendingStatusReports
  });
});

// Pending organizations (associations + restaurants awaiting validation)
router.get("/organizations/pending", async (req, res) => {
  const users = await User.find({
    role: { $in: ["association", "restaurant"] },
    status: "pending"
  }).select("-passwordHash");
  res.json(users);
});

router.get("/organizations", async (req, res) => {
  const { status, role, search } = req.query;
  const filter = { role: { $in: ["association", "restaurant"] }, deletedAt: { $exists: false } };
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (search) {
    const expression = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ organizationName: expression }, { email: expression }, { sirenSiret: expression }];
  }
  const organizations = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 });
  res.json(organizations);
});

// Get reports with pending status change requests from associations
router.get("/reports/pending-status", async (req, res) => {
  const reports = await Report.find({ "pendingStatus.requestStatus": "pending" })
    .sort({ "pendingStatus.requestedAt": -1 })
    .populate("assignedAssociations", "organizationName email phone")
    .populate("createdBy", "organizationName email")
    .populate("pendingStatus.requestedBy", "organizationName email");
  res.json(reports);
});

// Validate or reject organization
router.patch("/organizations/:id/status", async (req, res) => {
  const { status, rejectionReason } = z.object({
    status: z.enum(["active", "rejected"]),
    rejectionReason: z.string().trim().max(1000).optional()
  }).parse(req.body);
  if (status === "rejected" && !rejectionReason) {
    return res.status(400).json({ message: "Un motif est obligatoire pour refuser une organisation." });
  }
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: { $in: ["association", "restaurant"] }, deletedAt: { $exists: false } },
    {
      $set: {
        status,
        organizationValidation: {
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          rejectionReason: status === "rejected" ? rejectionReason : undefined
        }
      }
    },
    { new: true, runValidators: true }
  ).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "Organisation introuvable." });

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
  }).catch((error) => console.error("Organization status email failed:", error));

  await recordAudit({
    actor: req.user._id,
    action: status === "active" ? "organization.approved" : "organization.rejected",
    entityType: "User",
    entityId: user._id,
    metadata: status === "rejected" ? { rejectionReason } : {}
  });

  res.json(user);
});

// List all users (for admin moderation)
router.get("/users", async (req, res) => {
  const { role, status, search } = req.query;
  const filter = { deletedAt: { $exists: false } };
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    const expression = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ email: expression }, { firstName: expression }, { lastName: expression }, { organizationName: expression }];
  }
  const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

router.post("/users", async (req, res) => {
  const data = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["citizen", "association", "restaurant"]),
    firstName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    organizationName: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(40).optional(),
    address: z.string().trim().max(300).optional(),
    status: z.enum(["active", "pending", "rejected"]).default("active"),
    consentRgpd: z.literal(true)
  }).parse(req.body);
  const exists = await User.findOne({ email: data.email.toLowerCase(), deletedAt: { $exists: false } });
  if (exists) return res.status(409).json({ message: "Cette adresse e-mail est déjà utilisée." });
  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    passwordHash: await User.hashPassword(data.password)
  });
  await recordAudit({ actor: req.user._id, action: "user.created", entityType: "User", entityId: user._id, metadata: { role: data.role } });
  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  res.status(201).json(safeUser);
});

router.patch("/users/:id", async (req, res) => {
  const data = z.object({
    firstName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    organizationName: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(40).optional(),
    address: z.string().trim().max(300).optional(),
    status: z.enum(["active", "pending", "rejected"]).optional()
  }).parse(req.body);
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: { $ne: "admin" }, deletedAt: { $exists: false } },
    { $set: data },
    { new: true, runValidators: true }
  ).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });
  await recordAudit({ actor: req.user._id, action: "user.updated", entityType: "User", entityId: user._id, metadata: data });
  res.json(user);
});

// Delete any user account (admin moderation)
router.delete("/users/:id", async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: { $ne: "admin" }, deletedAt: { $exists: false } });
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });
  await permanentlyDeleteAccount(user._id);
  await recordAudit({ actor: req.user._id, action: "user.soft_deleted", entityType: "User", entityId: user._id });
  res.status(204).send();
});

// Get all reports (admin view with optional filters)
router.get("/reports", async (req, res) => {
  const { status, urgency, type, isAnonymous, pending, needs, search, from, to } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (urgency) filter.urgency = urgency;
  if (type) filter.type = type;
  if (isAnonymous === "true") filter.isAnonymous = true;
  if (pending === "true") filter["pendingStatus.requestStatus"] = "pending";
  if (needs) filter.needs = { $in: String(needs).split(",") };
  if (search) {
    const expression = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ comment: expression }, { addressHint: expression }, { otherNeed: expression }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(String(from));
    if (to) filter.createdAt.$lt = new Date(`${String(to)}T23:59:59.999Z`);
  }

  const reports = await Report.find(filter)
    .sort({ createdAt: -1 })
    .populate("assignedAssociations", "organizationName email phone address services interventionZone")
    .populate("createdBy", "organizationName email firstName lastName phone")
    .populate("pendingStatus.requestedBy", "organizationName email")
    .populate("statusChangeHistory.requestedBy", "organizationName email")
    .populate("statusChangeHistory.reviewedBy", "organizationName email");
  res.json(reports);
});

// Admin view: all food donations with IA valuation details
router.get("/donations", async (req, res) => {
  const { year, restaurant, association, status } = req.query;
  const filter = {};
  if (year) {
    const y = Number(year);
    filter.availableDate = {
      $gte: new Date(`${y}-01-01T00:00:00.000Z`),
      $lt: new Date(`${y + 1}-01-01T00:00:00.000Z`)
    };
  }
  if (restaurant) filter.restaurant = restaurant;
  if (association) filter.assignedAssociation = association;
  if (status) filter.status = status;
  const donations = await FoodDonation.find(filter)
    .sort({ availableDate: -1 })
    .populate("restaurant", "organizationName email address phone sirenSiret")
    .populate("assignedAssociation", "organizationName email");
  res.json(donations);
});

router.get("/audit-logs", async (req, res) => {
  const logs = await AuditLog.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("actor", "email organizationName");
  res.json(logs);
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
