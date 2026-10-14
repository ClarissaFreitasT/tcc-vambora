import { StrictMode } from "react";
/* The entrypoint owns the router shell and is not a refresh boundary. */
/* eslint-disable react-refresh/only-export-components */
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home.jsx";
import Roteiros from "./pages/Roteiros.jsx";
import RoteirosPublicos from "./pages/RoteirosPublicos.jsx";
import NovoRoteiro from "./pages/NovoRoteiro.jsx";
import Comunidade from "./pages/Comunidade.jsx";
import Perfil from "./pages/Perfil.jsx";
import RoteiroDetalhes from "./pages/RoteiroDetalhes.jsx";
import Login from "./pages/Login.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from './components/Navbar.jsx';

function AppLayout() {
  return <><Navbar /><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/roteiros/publicos" element={<RoteirosPublicos />} />
    <Route path="/cadastro" element={<Cadastro />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/roteiros" element={<Roteiros />} />
      <Route path="/roteiros/novo" element={<NovoRoteiro />} />
      <Route path="/comunidade" element={<Comunidade />} />
      <Route path="/perfil" element={<Perfil />} />
    </Route>
    <Route path="/roteiros/:id" element={<RoteiroDetalhes />} />
    <Route path="/login" element={<Login />} />
  </Routes></>
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
