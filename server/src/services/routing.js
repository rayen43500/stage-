import { User } from "../models/User.js";

const urgencyWeight = { red: 3, yellow: 2, green: 1 };

export async function findMatchingAssociations(report) {
  const [lng, lat] = report.location.coordinates;
  const associations = await User.find({
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

  return associations
    .filter((association) => {
      const radiusMeters = (association.interventionZone?.radiusKm || 0) * 1000;
      const distance = distanceMeters([lng, lat], association.interventionZone.center.coordinates);
      const coversNeed = !association.services?.length || report.needs.some((need) => association.services.includes(need));
      return distance <= radiusMeters && coversNeed;
    })
    .sort((a, b) => {
      // Sort by distance to the report (closest first)
      const da = distanceMeters([lng, lat], a.interventionZone.center.coordinates);
      const db = distanceMeters([lng, lat], b.interventionZone.center.coordinates);
      return da - db;
    });
}

export function distanceMeters(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}
