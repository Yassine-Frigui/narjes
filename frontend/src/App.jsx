import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Import des pages admin - NBrow Studio (eyebrow services only)
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReservations from './pages/admin/AdminReservations'
import AdminClients from './pages/admin/AdminClients'
import AdminServices from './pages/admin/AdminServices'
import AdminStatistics from './pages/admin/AdminStatistics'

// Import des composants
import AdminLayout from './components/layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Import du contexte d'authentification
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

// Variants pour les animations de page
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <AnimatePresence mode='wait'>
              <Routes>
              {/* Redirect root to admin login */}
              <Route path="/" element={<Navigate to="/admin/login" replace />} />

              {/* Route de connexion admin */}
              <Route path="/admin/login" element={
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <AdminLogin />
                </motion.div>
              } />

              {/* Routes admin protégées */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AdminDashboard />
                  </motion.div>
                } />
                <Route path="reservations" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AdminReservations />
                  </motion.div>
                } />
                <Route path="clients" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AdminClients />
                  </motion.div>
                } />
                <Route path="services" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AdminServices />
                  </motion.div>
                } />
                <Route path="statistics" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AdminStatistics />
                  </motion.div>
                } />
              </Route>

              {/* Route 404 - redirect to admin login */}
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </AuthProvider>
    </LanguageProvider>
  )
}

export default App
