import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token não informado",
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({
      message: "Token inválido",
    });
  }

  const [prefix, token] = parts;

  if (prefix !== "Bearer") {
    return res.status(401).json({
      message: "Token inválido",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      message: "Token inválido ou expirado",
    });
  }

  const usuario = await prisma.usuario.findUnique({
    where: {
      id: decoded.id,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
    },
  });

  if (!usuario) {
    return res.status(401).json({
      message: "Usuário não encontrado",
    });
  }

  req.user = usuario;
  return next();
}

export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return authMiddleware(req, res, next);
}
