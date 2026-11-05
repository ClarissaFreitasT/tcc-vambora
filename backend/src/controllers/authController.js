import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { parseBirthDate, isAtLeast18 } from "../utils/birthDate.js";
import { normalizarUsername } from "../utils/username.js";

export async function register(req, res) {
  try {
    const { nome, email, password, username, dataNascimento } = req.body;

    if (!nome || !email || !password || !username || !dataNascimento) {
      return res.status(400).json({
        message:
          "Nome, nome de usuário, email, data de nascimento e senha são obrigatórios",
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

    const nomeUsuario = normalizarUsername(username);
    if (!nomeUsuario) {
      return res.status(400).json({
        mensagem:
          "Nome de usuário inválido. Use apenas letras, números, pontos e underscores, sem espaços.",
      });
    }

    const usuarioComUsername = await prisma.usuario.findUnique({
      where: { username: nomeUsuario },
    });

    if (usuarioComUsername) {
      return res.status(400).json({
        mensagem: "Nome de usuário indisponível",
      });
    }

    const senhaHash = await bcrypt.hash(password, 10);

    const data = {
      nome,
      email,
      senhaHash,
      dataNascimento: nascimento,
    };

    data.username = nomeUsuario;

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
    if (error?.code === "P2002") {
      return res.status(400).json({
        mensagem: "Nome de usuário indisponível",
      });
    }
    console.error("Erro no cadastro:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
}

export async function verificarDisponibilidadeUsername(req, res) {
  const nomeUsuario = normalizarUsername(req.query.username);

  if (!nomeUsuario) {
    return res.status(400).json({
      disponivel: false,
      mensagem:
        "Nome de usuário inválido. Use apenas letras, números, pontos e underscores, sem espaços.",
    });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { username: nomeUsuario },
    select: { id: true },
  });

  return res.status(200).json({
    username: nomeUsuario,
    disponivel: !usuario,
  });
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
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      },
    );

    return res.status(200).json({
      message: "Login realizado com sucesso",
      token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        ...(usuario.username ? { username: usuario.username } : {}),
        fotoUrl: usuario.fotoUrl,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
}
