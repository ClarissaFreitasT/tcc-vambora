import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, requireAuth } from '../data/api'

export default function NovoRoteiro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ titulo: '', destino: '', descricao: '', orcamento: '', publico: false })
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!requireAuth(navigate)) return
    setSaving(true)
    setStatus(null)

    try {
      const data = await apiFetch('/roteiros', {
        method: 'POST',
        body: JSON.stringify({ ...form, orcamento: form.orcamento === '' ? null : Number(form.orcamento) })
      })
      navigate(`/roteiros/${data.roteiro.id}`)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_42%)] px-4 py-16 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Novo roteiro</p>
          <h1 className="mt-4 text-4xl font-black text-slate-900">Comece a planejar sua viagem</h1>
          <p className="mt-3 text-slate-600">Salve as informações iniciais e depois monte os dias e atividades.</p>
        </div>
        {status ? <div className="mb-6 rounded-3xl bg-red-50 p-4 text-sm text-red-800">{status}</div> : null}
        <form className="card grid gap-6 p-8" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Título do roteiro<input name="titulo" value={form.titulo} onChange={updateField} className="input-field" placeholder="Ex.: Fim de semana em Lisboa" required /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Destino<input name="destino" value={form.destino} onChange={updateField} className="input-field" placeholder="Ex.: Lisboa, Portugal" required /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Descrição<textarea name="descricao" value={form.descricao} onChange={updateField} className="input-field" rows={4} placeholder="O que você quer viver nessa viagem?" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Orçamento geral (R$)<input name="orcamento" value={form.orcamento} onChange={updateField} className="input-field" type="number" min="0" step="0.01" placeholder="Opcional" /></label>
          <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><input name="publico" type="checkbox" checked={form.publico} onChange={updateField} className="h-5 w-5 rounded border-slate-300 text-[#2563EB]" />Tornar este roteiro público</label>
          <div className="flex flex-wrap gap-3"><button className="btn-primary disabled:opacity-60" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar roteiro'}</button><button className="btn-secondary" type="button" onClick={() => navigate('/roteiros')}>Cancelar</button></div>
        </form>
      </div>
    </main>
  )
}
