// backend/server.js
import express from "express";
import cors from "cors";
import noteRoutes from "./routes/NoteRoutes.js";
import transactionRoutes from "./routes/transaction.js";
import blockchainRouter from "./routes/notes_blockchain.js";


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/notes", noteRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api", blockchainRouter);

app.listen(5000, () => {
  console.log("Backend running at http://localhost:5000");
});
