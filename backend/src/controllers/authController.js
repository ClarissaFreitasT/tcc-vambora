import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export async function register(req, res) {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({
        message: "Nome, email e senha são obrigatórios"
      });
    }

    const usuarioExiste = await prisma.usuario.findUnique({ where: { email } });

    if (usuarioExiste) {
      return res.status(400).json({
        mensagem: "E-mail já cadastrado"
      });
    }

    const senhaHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: nome,
        email: email,
        senhaHash
      }
    });

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email e senha são obrigatórios"
      });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos"
      });
    }

    const senhaValida = await bcrypt.compare(password, usuario.senhaHash);

    if (!senhaValida) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos"
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso",
      token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
}