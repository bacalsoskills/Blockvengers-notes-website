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

    await pool.query(
      `INSERT INTO transactions (tx_hash, amount, sender, recipient, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        tx_hash,
        amount,
        sender || null,
        recipient || null,
        JSON.stringify(metadata || {})
      ]
    );

    res.json({ success: true, message: "Transaction saved" });
  } catch (err) {
    console.error("Transaction Save Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all saved blockchain transactions
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM transactions ORDER BY createdAt DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
