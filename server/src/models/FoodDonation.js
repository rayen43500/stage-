import mongoose from "mongoose";

const foodDonationSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedAssociation: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: { type: String, required: true },
    quantity: { type: String, required: true },
    photoUrl: String,
    availableDate: { type: Date, required: true },
    pickupSlots: [{ start: String, end: String }],
    status: { type: String, enum: ["declared", "assigned", "collected", "cancelled"], default: "declared" },
    valuation: {
      category: String,
      estimatedQuantityKg: Number,
      unitPriceEur: Number,
      estimatedValueEur: Number,
      confidence: Number,
      method: String
    }
  },
  { timestamps: true }
);

foodDonationSchema.index({ restaurant: 1, availableDate: -1 });
foodDonationSchema.index({ assignedAssociation: 1, status: 1 });

export const FoodDonation = mongoose.model("FoodDonation", foodDonationSchema);
