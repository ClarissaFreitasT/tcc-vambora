import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { parseBirthDate, isAtLeast18 } from "../utils/birthDate.js";

export async function register(req, res) {
  try {
    const { nome, email, password, username, dataNascimento } = req.body;

    if (!nome || !email || !password || !dataNascimento) {
      return res.status(400).json({
        message: "Nome, email, data de nascimento e senha são obrigatórios",
      });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "A senha deve ter pelo menos 6 caracteres.",
      });
    }

    const nascimento = parseBirthDate(dataNascimento);
    if (!nascimento) {
      return res.status(400).json({
        message: "Data de nascimento inválida. Use o formato DD/MM/AAAA.",
      });
    }
    if (!isAtLeast18(nascimento)) {
      return res.status(400).json({
        message: "É necessário ter pelo menos 18 anos para criar uma conta.",
      });
    }

    const usuarioExiste = await prisma.usuario.findUnique({ where: { email } });

    if (usuarioExiste) {
      return res.status(400).json({
        mensagem: "E-mail já cadastrado",
      });
    }

    let nomeUsuario = null;
    if (username) {
      nomeUsuario = username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "");

      if (!nomeUsuario) {
        return res.status(400).json({
          mensagem: "Username inválido",
        });
      }

      const usuarioComUsername = await prisma.usuario.findUnique({
        where: { username: nomeUsuario },
      });

      if (usuarioComUsername) {
        return res.status(400).json({
          mensagem: "Username já está em uso",
        });
      }
    }

    const senhaHash = await bcrypt.hash(password, 10);

    const data = {
      nome,
      email,
      senhaHash,
      dataNascimento: nascimento,
    };

    if (nomeUsuario) {
      data.username = nomeUsuario;
    }

    const usuario = await prisma.usuario.create({
      data,
    });

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        ...(usuario.username ? { username: usuario.username } : {}),
      },
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
        message: "Email e senha são obrigatórios",
      });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos",
      });
    }

    const senhaValida = await bcrypt.compare(password, usuario.senhaHash);

    if (!senhaValida) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos",
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    return res.status(200).json({
      message: "Login realizado com sucesso",
      token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
}
