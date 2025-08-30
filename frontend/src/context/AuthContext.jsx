import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Détecter l'activité de l'utilisateur
  useEffect(() => {
    const updateLastActivity = () => {
      setLastActivity(Date.now())
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActivity, true)
      })
    }
  }, [])

  // Configuration d'axios avec le token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth()
  }, [])

  // Rafraîchir le token périodiquement (toutes les 20 minutes) seulement si l'utilisateur est actif
  useEffect(() => {
    if (token && admin) {
      const refreshTokenSilently = async () => {
        // Ne rafraîchir que si l'utilisateur a été actif dans les dernières 5 minutes
        const timeSinceActivity = Date.now() - lastActivity
        if (timeSinceActivity < 5 * 60 * 1000) { // 5 minutes
          try {
            const response = await axios.post('/api/auth/refresh')
            const newToken = response.data.token
            
            setToken(newToken)
            localStorage.setItem('adminToken', newToken)
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            
            console.log('Token rafraîchi automatiquement')
          } catch (error) {
            console.error('Silent token refresh failed:', error)
            // Don't logout on silent refresh failure, let normal requests handle it
          }
        }
      }

      const interval = setInterval(refreshTokenSilently, 20 * 60 * 1000) // 20 minutes

      return () => clearInterval(interval)
    }
  }, [token, admin, lastActivity])

  const checkAuth = async () => {
    try {
      if (token) {
        const response = await axios.get('/api/auth/me')
        setAdmin(response.data.admin)
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      })

      const { admin: adminData, token: authToken } = response.data

      setAdmin(adminData)
      setToken(authToken)
      localStorage.setItem('adminToken', authToken)

      return { success: true, admin: adminData }
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de connexion'
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      setAdmin(null)
      setToken(null)
      localStorage.removeItem('adminToken')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh')
      const newToken = response.data.token
      
      setToken(newToken)
      localStorage.setItem('adminToken', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      return { success: true, token: newToken }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error)
      logout()
      return { success: false, message: 'Token refresh failed' }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe'
      return { success: false, message }
    }
  }

  const value = {
    admin,
    token,
    loading,
    login,
    logout,
    refreshToken,
    changePassword,
    isAuthenticated: !!admin,
    lastActivity
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
