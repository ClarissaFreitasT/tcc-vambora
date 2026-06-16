import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Roteiros from './pages/Roteiros.jsx'
import NovoRoteiro from './pages/NovoRoteiro.jsx'
import Comunidade from './pages/Comunidade.jsx'
import Perfil from './pages/Perfil.jsx'
import RoteiroDetalhes from './pages/RoteiroDetalhes.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/roteiros" element={<Roteiros />} />
        <Route path="/roteiros/novo" element={<NovoRoteiro />} />
        <Route path="/roteiros/:id" element={<RoteiroDetalhes />} />
        <Route path="/comunidade" element={<Comunidade />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
