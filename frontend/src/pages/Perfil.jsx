import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../data/api'
import { useAuth } from '../context/useAuth'
import Feedback from '../components/Feedback'

function money(value) {
  if (value === null || value === undefined || value === '') return 'Não informado'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

export default function Perfil() {
  const { user, updateUser, logout } = useAuth()
  const [form, setForm] = useState({ nome: '', email: '', bio: '' })
  const [roteiros, setRoteiros] = useState([])
  const [status, setStatus] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProfileData() {
      try {
        const [profile, userRoteiros] = await Promise.all([apiFetch('/usuarios/me'), apiFetch('/roteiros')])
        setForm({ nome: profile.nome || '', email: profile.email || '', bio: profile.bio || '' })
        setRoteiros(userRoteiros)
      } catch (error) { setStatus({ type: 'error', message: error.message }) } finally { setLoading(false) }
    }
    loadProfileData()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.nome.trim()) nextErrors.nome = 'Informe seu nome.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Informe um e-mail válido.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { setStatus({ type: 'error', message: 'Revise seus dados antes de salvar.' }); return }
    setSaving(true); setStatus(null)
    try { await updateUser(form); setStatus('Perfil atualizado com sucesso.') } catch (error) { setStatus({ type: 'error', message: error.message }) } finally { setSaving(false) }
  }

  if (loading) return <main className="container mx-auto px-4 py-16">Carregando perfil...</main>

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.1),_transparent_45%)] px-4 py-16 lg:px-8"><div className="container mx-auto max-w-5xl"><header className="flex flex-col gap-5 rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:flex-row sm:items-end sm:justify-between lg:p-10"><div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Minha conta</p><h1 className="mt-4 text-4xl font-black text-slate-900">Olá, {user?.nome || form.nome}</h1><p className="mt-3 text-slate-600">Gerencie seus dados e acompanhe seus roteiros.</p></div><button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={logout}>Sair</button></header><div className="mt-6"><Feedback status={status} onDismiss={() => setStatus(null)} /></div><section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><form className="card grid gap-5 p-8" onSubmit={handleSubmit} noValidate><h2 className="text-xl font-bold text-slate-900">Dados pessoais</h2><label className="grid gap-2 text-sm font-medium text-slate-700">Nome<input className={`input-field ${errors.nome ? 'border-red-400' : ''}`} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={255} />{errors.nome ? <span className="text-xs font-normal text-red-700">{errors.nome}</span> : null}</label><label className="grid gap-2 text-sm font-medium text-slate-700">E-mail<input className={`input-field ${errors.email ? 'border-red-400' : ''}`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email ? <span className="text-xs font-normal text-red-700">{errors.email}</span> : null}</label><label className="grid gap-2 text-sm font-medium text-slate-700">Bio<textarea className="input-field" rows={4} maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /><span className="text-right text-xs font-normal text-slate-500">{form.bio.length}/500</span></label><button className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button></form><div><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Histórico</p><h2 className="mt-2 text-2xl font-black text-slate-900">Seus roteiros</h2></div><Link className="text-sm font-semibold text-[#2563EB]" to="/roteiros">Ver todos</Link></div><div className="grid gap-4">{roteiros.map((roteiro) => <Link key={roteiro.id} to={`/roteiros/${roteiro.id}`} className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{roteiro.titulo}</h3><p className="mt-1 text-sm text-slate-500">{roteiro.destino}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{roteiro.dias?.length || 0} dias</span></div><div className="mt-4 flex justify-between text-sm text-slate-500"><span>{roteiro.publico ? 'Público' : 'Privado'}</span><span>{money(roteiro.orcamento)}</span></div></Link>)}{roteiros.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Seu histórico ainda está vazio.</div> : null}</div></div></section></div></main>
}
