import rateLimit from "express-rate-limit";

const skip = () => process.env.NODE_ENV === "test";

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: "Muitas tentativas de login. Tente novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
  skip,
});

export const esqueciSenhaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Muitas solicitações de redefinição. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
  skip,
});
