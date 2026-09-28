import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const actions = [
  {
    label: "Meus roteiros",
    to: "/roteiros",
    description: "Acesse e edite os roteiros já salvos.",
    emoji: "🧭",
  },
  {
    label: "Criar roteiro",
    to: "/roteiros/novo",
    description: "Comece um roteiro do zero em uma única tela.",
    emoji: "✈️",
  },
  {
    label: "Comunidade",
    to: "/comunidade",
    description: "Descubra experiências de outros viajantes.",
    emoji: "🤝",
  },
  {
    label: "Perfil",
    to: "/perfil",
    description: "Atualize seus dados e preferências.",
    emoji: "👤",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("vambora_token")) {
      navigate("/login");
    }
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("vambora_token");
    localStorage.removeItem("vambora_usuario");
    navigate("/login");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_42%)] px-4 py-16 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.07)] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">
              Área logada
            </p>
            <h1 className="mt-3 text-4xl font-black text-slate-900">
              Bem-vindo ao Vambora
            </h1>
            <p className="mt-3 text-slate-600">
              Escolha uma ação para continuar planejando sua próxima viagem.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary border-red-200 text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="card block h-full p-6"
            >
              <div className="mb-4 text-4xl">{action.emoji}</div>
              <h2 className="text-xl font-bold text-slate-900">
                {action.label}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
