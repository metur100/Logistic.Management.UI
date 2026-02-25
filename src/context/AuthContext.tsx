import { createContext, useContext, useState, useEffect } from 'react'

interface AuthUser {
  token: string
  role: string
  userId: number
  fullName: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (d: AuthUser) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) setUser({
      token,
      role: localStorage.getItem('role') ?? '',
      userId: Number(localStorage.getItem('userId')),
      fullName: localStorage.getItem('fullName') ?? ''
    })
    setLoading(false)
  }, [])

  const login = (d: AuthUser) => {
    localStorage.setItem('token', d.token)
    localStorage.setItem('role', d.role)
    localStorage.setItem('userId', String(d.userId))
    localStorage.setItem('fullName', d.fullName)
    setUser(d)
  }

  const logout = () => { localStorage.clear(); setUser(null) }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
