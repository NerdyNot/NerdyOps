import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      verifyToken(token)
    }
  }, [])

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/login`, {
        username,
        password,
      })

      const { token, user_id, role } = response.data
      localStorage.setItem('token', token)
      setUser({ user_id, role })
      router.push('/')
    } catch (err) {
      setError(err.response.data.error || 'An error occurred')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  const verifyToken = async (token) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/verify-token`, { token })
      setUser({ user_id: response.data.user_id, role: response.data.role })
    } catch (err) {
      setError(err.response.data.error || 'An error occurred')
    }
  }

  return (
    <AuthContext.Provider value={{ user, error, login, logout, verifyToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
