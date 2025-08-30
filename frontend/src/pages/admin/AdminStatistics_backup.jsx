import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartLine,
  FaCalendarAlt,
  FaUsers,
  FaCut,
  FaEuroSign,
  FaPercent,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaHeart,
  FaStar,
  FaChartBar,
  FaChartPie,
  FaUserClock,
  FaCalendarCheck,
  FaArrowUp,
  FaArrowDown,
  FaBusinessTime,
  FaHistory,
  FaMoneyBillWave,
  FaUserPlus,
  FaUserCheck,
  FaCog,
  FaSync,
  FaDownload,
  FaEdit
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminStatistics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState({
    overview: {
      totalReservations: 0,
      totalClients: 0,
      totalRevenue: 0,
      avgSpendPerClient: 0,
      bookingGrowth: 0,
      revenueGrowth: 0
    },
    reservationMetrics: {
      peakHours: [],
      cancellationStats: []
    },
    revenueMetrics: {
      totalRevenue: 0,
      avgSpendPerClient: 0,
      revenueByService: []
    },
    clientManagement: {
      newVsReturning: { newClients: 0, returningClients: 0 },
      retentionRates: [],
      vipClients: []
    },
    serviceInsights: {
      popularServices: [],
      seasonalTrends: [],
      serviceCombinations: []
    },
    clientInsights: {
      bookingBehavior: {
        avgLeadTime: 0,
        sameDayBookings: 0,
        weekAdvanceBookings: 0,
        longAdvanceBookings: 0
      }
    },
    spaUtilization: {
      utilizationHeatmap: []
    },
    financialInsights: {
      clientLifetimeValue: {
        avgCLV: 0,
        avgVisitsPerClient: 0,
        avgClientLifespan: 0
      }
    },
    // Legacy data for compatibility
    reservations: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0
    },
    services: {
      mostPopular: [],
      revenue: []
    },
    trends: {
      reservationsGrowth: 0,
      revenueGrowth: 0,
      clientsGrowth: 0
    }
  });

  const [draftPerformance, setDraftPerformance] = useState({
    overview: {
      totalDraftsCreated: 0,
      draftsConverted: 0,
      directBookings: 0,
      conversionRate: 0,
      revenueFromConversions: 0,
      revenueFromDirect: 0,
      avgConvertedValue: 0,
      avgDirectValue: 0
    },
    statusBreakdown: [],
    dailyPerformance: [],
    insights: {
      conversionEffectiveness: 'needs_improvement',
      revenueComparison: 'direct_higher'
    }
  });

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch both regular statistics and draft performance
      const [statsResponse, draftResponse] = await Promise.all([
        adminAPI.getStatistics(dateRange),
        adminAPI.getDraftPerformance(dateRange === 'week' ? '7' : dateRange === 'month' ? '30' : '90')
      ]);
      
      if (statsResponse.data.success) {
        console.log('📊 Main Statistics Data:', statsResponse.data.data);
        setStats(statsResponse.data.data);
      } else {
        console.error('Error in statistics response:', statsResponse.data.message);
      }
      
      if (draftResponse.data.success) {
        console.log('🎯 Draft Performance Data:', draftResponse.data.data);
        
        // Generate insights from the data
        const data = draftResponse.data.data;
        const conversionRate = parseFloat(data.overview?.conversionRate || 0);
        const avgConvertedValue = data.overview?.avgConvertedValue || 0;
        const avgDirectValue = data.overview?.avgDirectValue || 0;
        
        const insights = {
          conversionEffectiveness: conversionRate >= 20 ? 'excellent' : conversionRate >= 10 ? 'good' : 'needs_improvement',
          revenueComparison: avgConvertedValue > avgDirectValue ? 'converted_higher' : 'direct_higher'
        };
        
        setDraftPerformance({
          ...data,
          insights: insights
        });
      } else {
        console.error('Error in draft performance response:', draftResponse.data.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <motion.div
      className="card border-0 shadow-sm h-100"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h6 className="text-muted mb-1">{title}</h6>
            <h3 className="fw-bold mb-0">{value}</h3>
            {trend && (
              <div className={`small mt-1 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                {trend === 'up' ? <p className="me-1" /> : <p className="me-1" />}
                {trendValue}%
              </div>
            )}
          </div>
          <div className={`rounded-circle p-3 ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="admin-statistics">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-statistics">
      {/* Header */}
      <motion.div
        className="page-header mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="row align-items-center">
          <div className="col">
            <h1 className="h3 fw-bold text-dark mb-1">
              <FaChartLine className="text-primary me-2" />
              Statistiques
            </h1>
            <p className="text-muted mb-0">
              Analysez les performances de votre spa
            </p>
          </div>
          <div className="col-auto">
            <select 
              className="form-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Financial Overview */}
      <div className="row">
        <div className="col-12 mb-4">
          <motion.div
            className="card border-0 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaMoneyBillWave className="text-success me-2" />
                Aperçu Financier Détaillé
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Revenue Completed */}
                <div className="col-md-3 mb-3">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <FaCheckCircle className="text-success mb-2" size={32} />
                    <div className="h4 fw-bold text-success">
                      {stats.financialOverview?.revenueCompleted?.toFixed(0) || 0} DT
                    </div>
                    <div className="small text-muted">Revenus Réalisés</div>
                    <div className="small text-success">
                      {stats.financialOverview?.bookingsCompleted || 0} services terminés
                    </div>
                  </div>
                </div>

                {/* Revenue Potential */}
                <div className="col-md-3 mb-3">
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <FaClock className="text-primary mb-2" size={32} />
                    <div className="h4 fw-bold text-primary">
                      {stats.financialOverview?.revenuePotential?.toFixed(0) || 0} DT
                    </div>
                    <div className="small text-muted">Revenus Attendus</div>
                    <div className="small text-primary">
                      {stats.financialOverview?.bookingsConfirmed || 0} réservations confirmées
                    </div>
                  </div>
                </div>

                {/* Revenue Lost */}
                <div className="col-md-3 mb-3">
                  <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                    <FaTimesCircle className="text-danger mb-2" size={32} />
                    <div className="h4 fw-bold text-danger">
                      {stats.financialOverview?.revenueLost?.toFixed(0) || 0} DT
                    </div>
                    <div className="small text-muted">Revenus Perdus</div>
                    <div className="small text-danger">
                      {stats.financialOverview?.bookingsLost || 0} annulations/absences
                    </div>
                  </div>
                </div>

                {/* Total Potential */}
                <div className="col-md-3 mb-3">
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <FaTrophy className="text-warning mb-2" size={32} />
                    <div className="h4 fw-bold text-warning">
                      {stats.financialOverview?.totalPotentialRevenue?.toFixed(0) || 0} DT
                    </div>
                    <div className="small text-muted">Potentiel Total</div>
                    <div className="small text-warning">
                      {((stats.financialOverview?.revenueCompleted || 0) / 
                        (stats.financialOverview?.totalPotentialRevenue || 1) * 100).toFixed(1)}% réalisé
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Performance Bar */}
              <div className="mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="small fw-bold">Performance Financière</span>
                  <span className="small text-muted">
                    {((stats.financialOverview?.revenueCompleted || 0) / 
                      (stats.financialOverview?.totalPotentialRevenue || 1) * 100).toFixed(1)}% du potentiel
                  </span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ 
                      width: `${(stats.financialOverview?.revenueCompleted || 0) / 
                               (stats.financialOverview?.totalPotentialRevenue || 1) * 100}%` 
                    }}
                  ></div>
                  <div 
                    className="progress-bar bg-primary" 
                    style={{ 
                      width: `${(stats.financialOverview?.revenuePotential || 0) / 
                               (stats.financialOverview?.totalPotentialRevenue || 1) * 100}%` 
                    }}
                  ></div>
                  <div 
                    className="progress-bar bg-danger" 
                    style={{ 
                      width: `${(stats.financialOverview?.revenueLost || 0) / 
                               (stats.financialOverview?.totalPotentialRevenue || 1) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between mt-2 small">
                  <span className="text-success">Réalisé</span>
                  <span className="text-primary">En attente</span>
                  <span className="text-danger">Perdu</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Admin Impact & Draft System Performance */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <motion.div
            className="card border-0 shadow-sm h-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaUserCheck className="text-primary me-2" />
                Impact des Interventions Admin
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6 mb-3">
                  <div className="text-center">
                    <div className="h4 fw-bold text-primary">
                      {stats.adminImpact?.totalInterventions || 0}
                    </div>
                    <div className="small text-muted">Interventions</div>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="text-center">
                    <div className="h4 fw-bold text-success">
                      {stats.adminImpact?.adminSuccessRate || 0}%
                    </div>
                    <div className="small text-muted">Taux de succès</div>
                  </div>
                </div>
                <div className="col-12 mb-3">
                  <div className="text-center p-2 bg-success bg-opacity-10 rounded">
                    <div className="fw-bold text-success">
                      {stats.adminImpact?.revenueRescuedByAdmin?.toFixed(0) || 0} DT
                    </div>
                    <div className="small text-muted">Revenus sauvés par intervention</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="small text-center">
                    <div className="fw-bold text-success">{stats.adminImpact?.successfulCompletions || 0}</div>
                    <div className="text-muted">Succès</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="small text-center">
                    <div className="fw-bold text-danger">{stats.adminImpact?.failedConversions || 0}</div>
                    <div className="text-muted">Échecs</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="col-md-6 mb-4">
          <motion.div
            className="card border-0 shadow-sm h-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaUserPlus className="text-info me-2" />
                Performance du Système de Brouillons
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6 mb-3">
                  <div className="text-center">
                    <div className="h4 fw-bold text-info">
                      {stats.draftSystemPerformance?.totalDraftsCreated || 0}
                    </div>
                    <div className="small text-muted">Brouillons créés</div>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="text-center">
                    <div className="h4 fw-bold text-success">
                      {stats.draftSystemPerformance?.conversionRate?.toFixed(1) || 0}%
                    </div>
                    <div className="small text-muted">Taux de conversion</div>
                  </div>
                </div>
                <div className="col-12 mb-3">
                  <div className="text-center p-2 bg-info bg-opacity-10 rounded">
                    <div className="fw-bold text-info">
                      {stats.draftSystemPerformance?.convertedDraftValue?.toFixed(0) || 0} DT
                    </div>
                    <div className="small text-muted">Revenus générés par les brouillons</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="small text-center">
                    <div className="fw-bold text-success">{stats.draftSystemPerformance?.draftsConverted || 0}</div>
                    <div className="text-muted">Convertis</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="small text-center">
                    <div className="fw-bold text-warning">{stats.draftSystemPerformance?.currentDrafts || 0}</div>
                    <div className="text-muted">En attente</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Overview Cards */}
      <motion.div
        className="row mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="col-md-3 mb-3">
          <StatCard
            title="Réservations"
            value={stats.overview.totalReservations}
            icon={FaCalendarAlt}
            color="bg-primary"
            trend={stats.trends?.reservationsGrowth > 0 ? 'up' : 'down'}
            trendValue={Math.abs(stats.trends?.reservationsGrowth || 0)}
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            title="Clients"
            value={stats.overview.totalClients}
            icon={FaUsers}
            color="bg-success"
            trend={stats.trends?.clientsGrowth > 0 ? 'up' : 'down'}
            trendValue={Math.abs(stats.trends?.clientsGrowth || 0)}
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            title="Chiffre d'affaires"
            value={`${stats.overview.totalRevenue}€`}
            icon={FaEuroSign}
            color="bg-warning"
            trend={stats.trends?.revenueGrowth > 0 ? 'up' : 'down'}
            trendValue={Math.abs(stats.trends?.revenueGrowth || 0)}
          />
        </div>
        <div className="col-md-3 mb-3">
          <StatCard
            title="Ticket moyen"
            value={`${stats.overview.avgSpendPerClient?.toFixed(0) || 0}DT`}
            icon={FaPercent}
            color="bg-info"
          />
        </div>
      </motion.div>

      {/* === DRAFT PERFORMANCE DASHBOARD === */}
      <motion.div
        className="row mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="col-12">
          <h4 className="fw-bold text-dark mb-3">
            <FaEdit className="text-warning me-2" />
            🎯 Performances des Brouillons (Draft → Conversion)
          </h4>
          <div className="card border-0 shadow-sm bg-light">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="text-center p-3 rounded bg-white shadow-sm">
                    <h5 className="text-warning mb-1">{draftPerformance.overview.totalDraftsCreated}</h5>
                    <small className="text-muted">Brouillons créés (total)</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-center p-3 rounded bg-white shadow-sm">
                    <h5 className="text-success mb-1">{draftPerformance.overview.draftsConverted}</h5>
                    <small className="text-muted">Conversions réussies</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-center p-3 rounded bg-white shadow-sm">
                    <h5 className="text-danger mb-1">{draftPerformance.overview.draftsPending || 0}</h5>
                    <small className="text-muted">Brouillons en attente</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-center p-3 rounded bg-white shadow-sm">
                    <h5 className="text-primary mb-1">{draftPerformance.overview.conversionRate}%</h5>
                    <small className="text-muted">Taux de conversion</small>
                  </div>
                </div>
              </div>
              
              {/* Second row with revenue and direct bookings */}
              <div className="row mt-2">
                <div className="col-md-6 mb-3">
                  <div className="text-center p-3 rounded bg-white shadow-sm">
                    <h5 className="text-info mb-1">{draftPerformance.overview.revenueFromConversions}DT</h5>
                    <small className="text-muted">CA des conversions</small>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="text-center p-3 rounded bg-white shadow-sm">
                    <h5 className="text-primary mb-1">{draftPerformance.overview.directBookings}</h5>
                    <small className="text-muted">Réservations directes</small>
                  </div>
                </div>
              </div>
              
              {/* Draft vs Direct Booking Comparison */}
              <div className="row mt-3">
                <div className="col-md-6">
                  <div className="p-3 rounded bg-white border-start border-4 border-warning">
                    <h6 className="text-warning mb-2">📝 Réservations depuis brouillons</h6>
                    <div className="d-flex justify-content-between">
                      <span>Nombre:</span>
                      <strong>{draftPerformance.overview.draftsConverted}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Valeur moyenne:</span>
                      <strong>{draftPerformance.overview.avgConvertedValue?.toFixed(0) || 0}DT</strong>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 rounded bg-white border-start border-4 border-primary">
                    <h6 className="text-primary mb-2">⚡ Réservations directes</h6>
                    <div className="d-flex justify-content-between">
                      <span>Nombre:</span>
                      <strong>{draftPerformance.overview.directBookings}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Valeur moyenne:</span>
                      <strong>{draftPerformance.overview.avgDirectValue?.toFixed(0) || 0}DT</strong>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Insights */}
              <div className="mt-3 p-3 rounded bg-white">
                <h6 className="text-dark mb-2">💡 Insights:</h6>
                <div className="row">
                  <div className="col-md-6">
                    <span className={`badge ${
                      draftPerformance.insights?.conversionEffectiveness === 'excellent' ? 'bg-success' :
                      draftPerformance.insights?.conversionEffectiveness === 'good' ? 'bg-warning' : 'bg-danger'
                    }`}>
                      Efficacité conversion: {
                        draftPerformance.insights?.conversionEffectiveness === 'excellent' ? 'Excellente' :
                        draftPerformance.insights?.conversionEffectiveness === 'good' ? 'Bonne' : 'À améliorer'
                      }
                    </span>
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted">
                      {draftPerformance.insights?.revenueComparison === 'converted_higher' 
                        ? '🎯 Les conversions de brouillons génèrent plus de valeur' 
                        : '⚡ Les réservations directes sont plus rentables'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* === A. CRUCIAL METRICS === */}
      
      {/* Reservation Metrics Section */}
      <motion.div
        className="row mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="col-12">
          <h4 className="fw-bold text-dark mb-3">
            <FaCalendarAlt className="text-primary me-2" />
            Métriques de Réservation
          </h4>
        </div>
        
        {/* Peak Hours */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaClock className="text-warning me-2" />
                Heures de Pointe
              </h5>
            </div>
            <div className="card-body">
              {stats.reservationMetrics?.peakHours?.length > 0 ? (
                <div className="row">
                  {stats.reservationMetrics.peakHours.slice(0, 6).map((hour, index) => (
                    <div key={hour.hour} className="col-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span>{hour.hour}h00</span>
                        <span className="fw-bold text-primary">{hour.bookings}</span>
                      </div>
                      <div className="progress" style={{ height: '4px' }}>
                        <div 
                          className="progress-bar bg-warning" 
                          style={{ 
                            width: `${(hour.bookings / (stats.reservationMetrics.peakHours[0]?.bookings || 1)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaClock size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancellation Stats */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaTimesCircle className="text-danger me-2" />
                Annulations vs Absences
              </h5>
            </div>
            <div className="card-body">
              {stats.reservationMetrics?.cancellationStats?.length > 0 ? (
                <div className="row">
                  {stats.reservationMetrics.cancellationStats.map((stat) => (
                    <div key={stat.status} className="col-6 text-center">
                      <div className={`display-6 fw-bold ${stat.status === 'annulee' ? 'text-warning' : 'text-danger'}`}>
                        {stat.count}
                      </div>
                      <div className="small text-muted text-capitalize">{stat.status}</div>
                      <div className="small text-success">{stat.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaTimesCircle size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Client Management Section */}
      <motion.div
        className="row mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="col-12">
          <h4 className="fw-bold text-dark mb-3">
            <FaUsers className="text-success me-2" />
            Gestion Clientèle
          </h4>
        </div>

        {/* New vs Returning Clients */}
        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaUser className="text-primary me-2" />
                Nouveaux vs Fidèles
              </h5>
            </div>
            <div className="card-body text-center">
              <div className="row">
                <div className="col-6">
                  <div className="display-6 fw-bold text-success">
                    {stats.clientManagement?.newVsReturning?.newClients || 0}
                  </div>
                  <div className="small text-muted">Nouveaux</div>
                </div>
                <div className="col-6">
                  <div className="display-6 fw-bold text-primary">
                    {stats.clientManagement?.newVsReturning?.returningClients || 0}
                  </div>
                  <div className="small text-muted">Fidèles</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Retention Rates */}
        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaHeart className="text-danger me-2" />
                Taux de Fidélisation
              </h5>
            </div>
            <div className="card-body">
              {stats.clientManagement?.retentionRates?.length > 0 ? (
                stats.clientManagement.retentionRates.map((retention) => (
                  <div key={retention.period} className="d-flex justify-content-between mb-2">
                    <span className="text-capitalize">{retention.period.replace('_', ' ')}</span>
                    <span className="fw-bold text-success">{retention.rate}%</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-2">
                  <FaHeart size={32} className="mb-2 opacity-50" />
                  <p className="small">Aucune donnée</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VIP Clients */}
        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaTrophy className="text-warning me-2" />
                Clients VIP
              </h5>
            </div>
            <div className="card-body">
              {stats.clientManagement?.vipClients?.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {stats.clientManagement.vipClients.slice(0, 3).map((client, index) => (
                    <div key={index} className="border-bottom pb-2 mb-2">
                      <div className="fw-bold small">{client.name}</div>
                      <div className="text-muted small">
                        {client.totalVisits} visites • {client.totalSpent.toFixed(0)}DT
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-2">
                  <FaTrophy size={32} className="mb-2 opacity-50" />
                  <p className="small">Aucun client VIP</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* === B. INTERESTING METRICS === */}

      {/* Service Insights Section */}
      <motion.div
        className="row mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="col-12">
          <h4 className="fw-bold text-dark mb-3">
            <FaCut className="text-info me-2" />
            Analyse des Services
          </h4>
        </div>

        {/* Service Combinations */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaChartBar className="text-success me-2" />
                Combinaisons Populaires
              </h5>
            </div>
            <div className="card-body">
              {stats.serviceInsights?.serviceCombinations?.length > 0 ? (
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {stats.serviceInsights.serviceCombinations.slice(0, 5).map((combo, index) => (
                    <div key={index} className="border-bottom pb-2 mb-2">
                      <div className="fw-bold small">
                        {combo.service1} + {combo.service2}
                      </div>
                      <div className="text-muted small">
                        {combo.count} fois ensemble
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaChartBar size={48} className="mb-3 opacity-50" />
                  <p>Aucune combinaison détectée</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revenue by Service */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaEuroSign className="text-warning me-2" />
                Top Services par Revenus
              </h5>
            </div>
            <div className="card-body">
              {stats.revenueMetrics?.revenueByService?.length > 0 ? (
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {stats.revenueMetrics.revenueByService.slice(0, 5).map((service, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <div className="fw-bold small">{service.serviceName}</div>
                        <div className="text-muted small">{service.bookings} réservations</div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-success">{service.revenue.toFixed(0)}DT</div>
                        <div className="text-muted small">{service.avgPrice.toFixed(0)}DT/moy</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaEuroSign size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée de revenus</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Client Insights Section */}
      <motion.div
        className="row mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="col-12">
          <h4 className="fw-bold text-dark mb-3">
            <FaUserClock className="text-purple me-2" />
            Comportement Clients
          </h4>
        </div>

        {/* Booking Behavior */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaCalendarCheck className="text-info me-2" />
                Habitudes de Réservation
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="display-6 fw-bold text-primary">
                    {stats.clientInsights?.bookingBehavior?.avgLeadTime?.toFixed(0) || 0}
                  </div>
                  <div className="small text-muted">Jours d'avance moyen</div>
                </div>
                <div className="col-6 mb-3">
                  <div className="display-6 fw-bold text-warning">
                    {stats.clientInsights?.bookingBehavior?.sameDayBookings || 0}
                  </div>
                  <div className="small text-muted">Réservations jour même</div>
                </div>
                <div className="col-6">
                  <div className="display-6 fw-bold text-success">
                    {stats.clientInsights?.bookingBehavior?.weekAdvanceBookings || 0}
                  </div>
                  <div className="small text-muted">Réservations semaine</div>
                </div>
                <div className="col-6">
                  <div className="display-6 fw-bold text-info">
                    {stats.clientInsights?.bookingBehavior?.longAdvanceBookings || 0}
                  </div>
                  <div className="small text-muted">Réservations long terme</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Lifetime Value */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaHistory className="text-success me-2" />
                Valeur Vie Client
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-12 mb-3">
                  <div className="display-5 fw-bold text-success">
                    {stats.financialInsights?.clientLifetimeValue?.avgCLV?.toFixed(0) || 0}DT
                  </div>
                  <div className="small text-muted">Valeur vie moyenne</div>
                </div>
                <div className="col-6">
                  <div className="h4 fw-bold text-primary">
                    {stats.financialInsights?.clientLifetimeValue?.avgVisitsPerClient?.toFixed(1) || 0}
                  </div>
                  <div className="small text-muted">Visites moyennes</div>
                </div>
                <div className="col-6">
                  <div className="h4 fw-bold text-info">
                    {stats.financialInsights?.clientLifetimeValue?.avgClientLifespan?.toFixed(0) || 0}j
                  </div>
                  <div className="small text-muted">Durée relation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="row">
        {/* Legacy Reservations Status - Updated */}
        <div className="col-md-6 mb-4">
          <motion.div
            className="card border-0 shadow-sm h-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaCalendarAlt className="text-primary me-2" />
                Services les Plus Populaires
              </h5>
            </div>
            <div className="card-body">
              {stats.serviceInsights?.popularServices?.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.serviceInsights.popularServices.slice(0, 5).map((service, index) => (
                    <div key={index} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{service.name}</div>
                          <div className="small text-muted">{service.bookings} réservations</div>
                        </div>
                        <div className="text-end">
                          <div className="text-primary fw-bold">#{index + 1}</div>
                          <div className="small text-success">{service.revenue?.toFixed(0) || 0}DT</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaCut size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Utilization Heatmap Preview */}
        <div className="col-md-6 mb-4">
          <motion.div
            className="card border-0 shadow-sm h-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaBusinessTime className="text-primary me-2" />
                Utilisation du Spa
              </h5>
            </div>
            <div className="card-body">
              {stats.spaUtilization?.utilizationHeatmap?.length > 0 ? (
                <div>
                  <div className="small text-muted mb-2">Créneaux les plus occupés</div>
                  {stats.spaUtilization.utilizationHeatmap
                    .sort((a, b) => b.bookingCount - a.bookingCount)
                    .slice(0, 5)
                    .map((slot, index) => (
                      <div key={index} className="d-flex justify-content-between mb-1">
                        <span className="small">
                          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][slot.dayOfWeek - 1]} {slot.hour}h
                        </span>
                        <span className="fw-bold text-primary">{slot.bookingCount}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaBusinessTime size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée d'utilisation</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Additional Stats */}
      <motion.div
        className="row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaEuroSign className="text-primary me-2" />
                Revenus par Service
              </h5>
            </div>
            <div className="card-body">
              {(stats.services?.revenue || []).length === 0 ? (
                <div className="text-center text-muted py-4">
                  <FaEuroSign size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée de revenus disponible</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Réservations</th>
                        <th>Revenus</th>
                        <th>Prix moyen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.services?.revenue || []).map((service) => (
                        <tr key={service.id}>
                          <td className="fw-bold">{service.nom}</td>
                          <td>{service.reservations}</td>
                          <td className="text-success fw-bold">{service.revenue}€</td>
                          <td>{service.averagePrice}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      {/* Seasonal Trends & Insights */}
      <div className="row">
        <div className="col-12 mb-4">
          <motion.div
            className="card border-0 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaChartLine className="text-primary me-2" />
                Tendances Saisonnières
              </h5>
            </div>
            <div className="card-body">
              {stats.seasonalTrends?.monthlyBookings?.length > 0 ? (
                <div className="row">
                  <div className="col-md-8">
                    <div className="small text-muted mb-3">Réservations par mois (12 derniers mois)</div>
                    <div className="d-flex align-items-end justify-content-between mb-4" style={{ height: '100px' }}>
                      {stats.seasonalTrends.monthlyBookings.map((month, index) => (
                        <div key={index} className="d-flex flex-column align-items-center">
                          <div
                            className="bg-primary rounded"
                            style={{
                              width: '20px',
                              height: `${(month.bookings / Math.max(...stats.seasonalTrends.monthlyBookings.map(m => m.bookings))) * 80}px`,
                              minHeight: '5px'
                            }}
                          ></div>
                          <div className="small text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                            {month.month}
                          </div>
                          <div className="small fw-bold text-primary" style={{ fontSize: '0.7rem' }}>
                            {month.bookings}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-muted mb-3">Pic d'activité</div>
                    <div className="mb-3">
                      <div className="fw-bold text-success">
                        Meilleur mois: {stats.seasonalTrends.peakSeason?.month || 'N/A'}
                      </div>
                      <div className="small text-muted">
                        {stats.seasonalTrends.peakSeason?.bookings || 0} réservations
                      </div>
                    </div>
                    <div>
                      <div className="fw-bold text-warning">
                        Évolution: {stats.seasonalTrends.growthRate?.toFixed(1) || 0}%
                      </div>
                      <div className="small text-muted">
                        Croissance mensuelle moyenne
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaChartLine size={48} className="mb-3 opacity-50" />
                  <p>Aucune donnée de tendances disponible</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <motion.div
            className="card border-0 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaCog className="text-primary me-2" />
                Actions Rapides
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-2">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => window.location.reload()}
                  >
                    <FaSync className="me-2" />
                    Actualiser
                  </button>
                </div>
                <div className="col-md-3 mb-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => window.print()}
                  >
                    <FaDownload className="me-2" />
                    Exporter PDF
                  </button>
                </div>
                <div className="col-md-3 mb-2">
                  <button
                    className="btn btn-outline-info w-100"
                    onClick={() => navigate('/admin/reservations')}
                  >
                    <FaCalendarAlt className="me-2" />
                    Réservations
                  </button>
                </div>
                <div className="col-md-3 mb-2">
                  <button
                    className="btn btn-outline-success w-100"
                    onClick={() => navigate('/admin/services')}
                  >
                    <FaCut className="me-2" />
                    Services
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;
