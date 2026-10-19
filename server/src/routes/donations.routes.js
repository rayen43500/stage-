import { Router } from "express";
import { z } from "zod";
import { auth, requireRole, requireValidatedOrganization } from "../middleware/auth.js";
import { FoodDonation } from "../models/FoodDonation.js";
import { User } from "../models/User.js";
import { estimateDonationValue } from "../services/valuation.js";
import { sendMail } from "../services/mailer.js";
import { distanceMeters } from "../services/routing.js";

const router = Router();
router.use(auth, requireValidatedOrganization);

const donationSchema = z.object({
  description: z.string().min(3),
  quantity: z.string().min(1),
  photoUrl: z.string().optional(),
  availableDate: z.coerce.date(),
  pickupSlots: z.array(z.object({ start: z.string(), end: z.string() })).default([])
});

router.post("/", requireRole("restaurant"), async (req, res) => {
  const data = donationSchema.parse(req.body);

  // Geo-match: find active associations that cover the restaurateur's location AND serve food
  let assignedAssociation = null;

  const restaurateurCoords = req.user.interventionZone?.center?.coordinates;
  if (restaurateurCoords) {
    const [lng, lat] = restaurateurCoords;
    const candidates = await User.find({
      role: "association",
      status: "active",
      deletedAt: { $exists: false },
      "interventionZone.center": {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 100000
        }
      }
    });

    // Filter: must cover the restaurateur's location within their radius + prefer food service
    const inZone = candidates.filter((assoc) => {
      const radiusMeters = (assoc.interventionZone?.radiusKm || 0) * 1000;
      const dist = distanceMeters([lng, lat], assoc.interventionZone.center.coordinates);
      return dist <= radiusMeters;
    });

    // Prefer associations explicitly offering food, then fall back to any in zone
    const withFood = inZone.filter((a) => !a.services?.length || a.services.includes("food"));
    const pool = withFood.length ? withFood : inZone;

    // Pick the closest one
    if (pool.length) {
      pool.sort((a, b) => {
        const da = distanceMeters([lng, lat], a.interventionZone.center.coordinates);
        const db = distanceMeters([lng, lat], b.interventionZone.center.coordinates);
        return da - db;
      });
      assignedAssociation = pool[0];
    }
  }

  // Fallback: if no geo-match, pick any active association
  if (!assignedAssociation) {
    assignedAssociation = await User.findOne({ role: "association", status: "active" }).sort({ createdAt: 1 });
  }

  const valuation = estimateDonationValue(data);

  const donation = await FoodDonation.create({
    ...data,
    restaurant: req.user._id,
    assignedAssociation: assignedAssociation?._id,
    status: assignedAssociation ? "assigned" : "declared",
    valuation
  });

  if (assignedAssociation) {
    await sendMail({
      to: assignedAssociation.email,
      subject: "Nouveau don alimentaire disponible — SOS Link",
      text: `Bonjour ${assignedAssociation.organizationName || ""},\n\n${req.user.organizationName || req.user.email} met a disposition des invendus alimentaires.\n\nDescription : ${data.description}\nQuantite : ${data.quantity}\nDate de disponibilite : ${new Date(data.availableDate).toLocaleDateString("fr-FR")}\n${data.pickupSlots?.length ? "Creneau de retrait : " + data.pickupSlots.map((s) => s.start + " - " + s.end).join(", ") : ""}\n\nContactez le restaurateur par email : ${req.user.email}\n\nL'equipe SOS Link`
    }).catch(() => {});
  } else {
    // No association found: notify admin by logging (admin sees all declarations on dashboard)
    console.log(`[DONATION] Aucune association trouvee pour le don de ${req.user.email}. Visible dans le tableau admin.`);
  }

  res.status(201).json(donation);
});

router.get("/", async (req, res) => {
  const filter = {};
  if (req.user.role === "restaurant") filter.restaurant = req.user._id;
  if (req.user.role === "association") filter.assignedAssociation = req.user._id;

  const donations = await FoodDonation.find(filter)
    .sort({ availableDate: -1 })
    .populate("restaurant", "organizationName email address")
    .populate("assignedAssociation", "organizationName email");

  // Restaurateur: hide per-donation valuation until December (fin d'année)
  // Admin sees everything
  const safeDonations =
    req.user.role === "restaurant"
      ? donations.map(maskRestaurantValuationUntilYearEnd)
      : donations;

  res.json(safeDonations);
});

// Annual summary: restricted to the authenticated user's own data
// Restaurateur: only shows summary if requested year is complete or it's December
router.get("/annual-summary/:year", requireRole("restaurant", "association", "admin"), async (req, res) => {
  const year = Number(req.params.year);
  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;
  const isDecember = new Date().getMonth() === 11;

  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
  const filter = { availableDate: { $gte: start, $lt: end } };

  if (req.user.role === "restaurant") filter.restaurant = req.user._id;
  if (req.user.role === "association") filter.assignedAssociation = req.user._id;

  const donations = await FoodDonation.find(filter).populate("restaurant", "organizationName email");

  // Restaurateur can only see detailed valuations for past years or in December
  const showDetails = req.user.role !== "restaurant" || !isCurrentYear || isDecember;
  const total = donations.reduce((sum, d) => sum + (d.valuation?.estimatedValueEur || 0), 0);

  if (!showDetails) {
    // Return count only, no valuation details
    return res.json({
      year,
      count: donations.length,
      totalEstimatedValueEur: null,
      message: "Le recapitulatif detaille sera disponible en fin d'annee (decembre).",
      donations: []
    });
  }

  res.json({
    year,
    count: donations.length,
    totalEstimatedValueEur: Number(total.toFixed(2)),
    donations: showDetails ? donations : []
  });
});

router.patch("/:id/status", requireRole("association", "admin"), async (req, res) => {
  const { status } = z
    .object({ status: z.enum(["declared", "assigned", "collected", "cancelled"]) })
    .parse(req.body);
  const filter = { _id: req.params.id };
  if (req.user.role === "association") filter.assignedAssociation = req.user._id;
  const donation = await FoodDonation.findOneAndUpdate(filter, { status }, { new: true });
  if (!donation) return res.status(404).json({ message: "Don introuvable." });
  res.json(donation);
});

function maskRestaurantValuationUntilYearEnd(donation) {
  const obj = donation.toObject();
  const isDecember = new Date().getMonth() === 11;
  if (!isDecember) delete obj.valuation;
  return obj;
}

export default router;
