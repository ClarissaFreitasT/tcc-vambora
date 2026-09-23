import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(
          data.message || data.mensagem || "E-mail ou senha inválidos.",
        );
        return;
      }

      localStorage.setItem("vambora_token", data.token);
      localStorage.setItem("vambora_usuario", JSON.stringify(data.usuario));
      navigate("/roteiros");
    } catch {
      setStatus("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_42%)] px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">
            Acesse sua conta
          </p>
          <h1 className="mt-4 text-4xl font-black text-slate-900">
            Bem-vindo de volta
          </h1>
          <p className="mt-3 text-slate-600">
            Entre para continuar planejando suas viagens.
          </p>
        </div>

        {status ? (
          <div className="mb-6 rounded-3xl bg-red-50 p-4 text-sm font-medium text-red-800">
            {status}
          </div>
        ) : null}

        <form className="card space-y-6 p-8" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            E-mail
            <input
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Senha
            <input
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              minLength={6}
              required
            />
          </label>

          <button
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-slate-600">
            Ainda não tem uma conta?{" "}
            <Link
              className="font-semibold text-[#2563EB] hover:underline"
              to="/perfil"
            >
              Criar perfil
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
