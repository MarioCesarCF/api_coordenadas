import mongoose from "mongoose";

const connection = async () => {
  try {
    const uri = process.env.DATABASE_URL;

    if (!uri) {
      throw new Error("DATABASE_URL não definida.");
    }

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    await mongoose.connect(uri);

    console.log("Sucesso de conexão com MongoDB.");

    return mongoose.connection;
  } catch (error) {
    console.error("Erro de conexão com MongoDB:", error);
    throw error;
  }
};

export default connection;
