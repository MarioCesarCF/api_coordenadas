import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const token = (req.cookies && req.cookies.accessToken) || _extrairTokenHeader(req);

  if (!token) {
    return res.status(401).send({ message: "Token não fornecido." });
  }

  try {
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id;
    req.organizacaoId = decoded.organizacao || null;
    req.papel = decoded.papel || "membro";
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError" && req.cookies?.refreshToken) {
      return _tentarRenovar(req, res, next);
    }
    return res.status(401).send({ message: "Token inválido ou expirado." });
  }
};

function _extrairTokenHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

async function _tentarRenovar(req, res, next) {
  try {
    const RefreshToken = (await import("../models/RefreshToken.js")).default;
    const UsuarioRepository = (await import("../repositories/usuario.repository.js")).default;
    const usuarioRepository = new UsuarioRepository();

    const rawToken = req.cookies.refreshToken;
    const tokenDoc = await usuarioRepository.buscarRefreshToken(rawToken);

    if (!tokenDoc) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).send({ message: "Sessão expirada. Faça login novamente." });
    }

    const user = await usuarioRepository.findById(tokenDoc.usuario);
    if (!user) {
      return res.status(401).send({ message: "Usuário não encontrado." });
    }

    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
    const newAccessToken = jwt.sign(
      { id: user._id, organizacao: user.organizacao || null, papel: user.papel || "membro" },
      secret,
      { expiresIn }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    req.userId = user._id;
    req.organizacaoId = user.organizacao || null;
    req.papel = user.papel || "membro";
    next();
  } catch {
    return res.status(401).send({ message: "Token inválido ou expirado." });
  }
}

export default authMiddleware;
