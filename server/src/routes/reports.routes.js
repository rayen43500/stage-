import { asyncRouter } from "../utils/asyncRouter.js";
import { z } from "zod";
import { imageField } from "../utils/validators.js";
import { auth, requireRole, requireValidatedOrganization } from "../middleware/auth.js";
import { Report } from "../models/Report.js";
import { User } from "../models/User.js";
import { findMatchingAssociations } from "../services/routing.js";
import { sendMail } from "../services/mailer.js";
import { recordAudit } from "../services/audit.js";

const router = asyncRouter();

const quickReportSchema = z.object({
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  addressHint: z.string().max(300).optional(),
  comment: z.string().max(2000).optional(),
  imageUrl: imageField(),
  urgency: z.enum(["green", "yellow", "red"]).default("yellow"),
  needs: z.array(z.enum(["hygiene", "clothes", "food", "shelter", "health", "psychological", "other"])).default([])
});

// ── Public Quick Report without authentication ──────────────────────────────
router.post("/quick", async (req, res) => {
  const data = quickReportSchema.parse(req.body);
  const report = await Report.create({
    isAnonymous: true,
    type: "individual",
    location: { type: "Point", coordinates: data.coordinates },
    addressHint: data.addressHint,
    comment: data.comment,
    imageUrl: data.imageUrl,
    urgency: data.urgency,
    needs: data.needs
  });

  const associations = await findMatchingAssociations(report);
  report.assignedAssociations = associations.map((a) => a._id);
  await report.save();

  // Notify each matched association by email
  await Promise.all(
    associations.map((association) =>
      sendMail({
        to: association.email,
        subject: `[SIGNALEMENT RAPIDE] Urgence ${data.urgency.toUpperCase()} dans votre secteur — SOS Link`,
        text: `Bonjour ${association.organizationName || ""},\n\nUn nouveau signalement rapide (sans compte) vient d'etre enregistre dans votre secteur.\n\nNiveau d'urgence : ${data.urgency === "red" ? "ROUGE (critique)" : data.urgency === "yellow" ? "JAUNE (important)" : "VERT (stable)"}\nCommentaire : ${data.comment || "Aucun commentaire fourni"}\nAdresse / Repere : ${data.addressHint || "Coordonnees GPS uniquement"}\nBesoins identifies : ${data.needs.join(", ") || "Non specifies"}\n\nConnectez-vous a SOS Link pour traiter ce signalement.\n\nL'equipe SOS Link`
      }).catch(() => {})
    )
  );

  const populated = await Report.findById(report._id).populate(
    "assignedAssociations",
    "organizationName email phone helloAssoUrl services"
  );

  res.status(201).json({ report: populated, assignedAssociations: associations.length });
});

// ── Protected routes from this point onward ─────────────────────────────────
router.use(auth, requireValidatedOrganization);

const reportSchema = z.object({
  type: z.enum(["individual", "group"]),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  addressHint: z.string().max(300).optional(),
  comment: z.string().max(2000).optional(),
  imageUrl: imageField(),
  urgency: z.enum(["green", "yellow", "red"]),
  needs: z.array(z.enum(["hygiene", "clothes", "food", "shelter", "health", "psychological", "other"])).default([]),
  otherNeed: z.string().max(300).optional(),
  individual: z.record(z.any()).optional(),
  group: z.record(z.any()).optional()
});

router.post("/", requireRole("citizen", "admin"), async (req, res) => {
  const data = reportSchema.parse(req.body);
  const report = await Report.create({
    createdBy: req.user._id,
    type: data.type,
    location: { type: "Point", coordinates: data.coordinates },
    addressHint: data.addressHint,
    comment: data.comment,
    imageUrl: data.imageUrl,
    urgency: data.urgency,
    needs: data.needs,
    otherNeed: data.otherNeed,
    individual: data.type === "individual" ? data.individual : undefined,
    group: data.type === "group" ? data.group : undefined
  });

  const associations = await findMatchingAssociations(report);
  report.assignedAssociations = associations.map((a) => a._id);
  await report.save();

  // Notify each matched association by email
  await Promise.all(
    associations.map((association) =>
      sendMail({
        to: association.email,
        subject: `Nouveau signalement ${data.urgency.toUpperCase()} dans votre secteur — SOS Link`,
        text: `Bonjour ${association.organizationName || ""},\n\nUn nouveau signalement de type "${data.type === "individual" ? "individuel" : "groupe"}" vient d'etre cree dans votre secteur d'intervention.\n\nNiveau d'urgence : ${data.urgency === "red" ? "ROUGE (critique)" : data.urgency === "yellow" ? "JAUNE (important)" : "VERT (stable)"}\nBesoins identifies : ${data.needs.join(", ") || "Non specifies"}${data.otherNeed ? "\nAutre besoin : " + data.otherNeed : ""}\n\nConnectez-vous a SOS Link pour traiter ce signalement.\n\nL'equipe SOS Link`
      }).catch(() => {})
    )
  );

  // Populate association details to return to citizen (phone, HelloAsso, etc.)
  const populated = await Report.findById(report._id).populate(
    "assignedAssociations",
    "organizationName email phone helloAssoUrl services"
  );

  res.status(201).json({ report: populated, assignedAssociations: associations.length });
});

// Citizen declines to call the association → send them a thank-you email + HelloAsso links
router.post("/:id/decline-contact", requireRole("citizen"), async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, createdBy: req.user._id }).populate(
    "assignedAssociations",
    "organizationName helloAssoUrl"
  );
  if (!report) return res.status(404).json({ message: "Signalement introuvable." });

  const helloAssoLinks = report.assignedAssociations
    .filter((a) => a.helloAssoUrl)
    .map((a) => `${a.organizationName || "Association"} : ${a.helloAssoUrl}`)
    .join("\n");

  await sendMail({
    to: req.user.email,
    subject: "Merci pour votre signalement — SOS Link",
    text: `Bonjour,\n\nMerci d'avoir signale cette situation sur SOS Link. Grace a vous, les associations de votre secteur ont ete alertees et peuvent intervenir rapidement.\n\nSi vous souhaitez soutenir leur action par un don libre, voici leurs pages HelloAsso :\n${helloAssoLinks || "Aucune association avec lien HelloAsso disponible."}\n\nToute contribution est entierement libre et non obligatoire.\n\nMerci pour votre engagement solidaire.\nL'equipe SOS Link`
  }).catch(() => {});

  res.json({ ok: true });
});

router.get("/", async (req, res) => {
  const { status, urgency, needs } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (urgency) filter.urgency = urgency;
  if (needs) filter.needs = { $in: needs.split(",") };

  if (req.user.role === "citizen") filter.createdBy = req.user._id;
  if (req.user.role === "association") filter.assignedAssociations = req.user._id;

  const reports = await Report.find(filter)
    .sort({ createdAt: -1 })
    .populate("assignedAssociations", "organizationName email phone helloAssoUrl")
    .populate("createdBy", "organizationName email")
    .populate("pendingStatus.requestedBy", "organizationName email");
  res.json(reports);
});

// Update report details / request status change
router.patch("/:id", requireRole("association", "admin"), async (req, res) => {
  const updateSchema = z.object({
    status: z.enum(["new", "in_progress", "resolved", "removed"]).optional(),
    fulfilledNeeds: z.array(z.string().max(50)).max(20).optional(),
    associationNotes: z.string().max(2000).optional(),
    adminNotes: z.string().max(2000).optional()
  });
  const update = updateSchema.parse(req.body);
  const filter = { _id: req.params.id };
  if (req.user.role === "association") filter.assignedAssociations = req.user._id;

  const existingReport = await Report.findOne(filter);
  if (!existingReport) return res.status(404).json({ message: "Signalement introuvable." });

  if (req.user.role === "association") {
    // If association requests a status change that is different from current status:
    if (update.status && update.status !== existingReport.status) {
      if (existingReport.pendingStatus?.requestStatus === "pending") {
        return res.status(409).json({ message: "Une demande de changement est déjà en attente." });
      }
      const allowedTransitions = {
        new: ["in_progress", "removed"],
        in_progress: ["resolved", "removed"],
        resolved: ["removed"],
        removed: []
      };
      if (!allowedTransitions[existingReport.status].includes(update.status)) {
        return res.status(400).json({ message: "Transition de statut invalide." });
      }
      existingReport.pendingStatus = {
        status: update.status,
        requestStatus: "pending",
        requestedBy: req.user._id,
        requestedAt: new Date(),
        note: update.associationNotes || ""
      };
    }
    if (update.fulfilledNeeds !== undefined) existingReport.fulfilledNeeds = update.fulfilledNeeds;
    if (update.associationNotes !== undefined) existingReport.associationNotes = update.associationNotes;
  } else if (req.user.role === "admin") {
    // Admin directly modifies the confirmed status and clears a pending request.
    if (update.status) {
      const allowedTransitions = {
        new: ["in_progress", "removed"],
        in_progress: ["resolved", "removed"],
        resolved: ["removed"],
        removed: []
      };
      if (update.status !== existingReport.status && !allowedTransitions[existingReport.status].includes(update.status)) {
        return res.status(400).json({ message: "Transition de statut invalide." });
      }
      existingReport.status = update.status;
      existingReport.pendingStatus = undefined;
    }
    if (update.fulfilledNeeds !== undefined) existingReport.fulfilledNeeds = update.fulfilledNeeds;
    if (update.associationNotes !== undefined) existingReport.associationNotes = update.associationNotes;
    if (update.adminNotes !== undefined) existingReport.adminNotes = update.adminNotes;
  }

  await existingReport.save();
  if (req.user.role === "admin") {
    await recordAudit({
      actor: req.user._id,
      action: "report.updated",
      entityType: "Report",
      entityId: existingReport._id,
      metadata: { status: update.status, adminNotesChanged: update.adminNotes !== undefined }
    });
  }
  const populated = await Report.findById(existingReport._id)
    .populate("assignedAssociations", "organizationName email phone helloAssoUrl")
    .populate("createdBy", "organizationName email")
    .populate("pendingStatus.requestedBy", "organizationName email");

  res.json(populated);
});

// Admin confirms or rejects association requested status change
router.patch("/:id/confirm-status", requireRole("admin"), async (req, res) => {
  const { action, rejectionReason } = z.object({
    action: z.enum(["approve", "reject"]),
    rejectionReason: z.string().trim().max(1000).optional()
  }).parse(req.body);
  if (action === "reject" && !rejectionReason) {
    return res.status(400).json({ message: "Un motif est obligatoire pour rejeter une demande." });
  }
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: "Signalement introuvable." });
  if (report.pendingStatus?.requestStatus !== "pending") {
    return res.status(409).json({ message: "Aucune demande de changement en attente." });
  }

  const request = report.pendingStatus.toObject();
  report.statusChangeHistory.push({
    proposedStatus: request.status,
    requestedBy: request.requestedBy,
    requestedAt: request.requestedAt,
    note: request.note,
    decision: action === "approve" ? "approved" : "rejected",
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
    rejectionReason: action === "reject" ? rejectionReason : undefined
  });

  if (action === "approve") {
    const allowedTransitions = {
      new: ["in_progress", "removed"],
      in_progress: ["resolved", "removed"],
      resolved: ["removed"],
      removed: []
    };
    if (!allowedTransitions[report.status].includes(request.status)) {
      return res.status(400).json({ message: "Transition de statut invalide." });
    }
    report.status = request.status;
  }
  report.pendingStatus = undefined;

  await report.save();
  await recordAudit({
    actor: req.user._id,
    action: action === "approve" ? "report.status_approved" : "report.status_rejected",
    entityType: "Report",
    entityId: report._id,
    metadata: { proposedStatus: request.status, rejectionReason }
  });
  if (request.requestedBy) {
    const association = await User.findById(request.requestedBy).select("email organizationName");
    if (association) {
      await sendMail({
        to: association.email,
        subject: `SOS Link — Demande de statut ${action === "approve" ? "approuvée" : "rejetée"}`,
        text: action === "approve"
          ? `Votre demande de passage au statut "${request.status}" a été approuvée par l'administrateur.`
          : `Votre demande de changement de statut a été rejetée. Motif : ${rejectionReason}`
      }).catch((error) => console.error("Report decision email failed:", error));
    }
  }
  const populated = await Report.findById(report._id)
    .populate("assignedAssociations", "organizationName email phone helloAssoUrl")
    .populate("createdBy", "organizationName email")
    .populate("pendingStatus.requestedBy", "organizationName email");

  res.json(populated);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { $set: { status: "removed", adminNotes: typeof req.body?.reason === "string" ? req.body.reason.slice(0, 1000) : "Retiré par un administrateur." } },
    { new: true, runValidators: true }
  );
  if (!report) return res.status(404).json({ message: "Signalement introuvable." });
  await recordAudit({ actor: req.user._id, action: "report.removed", entityType: "Report", entityId: report._id });
  res.status(204).send();
});

export default router;
