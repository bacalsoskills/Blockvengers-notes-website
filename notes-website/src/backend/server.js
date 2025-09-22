import express from "express";
import cors from "cors";
import noteRoutes from "./routes/NoteRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/notes", noteRoutes);

app.listen(5000, () => {
  console.log("Backend running at http://localhost:5000");
});
