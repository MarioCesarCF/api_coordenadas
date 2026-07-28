import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index.route.js";
import errorHandler from "./middlewares/error.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

app.use(router);
app.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

app.use(errorHandler);

export default app;
