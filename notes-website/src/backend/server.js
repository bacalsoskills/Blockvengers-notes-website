// backend/server.js
import express from "express";
import cors from "cors";
import noteRoutes from "./routes/noteRoutes.js";
import transactionRoutes from "./routes/transaction.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/notes", noteRoutes);
app.use("/api/transaction", transactionRoutes);

app.listen(5000, () => {
  console.log("Backend running at http://localhost:5000");
});
