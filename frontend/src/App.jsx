import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Import des pages client
import HomePage from './pages/client/HomePage'
import AboutPage from './pages/client/AboutPage'
import ServicesPage from './pages/client/ServicesPage'
import ServiceDetailPage from './pages/client/ServiceDetailPage'
import BookingPage from './pages/client/BookingPage'
import ContactPage from './pages/client/ContactPage'
import ClientLogin from './pages/client/ClientLogin'
import ClientSignup from './pages/client/ClientSignup'
import ClientProfile from './pages/client/ClientProfile'
import ForgotPassword from './pages/client/ForgotPassword'
import ResetPassword from './pages/client/ResetPassword'

// Import des pages admin
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReservations from './pages/admin/AdminReservations'
import AdminClients from './pages/admin/AdminClients'
import AdminServices from './pages/admin/AdminServices'
import AdminInventaire from './pages/admin/AdminInventaire'
import AdminSettings from './pages/admin/AdminSettings'
import AdminStatistics from './pages/admin/AdminStatistics'

// Import des composants
import ClientLayout from './components/layouts/ClientLayout'
import AdminLayout from './components/layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ClientProtectedRoute from './components/ClientProtectedRoute'

// Import du contexte d'authentification
import { AuthProvider } from './context/AuthContext'
import { ClientAuthProvider } from './context/ClientAuthContext'
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
        <ClientAuthProvider>
        <Router>
          <div className="App">
            <AnimatePresence mode='wait'>
              <Routes>
              {/* Routes publiques client */}
              <Route path="/" element={<ClientLayout />}>
                <Route index element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <HomePage />
                  </motion.div>
                } />
                <Route path="about" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AboutPage />
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
                    <ServicesPage />
                  </motion.div>
                } />
                <Route path="booking" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <BookingPage />
                  </motion.div>
                } />
                <Route path="contact" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ContactPage />
                  </motion.div>
                } />
                <Route path="services/:id" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ServiceDetailPage />
                  </motion.div>
                } />

                {/* Routes d'authentification client dans le layout */}
                <Route path="client/login" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ClientLogin />
                  </motion.div>
                } />
                
                <Route path="client/signup" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ClientSignup />
                  </motion.div>
                } />

                <Route path="client/forgot-password" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ForgotPassword />
                  </motion.div>
                } />

                <Route path="client/reset-password" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ResetPassword />
                  </motion.div>
                } />

                {/* Route client protégée - Profile */}
                <Route path="/profile" element={
                  <ClientProtectedRoute>
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <ClientProfile />
                    </motion.div>
                  </ClientProtectedRoute>
                } />
              </Route>

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
                <Route path="inventaire" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AdminInventaire />
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
                <Route path="settings" element={
                  <motion.div
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AdminSettings />
                  </motion.div>
                } />
              </Route>

              {/* Route 404 */}
              <Route path="*" element={
                <motion.div
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="container text-center py-5"
                >
                  <h1 className="text-pink">404 - Page not found</h1>
                  <p>The page you are looking for does not exist.</p>
                  <a href="/" className="btn btn-pink">
                    Back to Home
                  </a>
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
      </ClientAuthProvider>
    </AuthProvider>
    </LanguageProvider>
  )
}

export default App
