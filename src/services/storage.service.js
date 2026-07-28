import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "..", "..", "uploads");

const BASE_URL = process.env.API_URL || `http://localhost:${process.env.API_PORT || 27017}`;

function garantirPasta() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function gerarNomeArquivo(originalName) {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString("hex");
  return `${hash}${ext}`;
}

export function isS3Configurado() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);
}

export async function salvarArquivo(buffer, originalName, mimetype) {
  const nomeArquivo = gerarNomeArquivo(originalName);

  if (isS3Configurado()) {
    try {
      const { S3Client, PutObjectCommand, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      await client.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: nomeArquivo,
        Body: buffer,
        ContentType: mimetype,
      }));

      const url = await getSignedUrl(client, new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: nomeArquivo,
      }), { expiresIn: 7 * 24 * 3600 });

      return { key: nomeArquivo, url };
    } catch (err) {
      console.error("Erro ao enviar para S3:", err.message);
      throw err;
    }
  }

  garantirPasta();
  const filePath = path.join(UPLOADS_DIR, nomeArquivo);
  fs.writeFileSync(filePath, buffer);

  return {
    key: nomeArquivo,
    url: `${BASE_URL}/uploads/${nomeArquivo}`,
  };
}

export async function obterUrlArquivo(key) {
  if (!key) return null;

  if (isS3Configurado()) {
    try {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const url = await getSignedUrl(client, new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      }), { expiresIn: 7 * 24 * 3600 });

      return url;
    } catch {
      return null;
    }
  }

  return `${BASE_URL}/uploads/${key}`;
}

export async function removerArquivo(key) {
  if (!key) return;

  if (isS3Configurado()) {
    try {
      const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

      const client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      await client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      }));
    } catch (err) {
      console.error("Erro ao remover do S3:", err.message);
    }
    return;
  }

  const filePath = path.join(UPLOADS_DIR, key);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
