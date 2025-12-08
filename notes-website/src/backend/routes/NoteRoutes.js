import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all non-deleted notes
router.get("/", async (req, res) => {
  try {
    // We filter out soft-deleted notes (where deletedAt is NOT NULL)
    const [rows] = await pool.query("SELECT * FROM notes WHERE deletedAt IS NULL ORDER BY pinned DESC, updatedAt DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get trash (deleted) notes
router.get("/trash", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notes WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new note
router.post("/", async (req, res) => {
  try {
    // Frontend sends 'body', DB expects 'content'. We accept both.
    const { title, content, body, color, category, tags, pinned, favorite } = req.body || {};
    
    // Fix: Prioritize 'content', fallback to 'body'
    const finalContent = content || body || "";
    
    const allowedColors = new Set(["yellow", "pink", "blue", "green"]);

    if ((!title || String(title).trim() === "") && (!finalContent || String(finalContent).trim() === "")) {
      return res.status(400).json({ message: "Title or content is required" });
    }

    const normalizedTitle = title ? String(title).trim() : null;
    const normalizedContent = String(finalContent).trim();
    const normalizedColor = allowedColors.has(color) ? color : "yellow";
    
    // Stringify tags array for JSON storage
    const tagsJson = tags ? JSON.stringify(tags) : "[]";

    const [result] = await pool.query(
      "INSERT INTO notes (title, content, color, category, tags, pinned, favorite) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [normalizedTitle, normalizedContent, normalizedColor, category, tagsJson, pinned || false, favorite || false]
    );

    const [rows] = await pool.query("SELECT * FROM notes WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create note error:', err)
    res.status(500).json({ error: err.message })
  }
});

// Get notes (optionally filter by address)
router.get('/', async (req, res) => {
  try {
    const { title, content, body, color, category, tags, pinned, favorite } = req.body;
    
    const finalContent = content || body;
    const tagsJson = tags ? JSON.stringify(tags) : undefined; // undefined keeps existing if we build dynamic query, but simple update below:

    // This query assumes you send ALL fields on update. 
    await pool.query(
      `UPDATE notes SET 
       title = ?, content = ?, color = ?, category = ?, tags = ?, pinned = ?, favorite = ?, 
       updatedAt = NOW() 
       WHERE id = ?`,
      [title, finalContent, color, category, tagsJson, pinned, favorite, req.params.id]
    );
    
    // Fetch the updated note to return clean data
    const [rows] = await pool.query("SELECT * FROM notes WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Get notes error:', err)
    res.status(500).json({ error: err.message })
  }
});

// Soft Delete (Move to Trash)
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("UPDATE notes SET deletedAt = NOW() WHERE id = ?", [req.params.id]);
    res.json({ message: "Note moved to trash" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore from Trash
router.put("/:id/restore", async (req, res) => {
  try {
    await pool.query("UPDATE notes SET deletedAt = NULL WHERE id = ?", [req.params.id]);
    res.json({ message: "Note restored" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hard Delete (Permanent)
router.delete("/:id/permanent", async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id = ?", [req.params.id]);
    res.json({ message: "Note permanently deleted" });
  } catch (err) {
    console.error('Update note error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router;