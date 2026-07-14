import mongoose from "mongoose";

const needs = ["hygiene", "clothes", "food", "shelter", "health", "psychological", "other"];

const reportSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedAssociations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, enum: ["individual", "group"], required: true },
    status: { type: String, enum: ["new", "in_progress", "resolved", "removed"], default: "new" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    },
    addressHint: String,
    urgency: { type: String, enum: ["green", "yellow", "red"], required: true },
    needs: [{ type: String, enum: needs }],
    otherNeed: String,
    individual: {
      apparentGender: { type: String, enum: ["male", "female", "unknown"] },
      ageRange: String,
      languageBarrier: Boolean,
      spokenToPerson: Boolean,
      requestedHelp: Boolean
    },
    group: {
      peopleCount: Number,
      majorityGender: { type: String, enum: ["male", "female", "mixed"] },
      averageAgeRange: String
    },
    fulfilledNeeds: [{ type: String, enum: needs }],
    associationNotes: String,
    adminNotes: String
  },
  { timestamps: true }
);

reportSchema.index({ location: "2dsphere" });
reportSchema.index({ createdBy: 1, createdAt: -1 });
reportSchema.index({ assignedAssociations: 1, status: 1 });

export const Report = mongoose.model("Report", reportSchema);
