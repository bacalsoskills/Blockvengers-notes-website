import express from "express";
import pool from "../db.js";

const router = express.Router();

// Helper to ensure tags stored as JSON string
function safeStringifyTags(tags) {
  try {
    if (!tags) return "[]";
    if (Array.isArray(tags)) return JSON.stringify(tags);
    // If tags is already a JSON string, try parsing then re-stringify to normalize
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) return JSON.stringify(parsed);
      } catch {
        // fallthrough: treat as plain string -> wrap in array
      }
      return JSON.stringify([]);
    }
    return JSON.stringify([]);
  } catch {
    return JSON.stringify([]);
  }
}

// GET all non-deleted notes
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notes WHERE deletedAt IS NULL ORDER BY pinned DESC, updatedAt DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Get notes error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET trash (deleted) notes
router.get("/trash", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notes WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Get trash error:", err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE a new note
router.post("/", async (req, res) => {
  try {
    const {
      title = "",
      content = "",
      body = "",
      color = "yellow",
      category = "",
      tags = [],
      pinned = false,
      favorite = false,
    } = req.body || {};

    const finalContent = (content || body || "").trim();
    const normalizedTitle = title ? String(title).trim() : null;
    const allowedColors = new Set(["yellow", "pink", "blue", "green"]);
    const normalizedColor = allowedColors.has(color) ? color : "yellow";

    if ((!normalizedTitle || normalizedTitle === "") && (!finalContent || finalContent === "")) {
      return res.status(400).json({ message: "Title or content is required" });
    }

    const tagsJson = safeStringifyTags(tags);

    const [result] = await pool.query(
      `INSERT INTO notes (title, content, color, category, tags, pinned, favorite) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        normalizedTitle,
        finalContent,
        normalizedColor,
        category || null,
        tagsJson,
        pinned ? 1 : 0,
        favorite ? 1 : 0,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM notes WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a note
router.put("/:id", async (req, res) => {
  try {
    const {
      title = "",
      content = "",
      color = "yellow",
      category = "",
      tags = [],
      pinned = false,
      favorite = false,
    } = req.body || {};

    const normalizedTitle = title ? String(title).trim() : null;
    const normalizedContent = content ? String(content).trim() : "";
    const allowedColors = new Set(["yellow", "pink", "blue", "green"]);
    const normalizedColor = allowedColors.has(color) ? color : "yellow";
    const tagsJson = safeStringifyTags(tags);

    await pool.query(
      `UPDATE notes SET
         title = ?,
         content = ?,
         color = ?,
         category = ?,
         tags = ?,
         pinned = ?,
         favorite = ?,
         updatedAt = NOW()
       WHERE id = ?`,
      [
        normalizedTitle,
        normalizedContent,
        normalizedColor,
        category || null,
        tagsJson,
        pinned ? 1 : 0,
        favorite ? 1 : 0,
        req.params.id,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM notes WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Soft delete -> move to trash
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("UPDATE notes SET deletedAt = NOW() WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Note moved to trash" });
  } catch (err) {
    console.error("Soft delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Restore from trash
router.put("/:id/restore", async (req, res) => {
  try {
    await pool.query("UPDATE notes SET deletedAt = NULL WHERE id = ?", [req.params.id]);
    const [rows] = await pool.query("SELECT * FROM notes WHERE id = ?", [req.params.id]);
    res.json({ success: true, note: rows[0], message: "Note restored" });
  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Permanent delete
router.delete("/:id/permanent", async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Note permanently deleted" });
  } catch (err) {
    console.error("Permanent delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
