import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    category: { type: String, default: "Actualité", trim: true },
    author: { type: String, default: "Équipe SOS CONNECT", trim: true },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const BlogPost = mongoose.model("BlogPost", blogPostSchema);
