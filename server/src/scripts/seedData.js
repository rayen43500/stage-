import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { User } from "../models/User.js";
import { Report } from "../models/Report.js";
import { FoodDonation } from "../models/FoodDonation.js";
import { estimateDonationValue } from "../services/valuation.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sos-link";

async function seed() {
  console.log("Connecting to MongoDB...");
  await connectDb(MONGODB_URI);

  console.log("Cleaning collections...");
  await User.deleteMany({});
  await Report.deleteMany({});
  await FoodDonation.deleteMany({});

  console.log("Seeding Users...");

  // 1. Admin
  const admin = await User.create({
    email: "admin@soslink.fr",
    passwordHash: await User.hashPassword("Admin12345!"),
    role: "admin",
    status: "active",
    consentRgpd: true,
    emailVerified: true
  });

  // 2. Citizen
  const citizen = await User.create({
    email: "citoyen@soslink.fr",
    passwordHash: await User.hashPassword("Citoyen123!"),
    role: "citizen",
    status: "active",
    consentRgpd: true,
    emailVerified: true
  });

  // 3. Associations
  const assocParis = await User.create({
    email: "paris@croixrouge.fr",
    passwordHash: await User.hashPassword("Assoc1234!"),
    role: "association",
    status: "active",
    consentRgpd: true,
    emailVerified: true,
    organizationName: "Croix-Rouge Paris 10",
    sirenSiret: "77567227201234",
    phone: "0144523000",
    address: "24 Rue d'Hauteville, 75010 Paris",
    services: ["food", "shelter", "health", "hygiene"],
    interventionZone: {
      center: { type: "Point", coordinates: [2.3600, 48.8700] },
      radiusKm: 5
    },
    helloAssoUrl: "https://www.helloasso.com/associations/croix-rouge-francaise-paris-10"
  });

  const assocDenis = await User.create({
    email: "denis@secourspopulaire.fr",
    passwordHash: await User.hashPassword("Assoc1234!"),
    role: "association",
    status: "active",
    consentRgpd: true,
    emailVerified: true,
    organizationName: "Secours Populaire St-Denis",
    sirenSiret: "78465492400123",
    phone: "0148203040",
    address: "12 Rue de la République, 93200 Saint-Denis",
    services: ["food", "clothes", "psychological", "hygiene"],
    interventionZone: {
      center: { type: "Point", coordinates: [2.3550, 48.9350] },
      radiusKm: 7
    },
    helloAssoUrl: "https://www.helloasso.com/associations/secours-populaire-saint-denis"
  });

  // 4. Pending association for verification test
  await User.create({
    email: "contact@solibox.org",
    passwordHash: await User.hashPassword("Assoc1234!"),
    role: "association",
    status: "pending",
    consentRgpd: true,
    emailVerified: true,
    organizationName: "SoliBox IDF",
    sirenSiret: "92837482900034",
    phone: "0612345678",
    address: "75 Rue de Rivoli, 75001 Paris",
    services: ["clothes", "hygiene"]
  });

  // 5. Restaurants
  const restBistrot = await User.create({
    email: "bistrot@gourmand.fr",
    passwordHash: await User.hashPassword("Resto1234!"),
    role: "restaurant",
    status: "active",
    consentRgpd: true,
    emailVerified: true,
    organizationName: "Le Bistrot Gourmand",
    sirenSiret: "55208131700022",
    phone: "0140203040",
    address: "42 Rue de Lancry, 75010 Paris",
    interventionZone: {
      center: { type: "Point", coordinates: [2.3620, 48.8680] },
      radiusKm: 0
    }
  });

  const restBoulange = await User.create({
    email: "boulangerie@gare.fr",
    passwordHash: await User.hashPassword("Resto1234!"),
    role: "restaurant",
    status: "active",
    consentRgpd: true,
    emailVerified: true,
    organizationName: "Boulangerie de la Gare",
    sirenSiret: "48293029100055",
    phone: "0149202020",
    address: "8 Place de la Gare, 93200 Saint-Denis",
    interventionZone: {
      center: { type: "Point", coordinates: [2.3580, 48.9320] },
      radiusKm: 0
    }
  });

  // Pending restaurant for verification test
  await User.create({
    email: "supermarche@presto.fr",
    passwordHash: await User.hashPassword("Resto1234!"),
    role: "restaurant",
    status: "pending",
    consentRgpd: true,
    emailVerified: true,
    organizationName: "Presto Marché",
    sirenSiret: "38920192800044",
    phone: "0142334455",
    address: "15 Rue de Flandre, 75019 Paris"
  });

  console.log("Seeding Reports...");

  // Report 1: Paris 10, resolved
  await Report.create({
    createdBy: citizen._id,
    type: "individual",
    status: "resolved",
    location: { type: "Point", coordinates: [2.3610, 48.8690] },
    addressHint: "Près du métro Jacques Bonsergent",
    urgency: "green",
    needs: ["food", "hygiene"],
    individual: {
      apparentGender: "male",
      ageRange: "30–40 ans",
      languageBarrier: false,
      spokenToPerson: true,
      requestedHelp: true
    },
    fulfilledNeeds: ["food", "hygiene"],
    assignedAssociations: [assocParis._id],
    associationNotes: "Nous lui avons fourni un kit repas et d'hygiène complet. Il a été orienté vers un centre d'hébergement."
  });

  // Report 2: Paris 10, in progress
  await Report.create({
    createdBy: citizen._id,
    type: "individual",
    status: "in_progress",
    location: { type: "Point", coordinates: [2.3580, 48.8720] },
    addressHint: "Sous le porche face au cinéma",
    urgency: "yellow",
    needs: ["shelter", "clothes"],
    individual: {
      apparentGender: "female",
      ageRange: "40–50 ans",
      languageBarrier: true,
      spokenToPerson: true,
      requestedHelp: true
    },
    assignedAssociations: [assocParis._id],
    associationNotes: "Une maraude est programmée pour ce soir."
  });

  // Report 3: St-Denis, new, group
  await Report.create({
    createdBy: citizen._id,
    type: "group",
    status: "new",
    location: { type: "Point", coordinates: [2.3540, 48.9360] },
    addressHint: "Près du pont du canal",
    urgency: "red",
    needs: ["food", "clothes", "hygiene"],
    group: {
      peopleCount: 15,
      majorityGender: "mixed",
      averageAgeRange: "20–30 ans"
    },
    assignedAssociations: [assocDenis._id]
  });

  // Report 4: Melun (unassigned, admin manual handling)
  await Report.create({
    createdBy: citizen._id,
    type: "individual",
    status: "new",
    location: { type: "Point", coordinates: [2.6500, 48.5400] },
    addressHint: "Gare de Melun, voie A",
    urgency: "yellow",
    needs: ["food", "psychological"],
    individual: {
      apparentGender: "unknown",
      ageRange: "20–30 ans",
      languageBarrier: false,
      spokenToPerson: false,
      requestedHelp: false
    },
    assignedAssociations: []
  });

  // Report 5: Paris 10, resolved group
  await Report.create({
    createdBy: admin._id,
    type: "group",
    status: "resolved",
    location: { type: "Point", coordinates: [2.3650, 48.8670] },
    addressHint: "Place de la République, côté Statue",
    urgency: "yellow",
    needs: ["food", "hygiene"],
    group: {
      peopleCount: 25,
      majorityGender: "mixed",
      averageAgeRange: "30–40 ans"
    },
    fulfilledNeeds: ["food"],
    assignedAssociations: [assocParis._id],
    associationNotes: "Distribution de repas chauds effectuée par nos bénévoles."
  });

  console.log("Seeding Food Donations...");

  // Donations Le Bistrot Gourmand (Paris 10)
  const don1Data = { description: "20 barquettes de bœuf bourguignon chaud", quantity: "20 portions (7 kg)" };
  await FoodDonation.create({
    restaurant: restBistrot._id,
    assignedAssociation: assocParis._id,
    description: don1Data.description,
    quantity: don1Data.quantity,
    availableDate: new Date(),
    pickupSlots: [{ start: "19:00", end: "20:30" }],
    status: "collected",
    valuation: estimateDonationValue(don1Data),
    photoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80"
  });

  const don2Data = { description: "15 salades préparées et 10 desserts", quantity: "25 boîtes (5 kg)" };
  await FoodDonation.create({
    restaurant: restBistrot._id,
    assignedAssociation: assocParis._id,
    description: don2Data.description,
    quantity: don2Data.quantity,
    availableDate: new Date(),
    pickupSlots: [{ start: "21:00", end: "22:00" }],
    status: "assigned",
    valuation: estimateDonationValue(don2Data),
    photoUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80"
  });

  // Donations Boulangerie de la Gare (Saint-Denis)
  const don3Data = { description: "30 baguettes et 15 croissants de la veille", quantity: "45 pièces (8 kg)" };
  await FoodDonation.create({
    restaurant: restBoulange._id,
    assignedAssociation: assocDenis._id,
    description: don3Data.description,
    quantity: don3Data.quantity,
    availableDate: new Date(),
    pickupSlots: [{ start: "18:30", end: "19:30" }],
    status: "collected",
    valuation: estimateDonationValue(don3Data),
    photoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80"
  });

  const don4Data = { description: "10 sandwichs triangle jambon/fromage", quantity: "10 pièces (2 kg)" };
  await FoodDonation.create({
    restaurant: restBoulange._id,
    assignedAssociation: assocDenis._id,
    description: don4Data.description,
    quantity: don4Data.quantity,
    availableDate: new Date(),
    pickupSlots: [{ start: "19:00", end: "20:00" }],
    status: "assigned",
    valuation: estimateDonationValue(don4Data)
  });

  // Donation 5: declared but not assigned
  const don5Data = { description: "10 kg de pâtes cuites natures", quantity: "10 kg" };
  await FoodDonation.create({
    restaurant: restBistrot._id,
    description: don5Data.description,
    quantity: don5Data.quantity,
    availableDate: new Date(),
    pickupSlots: [{ start: "22:00", end: "23:00" }],
    status: "declared",
    valuation: estimateDonationValue(don5Data)
  });

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed", error);
  process.exit(1);
});
