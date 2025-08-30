import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendarCheck, 
  FaUsers, 
  FaMoneyBill, 
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaPhoneAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaChartLine
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';


const AdminDashboard = () => {
  const [stats, setStats] = useState({
    reservationsAujourdhui: 0,
    clientsTotal: 0,
    chiffreAffaireMois: 0,
    noteMoyenne: 0
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats from backend
      const response = await adminAPI.getDashboard();
      const data = response.data;
      
      setStats({
        reservationsAujourdhui: data.rdv_aujourd_hui || 0,
        clientsTotal: data.total_clients || 0,
        chiffreAffaireMois: data.ca_mois || 0,
        noteMoyenne: data.note_moyenne || 0
      });

      // Transform recent reservations data
      const transformedReservations = (data.prochaines_reservations || []).map(res => ({
        id: res.id,
        client: res.client_nom,
        service: res.service_nom,
        heure: res.heure_debut,
        statut: res.statut,
        telephone: res.client_telephone
      }));
      
      setRecentReservations(transformedReservations);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      // Fallback to empty state
      setStats({
        reservationsAujourdhui: 0,
        clientsTotal: 0,
        chiffreAffaireMois: 0,
        noteMoyenne: 0
      });
      setRecentReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Rendez-vous aujourd\'hui',
      value: stats.reservationsAujourdhui,
      icon: <FaCalendarCheck className="text-primary" />,
      color: 'primary',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Clientes totales',
      value: stats.clientsTotal,
      icon: <FaUsers className="text-success" />,
      color: 'success',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'CA ce mois',
      value: `${stats.chiffreAffaireMois}DT`,
      icon: <FaMoneyBill className="text-warning" />,
      color: 'warning',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Note moyenne',
      value: `${stats.noteMoyenne}/5`,
      icon: <FaStar className="text-pink-500" />,
      color: 'pink',
      change: '+0.2',
      trend: 'up'
    }
  ];

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'confirmé':
        return <span className="badge bg-success">Confirmé</span>;
      case 'en_attente':
        return <span className="badge bg-warning">En attente</span>;
      case 'annulé':
        return <span className="badge bg-danger">Annulé</span>;
      default:
        return <span className="badge bg-secondary">Inconnu</span>;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-pink-500 mb-3" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <motion.div
        className="dashboard-header mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="row align-items-center">
          <div className="col">
            <h1 className="h3 fw-bold text-dark mb-1">Tableau de bord</h1>
            <p className="text-muted mb-0">
              Aperçu de votre salon - {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="col-auto">
            <div className="d-flex gap-2">
              <motion.button
                className="btn btn-outline-pink"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchDashboardData}
              >
                <FaChartLine className="me-2" />
                Actualiser
              </motion.button>
              <motion.button
                className="btn btn-pink"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaCalendarAlt className="me-2" />
                Nouvelle réservation
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="row mb-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={index}
            className="col-lg-3 col-md-6 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <div className="card border-0 shadow-sm h-100 hover-lift">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className={`icon-circle bg-${stat.color}-100 d-flex align-items-center justify-content-center`}
                       style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                    {stat.icon}
                  </div>
                  <div className={`d-flex align-items-center text-${stat.trend === 'up' ? 'success' : 'danger'} small`}>
                    {stat.trend === 'up' ? <FaArrowUp className="me-1" /> : <FaArrowDown className="me-1" />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="fw-bold mb-1">{stat.value}</h3>
                <p className="text-muted small mb-0">{stat.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="row">
        {/* Rendez-vous du jour */}
        <div className="col-lg-8 mb-4">
          <motion.div
            className="card border-0 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="fw-bold mb-0">
                  <FaCalendarCheck className="text-primary me-2" />
                  Rendez-vous d'aujourd'hui
                </h5>
                <span className="badge bg-primary">{recentReservations.length} rendez-vous</span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Cliente</th>
                      <th className="border-0 py-3">Service</th>
                      <th className="border-0 py-3">Heure</th>
                      <th className="border-0 py-3">Statut</th>
                      <th className="border-0 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReservations.map((reservation, index) => (
                      <motion.tr
                        key={reservation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                        className="border-bottom"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <strong className="text-dark">{reservation.client}</strong>
                            <div className="small text-muted">{reservation.telephone}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-dark">{reservation.service}</span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <FaClock className="text-muted me-2" size={14} />
                            <span className="fw-semibold">{reservation.heure}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          {getStatusBadge(reservation.statut)}
                        </td>
                        <td className="py-3">
                          <div className="d-flex gap-1">
                            <motion.button
                              className="btn btn-sm btn-outline-success"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Appeler"
                            >
                              <FaPhoneAlt size={12} />
                            </motion.button>
                            <motion.button
                              className="btn btn-sm btn-outline-primary"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Email"
                            >
                              <FaEnvelope size={12} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer bg-white border-0 text-center py-3">
              <motion.a
                href="/admin/reservations"
                className="text-primary text-decoration-none fw-semibold"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                Voir toutes les réservations →
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Activité récente */}
        <div className="col-lg-4 mb-4">
          <motion.div
            className="card border-0 shadow-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">
                <FaChartLine className="text-success me-2" />
                Activité récente
              </h5>
            </div>
            <div className="card-body">
              <div className="activity-list">
                {[
                  { action: 'Nouvelle réservation', client: 'Sophie Martin', time: 'Il y a 5 min', type: 'reservation' },
                  { action: 'Paiement reçu', client: 'Marie Dubois', time: 'Il y a 12 min', type: 'payment' },
                  { action: 'Réservation confirmée', client: 'Emma Laurent', time: 'Il y a 23 min', type: 'confirmation' },
                  { action: 'Nouvel avis', client: 'Lisa Chen', time: 'Il y a 1h', type: 'review' }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className="activity-item d-flex align-items-start mb-3 pb-3 border-bottom"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                  >
                    <div className={`activity-icon me-3 rounded-circle d-flex align-items-center justify-content-center ${
                      activity.type === 'reservation' ? 'bg-primary-100 text-primary' :
                      activity.type === 'payment' ? 'bg-success-100 text-success' :
                      activity.type === 'confirmation' ? 'bg-warning-100 text-warning' :
                      'bg-pink-100 text-pink-500'
                    }`} style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                      {activity.type === 'reservation' && <FaCalendarAlt size={12} />}
                      {activity.type === 'payment' && <FaMoneyBill size={12} />}
                      {activity.type === 'confirmation' && <FaCalendarCheck size={12} />}
                      {activity.type === 'review' && <FaStar size={12} />}
                    </div>
                    <div className="activity-content flex-grow-1">
                      <p className="mb-1 small fw-semibold text-dark">{activity.action}</p>
                      <p className="mb-1 small text-muted">{activity.client}</p>
                      <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Actions rapides</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {[
                  { title: 'Nouvelle réservation', desc: 'Créer un nouveau rendez-vous', icon: <FaCalendarAlt />, color: 'primary', link: '/admin/reservations' },
                  { title: 'Ajouter un service', desc: 'Créer un nouveau service', icon: <FaStar />, color: 'success', link: '/admin/services' },
                  { title: 'Gérer l\'inventaire', desc: 'Mettre à jour le stock', icon: <FaChartLine />, color: 'warning', link: '/admin/inventaire' },
                  { title: 'Voir les clientes', desc: 'Consulter la base clients', icon: <FaUsers />, color: 'info', link: '/admin/clients' }
                ].map((action, index) => (
                  <div key={index} className="col-lg-3 col-md-6 mb-3">
                    <motion.a
                      href={action.link}
                      className="text-decoration-none"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`card border-${action.color} h-100 hover-border-${action.color}`}>
                        <div className="card-body text-center p-3">
                          <div className={`text-${action.color} mb-2`} style={{ fontSize: '2rem' }}>
                            {action.icon}
                          </div>
                          <h6 className="fw-bold mb-1">{action.title}</h6>
                          <p className="small text-muted mb-0">{action.desc}</p>
                        </div>
                      </div>
                    </motion.a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
