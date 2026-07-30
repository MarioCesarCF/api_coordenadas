import cors from "cors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/index.route.js";
import errorHandler from "./middlewares/error.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ORIGINS = FRONTEND_URL.split(",").map((s) => s.trim());

const isDev = process.env.NODE_ENV !== "production";
if (isDev) {
  ORIGINS.push("http://localhost:5173", "http://localhost:4173");
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      connectSrc: ["'self'", ...ORIGINS],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ORIGINS.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

app.use(router);
app.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

app.use(errorHandler);

export default app;
