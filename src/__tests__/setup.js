import mongoose from "mongoose";
import { beforeAll, afterAll } from "vitest";

const TEST_DB_NAME = "apiCoordenadas_test";

beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${TEST_DB_NAME}`;
  const testUrl = url.href;
  process.env.DATABASE_URL = testUrl;
  await mongoose.connect(testUrl);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
