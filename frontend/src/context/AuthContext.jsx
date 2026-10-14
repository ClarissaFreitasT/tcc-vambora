import { useEffect, useState } from 'react'
import { apiFetch } from '../data/api'
import { AuthContext } from './AuthContext'

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem('vambora_usuario') || 'null') } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('vambora_token')))

  function clearSession() {
    localStorage.removeItem('vambora_token')
    localStorage.removeItem('vambora_usuario')
    setUser(null)
  }

  useEffect(() => {
    async function restoreSession() {
      if (!localStorage.getItem('vambora_token')) {
        setLoading(false)
        return
      }
      try {
        const data = await apiFetch('/usuarios/me')
        localStorage.setItem('vambora_usuario', JSON.stringify(data))
        setUser(data)
      } catch {
        clearSession()
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    function handleUnauthorized() { clearSession() }
    window.addEventListener('vambora:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('vambora:unauthorized', handleUnauthorized)
  }, [])

  async function login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    localStorage.setItem('vambora_token', data.token)
    localStorage.setItem('vambora_usuario', JSON.stringify(data.usuario))
    setUser(data.usuario)
    return data.usuario
  }

  function logout() { clearSession() }

  async function updateUser(changes) {
    const data = await apiFetch('/usuarios/me', { method: 'PATCH', body: JSON.stringify(changes) })
    localStorage.setItem('vambora_usuario', JSON.stringify(data.usuario))
    setUser(data.usuario)
    return data.usuario
  }

  return <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, logout, updateUser }}>{children}</AuthContext.Provider>
}

