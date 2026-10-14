export default function Feedback({ status, onDismiss }) {
  if (!status) return null

  const normalizedStatus = typeof status === 'string' ? { type: 'success', message: status } : status
  const isError = normalizedStatus.type === 'error'

  return (
    <div className={`flex items-start justify-between gap-4 rounded-2xl border p-4 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`} role="status">
      <span>{normalizedStatus.message}</span>
      {onDismiss ? <button type="button" className="font-bold opacity-70 hover:opacity-100" aria-label="Fechar mensagem" onClick={onDismiss}>×</button> : null}
    </div>
  )
}