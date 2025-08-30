import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for different data sections
  const [overviewData, setOverviewData] = useState({});
  const [financialData, setFinancialData] = useState({});
  const [draftData, setDraftData] = useState({});
  const [clientData, setClientData] = useState({});
  const [serviceData, setServiceData] = useState({});

  // Safe number formatting helper
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return typeof value === 'number' ? value.toFixed(0) : value.toString();
  };

  // Format revenue as x(y) where x=actual, y=incoming
  const formatRevenue = (actual, incoming) => {
    const actualFormatted = formatNumber(actual || 0);
    const incomingFormatted = formatNumber(incoming || 0);
    return `${actualFormatted}(${incomingFormatted})`;
  };

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching statistics with dateRange:', dateRange);
      
      const [statsResponse, draftResponse] = await Promise.all([
        adminAPI.getStatistics(dateRange),
        adminAPI.getDraftPerformance(dateRange === 'week' ? '7' : dateRange === 'month' ? '30' : '90')
      ]);
      
      console.log('📊 Stats Response:', statsResponse.data);
      console.log('🎯 Draft Response:', draftResponse.data);
      
      if (statsResponse.data.success) {
        const data = statsResponse.data.data;
        console.log('✅ Setting overview data:', data.overview);
        console.log('💰 Setting financial data:', data.financialOverview);
        console.log('👥 Setting client data:', data.clientManagement);
        console.log('🌟 Setting service data:', data.serviceInsights);
        
        setOverviewData(data.overview || {});
        setFinancialData(data.financialOverview || {});
        setClientData(data.clientManagement || {});
        setServiceData(data.serviceInsights || {});
      }
      
      if (draftResponse.data.success) {
        const data = draftResponse.data.data;
        const conversionRate = parseFloat(data.overview?.conversionRate || 0);
        const avgConvertedValue = data.overview?.avgConvertedValue || 0;
        const avgDirectValue = data.overview?.avgDirectValue || 0;
        
        console.log('📝 Setting draft data with insights:', {
          conversionRate,
          avgConvertedValue,
          avgDirectValue
        });
        
        setDraftData({
          ...data,
          insights: {
            conversionEffectiveness: conversionRate >= 20 ? 'excellent' : conversionRate >= 10 ? 'good' : 'needs_improvement',
            revenueComparison: avgConvertedValue > avgDirectValue ? 'converted_higher' : 'direct_higher'
          }
        });
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: 'bi bi-graph-up' },
    { id: 'financial', label: 'Financier', icon: 'bi bi-currency-dollar' },
    { id: 'drafts', label: 'Brouillons', icon: 'bi bi-file-text' },
    { id: 'clients', label: 'Clients', icon: 'bi bi-people' },
    { id: 'services', label: 'Services', icon: 'bi bi-star' }
  ];

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white border-bottom">
              <h4 className="mb-0 text-dark fw-bold">Statistiques Administrateur</h4>
            </div>
            <div className="card-body p-0">
              {/* Navigation Tabs */}
              <div className="border-bottom bg-light">
                <ul className="nav nav-tabs nav-fill border-0">
                  {tabs.map((tab) => (
                    <li key={tab.id} className="nav-item">
                      <button
                        className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          border: 'none',
                          borderBottom: activeTab === tab.id ? '3px solid #0d6efd' : '3px solid transparent',
                          backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                          color: activeTab === tab.id ? '#0d6efd' : '#6c757d',
                          fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                          padding: '1rem'
                        }}
                      >
                        <i className={`${tab.icon} me-2`}></i>
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tab Content */}
              <div className="p-4 bg-white">
                {activeTab === 'overview' && <OverviewTab data={overviewData} financialData={financialData} formatNumber={formatNumber} formatRevenue={formatRevenue} />}
                {activeTab === 'financial' && <FinancialTab data={financialData} formatNumber={formatNumber} formatRevenue={formatRevenue} />}
                {activeTab === 'drafts' && <DraftsTab data={draftData?.overview || draftData} formatNumber={formatNumber} />}
                {activeTab === 'clients' && <ClientsTab data={clientData} formatNumber={formatNumber} />}
                {activeTab === 'services' && <ServicesTab data={serviceData} formatNumber={formatNumber} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data, financialData, formatNumber, formatRevenue }) => {
  console.log('OverviewTab data:', data);
  console.log('OverviewTab financialData:', financialData);

  return (
    <div className="row g-4">
      {/* Key Metrics */}
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Total Réservations</h6>
            <h3 className="text-primary mb-0">{formatNumber(financialData.bookingsCompleted + financialData.bookingsConfirmed)}</h3>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Revenus Total</h6>
            <h3 className="text-success mb-0">
              {formatRevenue(financialData.revenueCompleted, financialData.revenuePotential)}DT
            </h3>
            <small className="text-muted">Réalisé(Programmé)</small>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Conversions Admin</h6>
            <h3 className="text-info mb-0">{formatNumber(financialData.adminConversions)}</h3>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Revenus Perdus</h6>
            <h3 className="text-danger mb-0">{formatNumber(financialData.revenueLost)}DT</h3>
          </div>
        </div>
      </div>
      
      {/* Performance Summary */}
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Résumé des Performances</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h6 className="text-muted">Taux de Conversion</h6>
                  <h4 className="text-primary">{formatNumber(financialData.adminSuccessRate)}%</h4>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h6 className="text-muted">Valeur Moyenne</h6>
                  <h4 className="text-success">{formatNumber(financialData.avgValueAdminHandled)}DT</h4>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h6 className="text-muted">Revenus Sauvés</h6>
                  <h4 className="text-info">{formatNumber(financialData.revenueRescuedByAdmin)}DT</h4>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h6 className="text-muted">Impact Total</h6>
                  <h4 className="text-warning">{formatNumber(financialData.adminConversionValue)}DT</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Financial Tab Component
const FinancialTab = ({ data, formatNumber, formatRevenue }) => {
  console.log('FinancialTab data:', data);

  return (
    <div className="row g-4">
      {/* Revenue Overview */}
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Vue d'ensemble des Revenus</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <h6 className="text-muted">Revenus Réalisés</h6>
              <h4 className="text-success">{formatNumber(data.revenueCompleted)}DT</h4>
            </div>
            <div className="mb-3">
              <h6 className="text-muted">Revenus Programmés</h6>
              <h4 className="text-primary">{formatNumber(data.revenuePotential)}DT</h4>
            </div>
            <div className="mb-3">
              <h6 className="text-muted">Revenus Perdus</h6>
              <h4 className="text-danger">{formatNumber(data.revenueLost)}DT</h4>
            </div>
            <div>
              <h6 className="text-muted">Taux de Conversion</h6>
              <h4 className="text-info">{formatNumber(data.adminSuccessRate)}%</h4>
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Statistics */}
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Statistiques de Réservation</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <h6 className="text-muted">Réservations Terminées</h6>
              <h4 className="text-success">{formatNumber(data.bookingsCompleted)}</h4>
            </div>
            <div className="mb-3">
              <h6 className="text-muted">Réservations Confirmées</h6>
              <h4 className="text-primary">{formatNumber(data.bookingsConfirmed)}</h4>
            </div>
            <div className="mb-3">
              <h6 className="text-muted">Conversions Admin</h6>
              <h4 className="text-info">{formatNumber(data.adminConversions)}</h4>
            </div>
            <div>
              <h6 className="text-muted">Revenus Sauvés</h6>
              <h4 className="text-warning">{formatNumber(data.revenueRescuedByAdmin)}DT</h4>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Métriques de Performance</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <h6 className="text-muted">Valeur Moyenne Admin</h6>
              <h4 className="text-primary">{formatNumber(data.avgValueAdminHandled)}DT</h4>
            </div>
            <div className="mb-3">
              <h6 className="text-muted">Impact des Conversions</h6>
              <h4 className="text-success">{formatNumber(data.adminConversionValue)}DT</h4>
            </div>
            <div className="mb-3">
              <h6 className="text-muted">Efficacité Admin</h6>
              <h4 className="text-info">{formatNumber(data.adminSuccessRate)}%</h4>
            </div>
            <div>
              <h6 className="text-muted">Total Géré</h6>
              <h4 className="text-warning">
                {formatRevenue(data.revenueCompleted, data.revenuePotential)}DT
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Drafts Tab Component
const DraftsTab = ({ data, formatNumber }) => {
  console.log('DraftsTab data:', data);
  console.log('DraftsTab data type:', typeof data);
  console.log('DraftsTab data keys:', data ? Object.keys(data) : 'no data');

  // Just render the data regardless of what it contains
  return (
    <div className="row g-4">
      {/* Key Metrics */}
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Brouillons Créés</h6>
            <h3 className="text-primary">{formatNumber(data?.totalDraftsCreated || 0)}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Convertis</h6>
            <h3 className="text-success">{formatNumber(data?.draftsConverted || 0)}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Taux de Conversion</h6>
            <h3 className="text-info">{formatNumber(data?.conversionRate || 0)}%</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Revenus Générés</h6>
            <h3 className="text-warning">{formatNumber(data?.revenueFromConversions || 0)}DT</h3>
          </div>
        </div>
      </div>

      {/* Performance Details */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Détails de Performance</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                  <span>Brouillons en attente</span>
                  <strong>{formatNumber(data?.draftsPending || 0)}</strong>
                </div>
              </div>
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                  <span>Réservations directes</span>
                  <strong className="text-success">{formatNumber(data?.directBookings || 0)}</strong>
                </div>
              </div>
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                  <span>Revenus directs</span>
                  <strong className="text-info">{formatNumber(data?.revenueFromDirect || 0)}DT</strong>
                </div>
              </div>
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                  <span>Valeur moyenne directe</span>
                  <strong className="text-primary">{formatNumber(data?.avgDirectValue || 0)}DT</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown Chart */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Analyse des Revenus</h5>
          </div>
          <div className="card-body">
            <div style={{ height: '300px' }}>
              <Bar 
                data={{
                  labels: ['Revenus Directs', 'Total Revenus', 'Revenus Brouillons'],
                  datasets: [
                    {
                      label: 'Revenus (DT)',
                      data: [
                        parseFloat(data?.revenueFromDirect || 0),
                        parseFloat(data?.revenueFromDirect || 0) + parseFloat(data?.revenueFromConversions || 0),
                        parseFloat(data?.revenueFromConversions || 0)
                      ],
                      backgroundColor: [
                        'rgba(13, 110, 253, 0.8)',   // Blue for direct
                        'rgba(25, 135, 84, 0.8)',    // Green for total
                        'rgba(255, 193, 7, 0.8)'     // Yellow for drafts
                      ],
                      borderColor: [
                        'rgba(13, 110, 253, 1)',
                        'rgba(25, 135, 84, 1)',
                        'rgba(255, 193, 7, 1)'
                      ],
                      borderWidth: 2
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    title: {
                      display: true,
                      text: 'Comparaison des Sources de Revenus'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + ' DT';
                        }
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="mt-3">
              <div className="row text-center">
                <div className="col-4">
                  <small className="text-primary">
                    <i className="bi bi-square-fill me-1"></i>
                    Directs: {formatNumber(data?.revenueFromDirect || 0)}DT
                  </small>
                </div>
                <div className="col-4">
                  <small className="text-success">
                    <i className="bi bi-square-fill me-1"></i>
                    Total: {formatNumber((parseFloat(data?.revenueFromDirect || 0) + parseFloat(data?.revenueFromConversions || 0)))}DT
                  </small>
                </div>
                <div className="col-4">
                  <small className="text-warning">
                    <i className="bi bi-square-fill me-1"></i>
                    Brouillons: {formatNumber(data?.revenueFromConversions || 0)}DT
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clients Tab Component
const ClientsTab = ({ data, formatNumber }) => {
  console.log('ClientsTab data:', data);

  return (
    <div className="row g-4">
      {/* Client Overview */}
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Total Clients</h6>
            <h3 className="text-primary">{formatNumber(data.totalClients)}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Clients Actifs</h6>
            <h3 className="text-success">{formatNumber(data.activeClients)}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Nouveaux ce mois</h6>
            <h3 className="text-info">{formatNumber(data.newClients)}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Taux de Rétention</h6>
            <h3 className="text-warning">{formatNumber(data.retentionRate)}%</h3>
          </div>
        </div>
      </div>

      {/* Client Metrics */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Métriques Clients</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Revenus/Client</span>
                <strong>{formatNumber(data.avgRevenuePerClient)}DT</strong>
              </div>
              <div className="progress">
                <div className="progress-bar bg-success" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Visites/Client</span>
                <strong>{formatNumber(data.avgVisitsPerClient)}</strong>
              </div>
              <div className="progress">
                <div className="progress-bar bg-primary" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Satisfaction</span>
                <strong>{formatNumber(data.satisfactionScore)}/5</strong>
              </div>
              <div className="progress">
                <div className="progress-bar bg-warning" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Détails Supplémentaires</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                  <span>Croissance mensuelle</span>
                  <strong className="text-success">+{formatNumber(data.growthRate)}%</strong>
                </div>
              </div>
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                  <span>Clients fidèles</span>
                  <strong className="text-primary">{formatNumber(data.loyalClients)}</strong>
                </div>
              </div>
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                  <span>Clients VIP</span>
                  <strong className="text-warning">{formatNumber(data.vipClients)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segmentation */}
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Segmentation de la Clientèle</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="text-center p-4 border rounded">
                  <h6 className="text-muted">Nouveaux</h6>
                  <h4 className="text-primary">{formatNumber(data.newClients)}</h4>
                  <small className="text-muted">0-3 visites</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-4 border rounded">
                  <h6 className="text-muted">Réguliers</h6>
                  <h4 className="text-success">{formatNumber(data.regularClients)}</h4>
                  <small className="text-muted">4-10 visites</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-4 border rounded">
                  <h6 className="text-muted">Fidèles</h6>
                  <h4 className="text-warning">{formatNumber(data.loyalClients)}</h4>
                  <small className="text-muted">11+ visites</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-4 border rounded">
                  <h6 className="text-muted">VIP</h6>
                  <h4 className="text-danger">{formatNumber(data.vipClients)}</h4>
                  <small className="text-muted">Premium</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Services Tab Component
const ServicesTab = ({ data, formatNumber }) => {
  console.log('ServicesTab data:', data);
  console.log('ServicesTab data type:', typeof data);
  console.log('ServicesTab data keys:', data ? Object.keys(data) : 'no data');

  // Handle both array and object with array property
  let servicesArray = Array.isArray(data) ? data : (data?.mostPopular || data?.services || []);
  
  console.log('ServicesTab servicesArray:', servicesArray);

  const totalBookings = servicesArray.reduce((sum, service) => sum + (service.bookings || 0), 0);
  const totalRevenue = servicesArray.reduce((sum, service) => sum + (service.revenue || 0), 0);

  return (
    <div className="row g-4">
      {/* Service Performance Overview */}
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Total Services</h6>
            <h3 className="text-primary">{servicesArray.length}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Total Réservations</h6>
            <h3 className="text-success">{formatNumber(totalBookings)}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Total Revenus</h6>
            <h3 className="text-info">{formatNumber(totalRevenue)}DT</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Revenus Moyen</h6>
            <h3 className="text-warning">{formatNumber(totalRevenue / servicesArray.length)}DT</h3>
          </div>
        </div>
      </div>

      {/* Services Performance Table */}
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Performance Détaillée des Services</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Rang</th>
                    <th>Service</th>
                    <th className="text-center">Réservations</th>
                    <th className="text-center">Revenus</th>
                    <th className="text-center">Revenus/Réservation</th>
                    <th className="text-center">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesArray.map((service, index) => (
                    <tr key={index}>
                      <td>
                        <span className={`badge ${index < 3 ? 'bg-success' : 'bg-secondary'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td>
                        <strong>{service.name}</strong>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary px-3 py-2">{formatNumber(service.bookings || 0)}</span>
                      </td>
                      <td className="text-center">
                        <strong className="text-success">{formatNumber(service.revenue || 0)}DT</strong>
                      </td>
                      <td className="text-center">
                        <span className="text-muted">
                          {formatNumber((service.revenue || 0) / Math.max(service.bookings || 1, 1))}DT
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="progress" style={{ height: '8px', width: '100px', margin: '0 auto' }}>
                          <div 
                            className={`progress-bar ${index < 3 ? 'bg-success' : 'bg-secondary'}`}
                            style={{ 
                              width: `${Math.min(((service.bookings || 0) / Math.max(...servicesArray.map(s => s.bookings || 0))) * 100, 100)}%`
                            }}>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Service Insights */}
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Insights Services</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="text-center p-4 bg-light rounded">
                  <h6 className="text-success">Service le Plus Rentable</h6>
                  <h5 className="text-success">
                    {servicesArray.length > 0 ? 
                      servicesArray.reduce((max, service) => 
                        (service.revenue || 0) > (max.revenue || 0) ? service : max, 
                        servicesArray[0]
                      ).name || 'N/A' : 'Aucun service'}
                  </h5>
                  <small className="text-muted">
                    {servicesArray.length > 0 ? 
                      formatNumber(Math.max(...servicesArray.map(s => s.revenue || 0))) + 'DT' : 
                      '0DT'}
                  </small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-4 bg-light rounded">
                  <h6 className="text-primary">Service le Plus Demandé</h6>
                  <h5 className="text-primary">
                    {servicesArray.length > 0 ? 
                      servicesArray.reduce((max, service) => 
                        (service.bookings || 0) > (max.bookings || 0) ? service : max, 
                        servicesArray[0]
                      ).name || 'N/A' : 'Aucun service'}
                  </h5>
                  <small className="text-muted">
                    {servicesArray.length > 0 ? 
                      Math.max(...servicesArray.map(s => s.bookings || 0)) + ' réservations' : 
                      '0 réservations'}
                  </small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-4 bg-light rounded">
                  <h6 className="text-warning">Meilleur Ratio</h6>
                  <h5 className="text-warning">
                    {servicesArray.length > 0 ? 
                      servicesArray.reduce((max, service) => {
                        const ratio = (service.revenue || 0) / Math.max(service.bookings || 1, 1);
                        const maxRatio = (max.revenue || 0) / Math.max(max.bookings || 1, 1);
                        return ratio > maxRatio ? service : max;
                      }, servicesArray[0]).name || 'N/A' : 'Aucun service'}
                  </h5>
                  <small className="text-muted">
                    {servicesArray.length > 0 ? 
                      formatNumber(Math.max(...servicesArray.map(s => 
                        (s.revenue || 0) / Math.max(s.bookings || 1, 1)
                      ))) + 'DT/réservation' : 
                      '0DT/réservation'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;
