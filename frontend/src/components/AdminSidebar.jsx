import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTachometerAlt,
  FaCalendarAlt,
  FaUsers,
  FaCut,
  FaBoxes,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaChartLine
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // Make sure this starts as false
  const location = useLocation();
  const { user, logout } = useAuth();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setMobileOpen(false); // Close mobile sidebar when switching to desktop
        setExpanded(false); // Reset expanded state
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Also check on mount
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      path: '/admin',
      icon: <FaTachometerAlt />,
      label: 'Tableau de bord',
      exact: true
    },
    {
      path: '/admin/reservations',
      icon: <FaCalendarAlt />,
      label: 'Réservations'
    },
    {
      path: '/admin/clients',
      icon: <FaUsers />,
      label: 'Clients'
    },
    {
      path: '/admin/services',
      icon: <FaCut />,
      label: 'Services'
    },
    {
      path: '/admin/inventaire',
      icon: <FaBoxes />,
      label: 'Inventaire'
    },
    {
      path: '/admin/statistics',
      icon: <FaChartLine />,
      label: 'Statistiques'
    },
    {
      path: '/admin/settings',
      icon: <FaCog />,
      label: 'Paramètres'
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Overlay when expanded - click to close */}
      {expanded && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1035 }}
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`admin-sidebar bg-white shadow-lg d-flex flex-column ${
          expanded ? 'expanded' : ''
        }`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: expanded ? 1036 : 1000, // Higher z-index when expanded to overlay
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header */}
        <div className="sidebar-header p-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm btn-outline-secondary p-1 me-2"
              onClick={() => setExpanded(!expanded)}
              style={{ width: '32px', height: '32px' }}
            >
              <FaBars size={12} />
            </button>
            {expanded && (
              <div>
                <h6 className="mb-0 fw-bold text-primary">Admin Panel</h6>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-grow-1 py-3">
          <ul className="list-unstyled mb-0">
            {menuItems.map((item, index) => (
              <li key={index} className="mb-1">
                <Link
                  to={item.path}
                  className={`sidebar-link d-flex align-items-center px-3 py-3 text-decoration-none position-relative ${
                    isActive(item.path, item.exact)
                      ? 'active bg-primary text-white'
                      : 'text-muted hover-bg-light'
                  }`}
                  title={!expanded ? item.label : ''}
                  onClick={() => setExpanded(false)}
                >
                  <div className="sidebar-icon d-flex align-items-center justify-content-center">
                    {item.icon}
                  </div>
                  {expanded && (
                    <span className="sidebar-text ms-3">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer p-3 border-top">
          <button
            onClick={handleLogout}
            className={`btn btn-outline-danger d-flex align-items-center justify-content-center ${
              expanded ? 'w-100' : 'p-2'
            }`}
            title={!expanded ? 'Déconnexion' : ''}
          >
            <FaSignOutAlt size={16} />
            {expanded && <span className="ms-2">Déconnexion</span>}
          </button>
        </div>
      </div>

      <style>{`
        .admin-sidebar {
          border-right: 1px solid #e9ecef;
          width: 70px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        
        .admin-sidebar.expanded {
          width: 260px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important; /* Enhanced shadow when expanded */
        }
        
        .sidebar-icon {
          width: 24px;
          height: 24px;
          font-size: 16px;
          flex-shrink: 0;
        }

        .sidebar-link {
          border-radius: 8px;
          margin: 0 8px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .sidebar-link:hover {
          background-color: #f8f9fa !important;
          color: #0d6efd !important;
          transform: translateX(2px);
        }

        .sidebar-link.active {
          background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
};

export default AdminSidebar;
