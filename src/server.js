import "dotenv/config";
import app from "./app.js";
import connection from "./config/dbConfig.js";

const port = process.env.API_PORT || 27017;

try {
  await connection();
  app.listen(port, () => console.log(`App ouvindo porta: ${port}`));
} catch (err) {
  console.error("Falha ao iniciar servidor:", err);
  process.exit(1);
}
