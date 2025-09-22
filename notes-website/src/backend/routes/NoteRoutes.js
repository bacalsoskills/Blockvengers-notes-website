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

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id=?", [req.params.id]);
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
