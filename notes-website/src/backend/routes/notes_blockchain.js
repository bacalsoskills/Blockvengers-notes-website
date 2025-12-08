import express from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/* ------------------------------
   BLOCKCHAIN NOTES
------------------------------ */

// Create pending blockchain note
router.post("/notes_blockchain", async (req, res) => {
  try {
    const { address, action, content, tx_hash, status } = req.body;

    if (!address || !action || !content) {
      return res.status(400).json({ error: "Address, action, and content are required" });
    }

    const note_id = uuidv4();

    const [result] = await pool.query(
      `INSERT INTO notes_blockchain 
       (address, note_id, action, content, tx_hash, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [address, note_id, action, content, tx_hash || null, status || "pending"]
    );

    const [rows] = await pool.query(
      "SELECT * FROM notes_blockchain WHERE id = ?",
      [result.insertId]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get blockchain notes (optionally by address)
router.get("/notes_blockchain", async (req, res) => {
  try {
    const { address } = req.query;

    let query = "SELECT * FROM notes_blockchain";
    const params = [];

    if (address) {
      query += " WHERE address = ?";
      params.push(address);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update blockchain note
router.put("/notes_blockchain/:id", async (req, res) => {
  try {
    const updates = [];
    const params = [];
    const { tx_hash, status } = req.body;

    if (tx_hash !== undefined) {
      updates.push("tx_hash = ?");
      params.push(tx_hash);
    }

    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.params.id);

    await pool.query(
      `UPDATE notes_blockchain SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params
    );

    const [rows] = await pool.query(
      "SELECT * FROM notes_blockchain WHERE id = ?",
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
