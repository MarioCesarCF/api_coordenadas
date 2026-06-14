import cors from "cors";
import "dotenv/config";
import express from "express";
import router from "./routes/index.route.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(router);
app.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

app.use(errorHandler);

export default app;
