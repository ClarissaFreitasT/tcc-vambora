import { StrictMode, Suspense, lazy } from "react";
/* The entrypoint owns the router shell and is not a refresh boundary. */
/* eslint-disable react-refresh/only-export-components */
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home.jsx";
import Roteiros from "./pages/Roteiros.jsx";
import RoteirosPublicos from "./pages/RoteirosPublicos.jsx";
import RoteirosSalvos from "./pages/RoteirosSalvos.jsx";
import NovoRoteiro from "./pages/NovoRoteiro.jsx";
import Comunidade from "./pages/Comunidade.jsx";
import Perfil from "./pages/Perfil.jsx";
import RoteiroDetalhes from "./pages/RoteiroDetalhes.jsx";
import Login from "./pages/Login.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";

const Explorar = lazy(() => import("./pages/Explorar.jsx"));

function AppLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<Suspense fallback={<main className="container mx-auto py-16 text-slate-600">Preparando o globo 3D…</main>}><Explorar /></Suspense>} />
        <Route path="/roteiros/publicos" element={<RoteirosPublicos />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/comunidade" element={<Comunidade />} />
        <Route path="/perfil/:username" element={<Perfil />} />
        <Route path="/perfil/id/:userId" element={<Perfil />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/roteiros" element={<Roteiros />} />
          <Route path="/roteiros/salvos" element={<RoteirosSalvos />} />
          <Route path="/roteiros/novo" element={<NovoRoteiro />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route path="/roteiros/:id" element={<RoteiroDetalhes />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
