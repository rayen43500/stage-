import mongoose from "mongoose";
import { Report } from "../models/Report.js";

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sos-link");
  console.log("Connected to MongoDB");

  // 1. Create anonymous quick report
  const quickReport = await Report.create({
    isAnonymous: true,
    type: "individual",
    location: { type: "Point", coordinates: [2.3522, 48.8566] },
    addressHint: "Test Place de la République",
    comment: "Personne seule ayant besoin d'une couverture et de nourriture",
    imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    urgency: "yellow",
    needs: ["food", "shelter"]
  });

  console.log("Created quick report:", quickReport._id, "isAnonymous:", quickReport.isAnonymous);

  // 2. Simulate association requesting status change
  quickReport.pendingStatus = {
    status: "resolved",
    requestedAt: new Date(),
    note: "Pris en charge et orienté vers un centre"
  };
  await quickReport.save();
  console.log("Updated report pendingStatus:", quickReport.pendingStatus);

  // 3. Simulate admin confirming status
  quickReport.status = quickReport.pendingStatus.status;
  quickReport.pendingStatus = undefined;
  await quickReport.save();
  console.log("Admin confirmed. Final status:", quickReport.status, "pendingStatus:", quickReport.pendingStatus);

  // Cleanup test report
  await Report.findByIdAndDelete(quickReport._id);
  console.log("Test report cleaned up.");

  await mongoose.disconnect();
  console.log("Test completed successfully!");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
