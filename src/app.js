import cors from "cors";
import "dotenv/config";
import express from "express";
import connection from "./config/dbConfig.js";
import router from "./routes/index.route.js";

const app = express();
app.use(cors());
app.use(express.json());
await connection();

app.use(router);
app.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

export default app;