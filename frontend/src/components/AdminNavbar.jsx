import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBell,
  FaUser,
  FaSearch,
  FaCog,
  FaSignOutAlt,
  FaUserCircle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AdminNavbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();

  const notifications = [
    { id: 1, message: 'Nouvelle réservation de Sophie Martin', time: 'Il y a 5 min', unread: true },
    { id: 2, message: 'Rappel: Commande de vernis à passer', time: 'Il y a 1h', unread: true },
    { id: 3, message: 'Avis 5 étoiles de Marie Dubois', time: 'Il y a 2h', unread: false }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav 
      className="admin-navbar bg-white border-bottom shadow-sm py-2 px-3 d-none d-lg-block"
      style={{
        marginLeft: '70px', // ALWAYS 70px - never changes
        position: 'fixed',
        top: 0,
        right: 0,
        left: '70px', // ALWAYS 70px - never changes
        zIndex: 999,
        height: '60px'
      }}
    >
      <div className="d-flex align-items-center justify-content-between h-100">
        {/* Search */}
        <div className="navbar-search">
          <div className="input-group" style={{ width: '300px' }}>
            <span className="input-group-text bg-light border-end-0">
              <FaSearch className="text-muted" size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Rechercher..."
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="navbar-actions d-flex align-items-center gap-3">
          {/* Notifications */}
          <div className="position-relative">
            <motion.button
              className="btn btn-light position-relative"
              onClick={() => setShowNotifications(!showNotifications)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBell size={16} />
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: '10px' }}>
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <motion.div
                className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border"
                style={{ width: '320px', zIndex: 1000 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-3 border-bottom">
                  <h6 className="mb-0 fw-bold">Notifications</h6>
                  <small className="text-muted">{unreadCount} non lues</small>
                </div>
                <div className="notifications-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item p-3 border-bottom ${
                        notification.unread ? 'bg-light' : ''
                      }`}
                    >
                      <div className="d-flex align-items-start">
                        <div className="flex-grow-1">
                          <p className="mb-1 small">{notification.message}</p>
                          <small className="text-muted">{notification.time}</small>
                        </div>
                        {notification.unread && (
                          <div className="bg-primary rounded-circle" 
                               style={{ width: '8px', height: '8px' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 text-center border-top">
                  <button className="btn btn-sm btn-outline-primary">
                    Voir toutes les notifications
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Profile */}
          <div className="position-relative">
            <motion.button
              className="btn btn-light d-flex align-items-center gap-2"
              onClick={() => setShowProfile(!showProfile)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaUserCircle size={20} className="text-muted" />
              <span className="small fw-semibold d-none d-md-inline">
                {user?.nom || 'Admin'}
              </span>
            </motion.button>

            {/* Profile Dropdown */}
            {showProfile && (
              <motion.div
                className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border"
                style={{ width: '200px', zIndex: 1000 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-3 border-bottom text-center">
                  <FaUserCircle size={40} className="text-muted mb-2" />
                  <h6 className="mb-0 fw-bold">{user?.nom || 'Administrateur'}</h6>
                  <small className="text-muted">{user?.email || 'admin@salon.fr'}</small>
                </div>
                <div className="py-2">
                  <a href="#" className="dropdown-item d-flex align-items-center py-2 px-3">
                    <FaUser className="me-2" size={14} />
                    Mon profil
                  </a>
                  <a href="#" className="dropdown-item d-flex align-items-center py-2 px-3">
                    <FaCog className="me-2" size={14} />
                    Paramètres
                  </a>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="dropdown-item d-flex align-items-center py-2 px-3 text-danger"
                  >
                    <FaSignOutAlt className="me-2" size={14} />
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showProfile) && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 998 }}
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}

      <style>{`
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        .notification-item:hover {
          background-color: #f8f9fa !important;
        }

        @media (max-width: 991.98px) {
          .admin-navbar {
            margin-left: 0 !important;
            left: 0 !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }

        @media (max-width: 576px) {
          .navbar-search {
            display: none !important;
          }
          
          .admin-navbar .d-flex {
            justify-content: flex-end !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default AdminNavbar;
