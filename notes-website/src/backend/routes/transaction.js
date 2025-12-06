// backend/routes/transaction.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// Save blockchain transaction
router.post("/", async (req, res) => {
  try {
    const { tx_hash, amount, sender, recipient, metadata } = req.body;

    if (!tx_hash || !amount) {
      return res.status(400).json({ message: "tx_hash and amount are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO transactions (tx_hash, amount, sender, recipient, metadata, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        tx_hash,
        amount,
        sender || null,
        recipient || null,
        JSON.stringify(metadata || {})
      ]
    );

    const [rows] = await pool.query("SELECT * FROM transactions WHERE id = ?", [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Transaction Save Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all saved blockchain transactions (optionally filter by sender)
router.get("/", async (req, res) => {
  try {
    const { sender } = req.query
    let query = "SELECT * FROM transactions"
    const params = []
    if (sender) {
      query += " WHERE sender = ?"
      params.push(sender)
    }
    query += " ORDER BY createdAt DESC"
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
