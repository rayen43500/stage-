import { Router } from "express";
import { BlogPost } from "../models/BlogPost.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/blog — Get all published blog posts (public)
router.get("/", async (req, res) => {
  try {
    const posts = await BlogPost.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("Fetch blog posts error:", error);
    res.status(500).json({ message: "Impossible de récupérer les articles." });
  }
});

// GET /api/blog/:id — Get a single blog post
router.get("/:id", async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Article non trouvé." });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'article." });
  }
});

// POST /api/blog — Create a new blog post (Admin only)
router.post("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { title, summary, content, imageUrl, category, author } = req.body;
    if (!title || !summary || !content) {
      return res.status(400).json({ message: "Le titre, le résumé et le contenu sont requis." });
    }

    const post = await BlogPost.create({
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
      category: category ? category.trim() : "Actualité",
      author: author ? author.trim() : "Équipe SOS CONNECT",
      isPublished: true
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Create blog post error:", error);
    res.status(500).json({ message: "Erreur lors de la création de l'article." });
  }
});

// DELETE /api/blog/:id — Delete a blog post (Admin only)
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Article introuvable." });
    res.json({ message: "Article supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'article." });
  }
});

export default router;
