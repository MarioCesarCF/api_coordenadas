import "dotenv/config";
import app from "./app.js";
const port = process.env.PORT || 27017;
app.listen(port, () => console.log(`App ouvindo porta: ${port}`));