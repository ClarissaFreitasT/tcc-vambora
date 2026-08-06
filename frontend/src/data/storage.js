const STORAGE_KEY = 'vambora_roteiros'

function parseStoredRoteiros() {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getStoredRoteiros() {
  return parseStoredRoteiros()
}

export function getStoredRoteiroById(id) {
  return getStoredRoteiros().find((roteiro) => roteiro.id === id) || null
}

export function saveStoredRoteiros(roteiros) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roteiros))
}

export function addStoredRoteiro(roteiro) {
  const next = [roteiro, ...getStoredRoteiros()]
  saveStoredRoteiros(next)
  return next
}

export function updateStoredRoteiro(id, changes) {
  const next = getStoredRoteiros().map((roteiro) => {
    if (roteiro.id !== id) return roteiro
    const updated = typeof changes === 'function' ? changes(roteiro) : changes
    return { ...roteiro, ...updated }
  })
  saveStoredRoteiros(next)
  return next.find((roteiro) => roteiro.id === id) || null
}

export function removeStoredRoteiro(id) {
  const next = getStoredRoteiros().filter((roteiro) => roteiro.id !== id)
  saveStoredRoteiros(next)
  return next
}
