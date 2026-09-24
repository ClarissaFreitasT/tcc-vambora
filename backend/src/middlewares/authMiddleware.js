// Estas dependências serão usadas quando os TODOs forem completados em aula.
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export default async function authMiddleware(req, res, next) {
  // Middleware é uma função que fica no meio do caminho entre a requisição
  // e a resposta. O Express executa esta função antes da rota protegida.
  //
  // Aqui vamos verificar se o usuário está logado.
  // Se estiver logado, chamamos next() e deixamos a rota continuar.
  // Se não estiver, enviamos uma resposta e bloqueamos o acesso.
  //
  // O middleware funciona como um porteiro: ele pode deixar a requisição
  // continuar, bloquear, modificar ou adicionar informações nela.
  // Se ele não chamar next(), a função final da rota não será executada.

  // TODO: ler o header Authorization
  const authHeader = req.headers.authorization;

  // TODO: verificar se o token foi enviado
  if (!authHeader) {
    return res.status(401).json({
      message: "Token não informado"
    });
  }

  // TODO: separar a palavra Bearer do token
  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({
      message: "Token inválido"
    });
  }

  const [prefix, token] = parts;

  if (prefix !== "Bearer") {
    return res.status(401).json({
      message: "Token inválido"
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      message: "Token inválido ou expirado"
    });
  }

  // TODO: buscar o usuário no banco pelo id que veio no token
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: decoded.id
    },
    select: {
      id: true,
      nome: true,
      email: true
    }
  });

  if (!usuario) {
    return res.status(401).json({
      message: "Usuário não encontrado"
    });
  }

  // TODO: adicionar o usuário na requisição usando req.user
  req.user = usuario;

  // TODO: chamar next() para liberar a rota protegida
  return next();

  // return res.status(501).json({
  //   message: "Middleware de autenticação ainda será implementado pelos alunos"
  // });
}

export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return authMiddleware(req, res, next);
}