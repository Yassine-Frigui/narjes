import axios from 'axios'
import i18n from '../i18n'

// Configuration de base d'axios
// Use the backend URL directly in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = true

// Add ngrok warning bypass header
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'

// Fonction pour obtenir la langue actuelle
const getCurrentLanguage = () => {
  return i18n.language || 'fr';
};

// Initialiser l'authorization header si un token existe
const initializeAuth = () => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Appeler l'initialisation
initializeAuth();

// Services pour les API publiques
export const publicAPI = {
  // Services
  getServices: (params = {}) => {
    const lang = getCurrentLanguage();
    // Set a high limit to get all services by default
    const defaultParams = { limit: 100, ...params };
    return axios.get('/api/public/services', { params: { ...defaultParams, lang } });
  },
  
  // Booking specific - get services and categories for booking page
  getBookingData: () => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/booking', { params: { lang } });
  },
  getServiceById: (id) => {
    const lang = getCurrentLanguage();
    return axios.get(`/api/public/services/${id}`, { params: { lang } });
  },
  getServicesByCategory: (categoryId) => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services', { params: { category: categoryId, lang } });
  },
  getServicesGrouped: () => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services', { params: { lang } });
  },
  getPopularServices: (limit = 4) => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services/featured/list', { params: { limit, lang } });
  },
  getNewServices: (limit = 4) => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services', { params: { limit, lang } });
  },
  getAddOnServices: () => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services', { params: { service_type: 'addon', lang } });
  },

  // Catégories
  getCategories: () => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services/categories/list', { params: { lang } });
  },

  // Abonnements
  getMemberships: () => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services/memberships/list', { params: { lang } });
  },

  // Spa Info
  getSpaInfo: () => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services/settings/salon', { params: { lang } });
  },
  getHoraires: () => axios.get('/api/public/horaires'),
  getFermetures: (date) => axios.get(`/api/public/fermetures/${date}`),

  // Avis
  getAvis: (page = 1, limit = 10) => axios.get(`/api/public/avis?page=${page}&limit=${limit}`),

  // Promotions
  getPromotions: () => {
    const lang = getCurrentLanguage();
    return axios.get('/api/public/services/promotions/list', { params: { lang } });
  },

  // Réservations (côté client)
  createReservation: (data) => axios.post('/api/reservations', data),
  getReservation: (id) => axios.get(`/api/reservations/${id}`),
  checkAvailability: (data) => axios.post('/api/reservations/check-availability', data),
  getAvailableSlots: (date, serviceId) => axios.get(`/api/reservations/available-slots/${date}/${serviceId}`),
  cancelReservation: (id, email) => axios.put(`/api/reservations/${id}/cancel`, { email }),

  // Vérification de réservation
  sendReservationVerification: (reservationId) => axios.post(`/api/reservations/${reservationId}/send-verification`),
  verifyReservationCode: (reservationId, code) => axios.post(`/api/reservations/${reservationId}/verify-code`, { code }),
  verifyReservationLink: (token) => axios.get(`/api/reservations/verify-link/${token}`),

  // Brouillons de réservation (auto-save)
  saveDraft: (data) => axios.post('/api/reservations/save-draft', data),
  getDraft: (sessionId) => axios.get(`/api/reservations/get-draft/${sessionId}`),
  deleteDraft: (sessionId) => axios.delete(`/api/reservations/delete-draft/${sessionId}`)
}

// Services pour les API client (authentification côté client)
export const clientAPI = {
  // Authentication
  login: (credentials) => axios.post('/api/client/login', credentials),
  register: (userData) => axios.post('/api/client/register', userData),
  logout: () => axios.post('/api/client/logout'),
  checkAuth: () => axios.get('/api/client/check'),
  verifyEmail: (token) => axios.post('/api/client/verify-email', { token }),
  
  // Password Reset
  forgotPassword: (email) => axios.post('/api/client/forgot-password', { email }),
  verifyResetCode: (email, code) => axios.post('/api/client/verify-reset-code', { email, code }),
  resetPassword: (token, newPassword) => axios.post('/api/client/reset-password', { token, newPassword }),
  verifyResetToken: (token) => axios.get(`/api/client/verify-reset-token/${token}`),
  
  // Profile
  getProfile: () => axios.get('/api/client/profile'),
  updateProfile: (data) => axios.put('/api/client/profile', data),
  changePassword: (data) => axios.put('/api/client/change-password', data),

  // Reservations (client authentifié)
  getMyReservations: (page = 1, limit = 10) => 
    axios.get(`/api/client/reservations?page=${page}&limit=${limit}`),
  getMyReservation: (id) => axios.get(`/api/client/reservations/${id}`),
  updateMyReservation: (id, data) => axios.put(`/api/client/reservations/${id}`, data),
  cancelMyReservation: (id) => axios.put(`/api/client/reservations/${id}/cancel`),
}

// Services pour les API admin
export const adminAPI = {
  // Authentication
  login: (credentials) => axios.post('/api/auth/login', credentials),
  logout: () => axios.post('/api/auth/logout'),
  refreshToken: () => axios.post('/api/auth/refresh'),
  getMe: () => axios.get('/api/auth/me'),

  // Dashboard
  getDashboard: () => axios.get('/api/admin/dashboard'),
  getStats: (dateDebut, dateFin) => axios.get(`/api/admin/stats?date_debut=${dateDebut}&date_fin=${dateFin}`),

  // Réservations
  getReservations: (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return axios.get(`/api/admin/reservations?${params}`)
  },
  updateReservationStatus: (id, statut, notes) => 
    axios.patch(`/api/admin/reservations/${id}/statut`, { statut, notes_admin: notes }),
  createReservation: (data) => axios.post('/api/admin/reservations', data),
  createReservationWithClient: (data) => axios.post('/api/admin/reservations/create-with-client', data),
  convertDraftReservation: (id) => axios.post(`/api/admin/reservations/convert-draft/${id}`),
  updateReservation: (id, data) => axios.put(`/api/admin/reservations/${id}`, data),
  deleteReservation: (id) => axios.delete(`/api/admin/reservations/${id}`),

  // Clients
  getClients: (page = 1, limit = 20, search = '') => 
    axios.get(`/api/clients?page=${page}&limit=${limit}&search=${search}`),
  getClient: (id) => axios.get(`/api/clients/${id}`),
  getClientReservations: (id, limit = 10) => axios.get(`/api/clients/${id}/reservations?limit=${limit}`),
  createClient: (data) => axios.post('/api/clients', data),
  updateClient: (id, data) => axios.put(`/api/clients/${id}`, data),
  deleteClient: (id) => axios.delete(`/api/clients/${id}`),
  searchClients: (term, limit = 10) => axios.get(`/api/clients/search/${term}?limit=${limit}`),

  // Services
  getServicesAdmin: () => axios.get('/api/services'),
  getService: (id) => axios.get(`/api/services/${id}`),
  getServiceWithTranslations: (id) => axios.get(`/api/services/${id}/translations`),
  createService: (data) => axios.post('/api/services', data),
  createServiceWithTranslations: (data) => axios.post('/api/services/with-translations', data),
  updateService: (id, data) => axios.put(`/api/services/${id}`, data),
  updateServiceWithTranslations: (id, data) => axios.put(`/api/services/${id}/with-translations`, data),
  deleteService: (id) => axios.delete(`/api/services/${id}`),
  getCategories: () => axios.get('/api/services/categories'),

  // Inventaire
  getInventaire: (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters }).toString()
    return axios.get(`/api/inventaire?${params}`)
  },
  getProduct: (id) => axios.get(`/api/inventaire/${id}`),
  createProduct: (data) => axios.post('/api/inventaire', data),
  updateProduct: (id, data) => axios.put(`/api/inventaire/${id}`, data),
  adjustStock: (id, quantite, type_mouvement, notes) => 
    axios.patch(`/api/inventaire/${id}/quantite`, { quantite, type_mouvement, notes }),
  deleteProduct: (id) => axios.delete(`/api/inventaire/${id}`),
  getStockAlerts: () => axios.get('/api/inventaire/alertes/stock'),
  getInventaireStats: () => axios.get('/api/inventaire/stats/general'),

  // Statistiques
  getStatistics: (dateRange = 'month') => axios.get(`/api/admin/statistics?range=${dateRange}`),
  getDraftPerformance: (period = '30') => axios.get(`/api/admin/statistics/draft-performance?period=${period}`),

  // Paramètres spa
  getSalonParams: () => axios.get('/api/admin/salon/parametres'),
  updateSalonParams: (data) => axios.put('/api/admin/salon/parametres', data),

  // Utilisateurs admin
  getAdministrateurs: () => axios.get('/api/admin/utilisateurs'),
  createAdministrateur: (data) => axios.post('/api/admin/utilisateurs', data),
  updateAdministrateur: (id, data) => axios.put(`/api/admin/utilisateurs/${id}`, data),
  toggleAdminStatus: (id) => axios.patch(`/api/admin/utilisateurs/${id}/toggle`),
  deleteAdministrateur: (id) => axios.delete(`/api/admin/utilisateurs/${id}`)
}

// Intercepteur pour gérer les erreurs d'authentification
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't attempt refresh for the refresh endpoint itself
    if (originalRequest.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }
    
    // Only attempt refresh for admin routes and if we have a token
    const hasAdminToken = localStorage.getItem('adminToken');
    const isAdminRoute = originalRequest.url?.includes('/api/admin') || 
                        originalRequest.url?.includes('/api/auth') ||
                        originalRequest.url?.includes('/api/services') ||
                        originalRequest.url?.includes('/api/clients') ||
                        originalRequest.url?.includes('/api/inventaire');
    
    if (error.response?.status === 401 && !originalRequest._retry && hasAdminToken && isAdminRoute) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Tentative de rafraîchissement du token
        const refreshResponse = await axios.post('/api/auth/refresh');
        const newToken = refreshResponse.data.token;
        
        // Mettre à jour le token dans localStorage et les headers
        localStorage.setItem('adminToken', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Relancer la requête originale avec le nouveau token
        return axios(originalRequest);
      } catch (refreshError) {
        // Le refresh a échoué, nettoyer et rediriger
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
        
        // Rediriger vers la page de connexion si on est dans l'admin
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status === 401 && hasAdminToken && isAdminRoute) {
      // Token expiré et retry déjà tentée, nettoyer
      localStorage.removeItem('adminToken');
      delete axios.defaults.headers.common['Authorization'];
      
      // Rediriger vers la page de connexion si on est dans l'admin
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default { publicAPI, clientAPI, adminAPI }
