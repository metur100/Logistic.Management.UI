import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import type { AuthUser, Me } from '../lib/types'

interface AuthContextType {
  user: AuthUser | null
  login: (d: AuthUser) => void
  logout: () => void
  refresh: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function readStoredUser(): AuthUser | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  const companyId = localStorage.getItem('companyId')
  return {
    token,
    role: localStorage.getItem('role') ?? '',
    userId: Number(localStorage.getItem('userId') ?? 0),
    fullName: localStorage.getItem('fullName') ?? '',
    companyId: companyId ? Number(companyId) : null,
    companyName: localStorage.getItem('companyName'),
    email: localStorage.getItem('email'),
  }
}

function persist(user: AuthUser) {
  localStorage.setItem('token', user.token)
  localStorage.setItem('role', user.role)
  localStorage.setItem('userId', String(user.userId))
  localStorage.setItem('fullName', user.fullName)
  if (user.companyId != null) localStorage.setItem('companyId', String(user.companyId))
  if (user.companyName) localStorage.setItem('companyName', user.companyName)
  if (user.email) localStorage.setItem('email', user.email)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const applyMe = (stored: AuthUser, me: Me): AuthUser => ({
    ...stored,
    role: me.role,
    fullName: me.fullName,
    companyId: me.companyId ?? null,
    companyName: me.companyName ?? null,
    email: me.email ?? null,
  })

  const refresh = async () => {
    const stored = readStoredUser()
    if (!stored) return
    try {
      const { data } = await api.get<Me>('/auth/me')
      const next = applyMe(stored, data)
      persist(next)
      setUser(next)
    } catch {
      // The axios interceptor handles expired sessions. A temporary network
      // failure should not throw the user out of the app.
    }
  }

  useEffect(() => {
    let active = true
    const stored = readStoredUser()
    if (!stored) {
      setLoading(false)
      return
    }
    setUser(stored)
    api.get<Me>('/auth/me')
      .then(({ data }) => {
        if (!active) return
        const next = applyMe(stored, data)
        persist(next)
        setUser(next)
      })
      .catch(() => { /* keep cached session; 401 is handled globally */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const login = (d: AuthUser) => {
    persist(d)
    setUser(d)
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refresh, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
