import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "De@thless1",
  database: "notesdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.query("SELECT 1")
  .then(() => console.log("DB connected!"))
  .catch(err => console.error("DB connection failed:", err));

export default pool;
