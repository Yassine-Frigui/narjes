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
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        console.log('Fetching statistics from AdminStatistics component...');
        
        const response = await adminAPI.getStatistics();
        console.log('Statistics response:', response);
        
        setData(response || {});
        setError(null);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-3 text-muted">Chargement des statistiques...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger">
              <h5>Erreur</h5>
              <p>{error}</p>
              <button 
                className="btn btn-outline-danger" 
                onClick={() => window.location.reload()}
              >
                Réessayer
              </button>
            </div>
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
                {activeTab === 'overview' && <OverviewTab data={data} formatNumber={formatNumber} formatRevenue={formatRevenue} />}
                {activeTab === 'financial' && <FinancialTab data={data} formatNumber={formatNumber} formatRevenue={formatRevenue} />}
                {activeTab === 'drafts' && <DraftsTab data={data} formatNumber={formatNumber} />}
                {activeTab === 'clients' && <ClientsTab data={data} formatNumber={formatNumber} />}
                {activeTab === 'services' && <ServicesTab data={data} formatNumber={formatNumber} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data, formatNumber, formatRevenue }) => {
  // Sample chart data for demonstration
  const revenueChartData = {
    labels: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Revenus Réalisés',
        data: [12000, 19000, 15000, 22000, 18000, 25000],
        backgroundColor: 'rgba(13, 110, 253, 0.8)',
        borderColor: 'rgba(13, 110, 253, 1)',
        borderWidth: 2
      },
      {
        label: 'Revenus Programmés',
        data: [5000, 8000, 6000, 9000, 7000, 11000],
        backgroundColor: 'rgba(25, 135, 84, 0.8)',
        borderColor: 'rgba(25, 135, 84, 1)',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution des Revenus'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="row g-4">
      {/* Key Metrics */}
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Total Réservations</h6>
            <h3 className="text-primary mb-0">{formatNumber(data.totalBookings)}</h3>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Revenus Total</h6>
            <h3 className="text-success mb-0">{formatRevenue(data.actualRevenue, data.incomingRevenue)}DT</h3>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Nouveaux Clients</h6>
            <h3 className="text-info mb-0">{formatNumber(data.newClients)}</h3>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Taux de Conversion</h6>
            <h3 className="text-warning mb-0">{formatNumber(data.conversionRate)}%</h3>
          </div>
        </div>
      </div>
      
      {/* Revenue Chart */}
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Analyse des Revenus</h5>
          </div>
          <div className="card-body">
            <div style={{ height: '400px' }}>
              <Bar data={revenueChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Financial Tab Component
const FinancialTab = ({ data, formatNumber, formatRevenue }) => {
  const revenueBreakdownData = {
    labels: ['Services', 'Abonnements', 'Consultations', 'Autres'],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: [
          'rgba(13, 110, 253, 0.8)',
          'rgba(25, 135, 84, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(220, 53, 69, 0.8)'
        ],
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="row g-4">
      {/* Revenue Summary */}
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0">Revenus Réalisés</h6>
          </div>
          <div className="card-body">
            <h3 className="text-success">{formatNumber(data.actualRevenue || 0)}DT</h3>
            <p className="text-muted mb-0">Encaissés ce mois</p>
          </div>
        </div>
      </div>
      
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0">Revenus Programmés</h6>
          </div>
          <div className="card-body">
            <h3 className="text-primary">{formatNumber(data.incomingRevenue || 0)}DT</h3>
            <p className="text-muted mb-0">Réservations confirmées</p>
          </div>
        </div>
      </div>
      
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0">Format Combiné</h6>
          </div>
          <div className="card-body">
            <h3 className="text-dark">{formatRevenue(data.actualRevenue, data.incomingRevenue)}DT</h3>
            <p className="text-muted mb-0">Réalisé(Programmé)</p>
          </div>
        </div>
      </div>
      
      {/* Revenue Breakdown Chart */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Répartition des Revenus</h5>
          </div>
          <div className="card-body">
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut data={revenueBreakdownData} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Financial Metrics */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Métriques Financières</h5>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span>Revenus Services</span>
              <strong>{formatNumber(data.serviceRevenue || 0)}DT</strong>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span>Revenus Abonnements</span>
              <strong>{formatNumber(data.membershipRevenue || 0)}DT</strong>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span>Revenus Perdus</span>
              <strong className="text-danger">{formatNumber(data.lostRevenue || 0)}DT</strong>
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold">Total</span>
              <strong className="text-primary">{formatRevenue(data.actualRevenue, data.incomingRevenue)}DT</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Drafts Tab Component
const DraftsTab = ({ data, formatNumber }) => {
  if (!data.overview) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="alert alert-info">
            <h6>Aucune donnée de brouillons disponible</h6>
            <p>Les données de performance des brouillons seront affichées ici une fois disponibles.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Brouillons Créés</h6>
            <h3 className="text-primary">{data.overview.totalDraftsCreated || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Convertis</h6>
            <h3 className="text-success">{data.overview.draftsConverted || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Directs</h6>
            <h3 className="text-warning">{data.overview.directBookings || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h6 className="text-muted mb-2">Taux de Conversion</h6>
            <h3 className="text-info">{data.overview.conversionRate || 0}%</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clients Tab Component
const ClientsTab = ({ data, formatNumber }) => {
  const clientGrowthData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Nouveaux Clients',
        data: [12, 19, 15, 22, 18, 25],
        borderColor: 'rgba(13, 110, 253, 1)',
        backgroundColor: 'rgba(13, 110, 253, 0.2)',
        tension: 0.4
      },
      {
        label: 'Clients Fidèles',
        data: [8, 12, 10, 15, 12, 18],
        borderColor: 'rgba(25, 135, 84, 1)',
        backgroundColor: 'rgba(25, 135, 84, 0.2)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="row g-4">
      <div className="col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0">Nouveaux vs Fidèles</h6>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-6">
                <h4 className="text-primary">{data.newVsReturning?.newClients || 0}</h4>
                <p className="text-muted">Nouveaux clients</p>
              </div>
              <div className="col-6">
                <h4 className="text-success">{data.newVsReturning?.returningClients || 0}</h4>
                <p className="text-muted">Clients fidèles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0">Croissance Clientèle</h6>
          </div>
          <div className="card-body">
            <div style={{ height: '200px' }}>
              <Line data={clientGrowthData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Services Tab Component
const ServicesTab = ({ data, formatNumber }) => {
  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0">Services Populaires</h6>
          </div>
          <div className="card-body">
            {data.popularServices && data.popularServices.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Réservations</th>
                      <th>Revenus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.popularServices.map((service, index) => (
                      <tr key={index}>
                        <td>{service.name}</td>
                        <td><span className="badge bg-primary">{service.bookings}</span></td>
                        <td><strong>{formatNumber(service.revenue)}DT</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted">Aucune donnée de service disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;
