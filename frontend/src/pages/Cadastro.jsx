import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../data/api";

export default function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    if (form.password !== form.confirmPassword) {
      setStatus("As senhas precisam ser iguais.");
      return;
    }
    if (form.password.length < 6) {
      setStatus("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          password: form.password,
        }),
      });
      navigate("/login", {
        state: {
          from: location.state?.from,
          message: "Cadastro realizado com sucesso. Faça login para continuar.",
        },
      });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_42%)] px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">
          Criar conta
        </p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">
          Entre para planejar suas viagens
        </h1>
        <p className="mt-3 text-slate-600">
          Cadastre apenas os dados necessários para começar.
        </p>
        {status ? (
          <div className="mt-6 rounded-3xl bg-red-50 p-4 text-sm text-red-800">
            {status}
          </div>
        ) : null}
        <form className="card mt-8 grid gap-5 p-8" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Nome
            <input
              className="input-field"
              name="nome"
              value={form.nome}
              onChange={updateField}
              required
              maxLength={255}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            E-mail
            <input
              className="input-field"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Senha
            <input
              className="input-field"
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              minLength={6}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Confirmar senha
            <input
              className="input-field"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={updateField}
              minLength={6}
              required
            />
          </label>
          <button
            className="btn-primary disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
          <p className="text-center text-sm text-slate-600">
            Já tem conta?{" "}
            <Link
              className="font-semibold text-[#2563EB]"
              to="/login"
              state={{ from: location.state?.from }}
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
