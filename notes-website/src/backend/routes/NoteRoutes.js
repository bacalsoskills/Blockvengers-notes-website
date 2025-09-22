import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all notes
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notes ORDER BY updatedAt DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single note
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notes WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Note not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new note
router.post("/", async (req, res) => {
  try {
    const { title, content, color } = req.body || {};

    const allowedColors = new Set(["yellow", "pink", "blue", "green"]);

    if ((title == null || String(title).trim() === "") && (content == null || String(content).trim() === "")) {
      return res.status(400).json({ message: "Title or content is required" });
    }

    const normalizedTitle = title != null ? String(title).trim() : null;
    const normalizedContent = content != null ? String(content).trim() : null;
    const normalizedColor = allowedColors.has(color) ? color : "yellow";

    const [result] = await pool.query(
      "INSERT INTO notes (title, content, color) VALUES (?, ?, ?)",
      [normalizedTitle, normalizedContent, normalizedColor]
    );

    const [rows] = await pool.query("SELECT * FROM notes WHERE id = ?", [result.insertId]);
    const created = rows && rows[0] ? rows[0] : {
      id: result.insertId,
      title: normalizedTitle,
      content: normalizedContent,
      color: normalizedColor,
      updatedAt: new Date()
    };

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update existing note
router.put("/:id", async (req, res) => {
  try {
    const { title, content, color } = req.body;
    
    // Update note in database
    await pool.query(
      "UPDATE notes SET title = ?, content = ?, color = ?, updatedAt = NOW() WHERE id = ?",
      [title, content, color, req.params.id]
    );
    
    // Return updated note data
    res.json({ 
      id: req.params.id, 
      title, 
      content, 
      color, 
      updatedAt: new Date() 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id=?", [req.params.id]);
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
