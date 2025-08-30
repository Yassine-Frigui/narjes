import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/api';

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

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, draftResponse] = await Promise.all([
        adminAPI.getStatistics(dateRange),
        adminAPI.getDraftPerformance(dateRange === 'week' ? '7' : dateRange === 'month' ? '30' : '90')
      ]);
      
      if (statsResponse.data.success) {
        const data = statsResponse.data.data;
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
    { id: 'overview', label: '📊 Vue d\'ensemble', icon: '📊' },
    { id: 'financial', label: '💰 Financier', icon: '💰' },
    { id: 'drafts', label: '📝 Brouillons', icon: '📝' },
    { id: 'clients', label: '👥 Clients', icon: '👥' },
    { id: 'services', label: '🌟 Services', icon: '🌟' }
  ];

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 className="text-primary">📈 Tableau de Bord Statistiques</h2>
          <p className="text-muted">Analysez les performances de votre spa</p>
        </div>
        <div className="col-md-4">
          <select 
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">📅 7 derniers jours</option>
            <option value="month">📅 30 derniers jours</option>
            <option value="quarter">📅 90 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-pills nav-justified bg-light rounded p-2">
            {tabs.map(tab => (
              <li className="nav-item" key={tab.id}>
                <button 
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon} {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="row">
        <div className="col-12">
          {activeTab === 'overview' && <OverviewTab data={overviewData} />}
          {activeTab === 'financial' && <FinancialTab data={financialData} />}
          {activeTab === 'drafts' && <DraftsTab data={draftData} />}
          {activeTab === 'clients' && <ClientsTab data={clientData} />}
          {activeTab === 'services' && <ServicesTab data={serviceData} />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data }) => (
  <div className="row g-4">
    <div className="col-md-3">
      <div className="card bg-primary text-white h-100">
        <div className="card-body text-center">
          <h5 className="card-title">👥 Clients Total</h5>
          <h2 className="display-6">{data.totalClients || 0}</h2>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card bg-success text-white h-100">
        <div className="card-body text-center">
          <h5 className="card-title">📅 Réservations</h5>
          <h2 className="display-6">{data.totalReservations || 0}</h2>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card bg-warning text-white h-100">
        <div className="card-body text-center">
          <h5 className="card-title">💰 Chiffre d'Affaires</h5>
          <h2 className="display-6">{(data.totalRevenue || 0).toFixed(0)}DT</h2>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card bg-info text-white h-100">
        <div className="card-body text-center">
          <h5 className="card-title">✅ Terminées</h5>
          <h2 className="display-6">{data.completedReservations || 0}</h2>
        </div>
      </div>
    </div>
    
    <div className="col-12">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">📈 Croissance</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex justify-content-between">
                <span>Croissance des réservations:</span>
                <span className={`badge ${data.bookingGrowth >= 0 ? 'bg-success' : 'bg-danger'}`}>
                  {data.bookingGrowth >= 0 ? '+' : ''}{data.bookingGrowth}%
                </span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-between">
                <span>Croissance du chiffre d'affaires:</span>
                <span className={`badge ${data.revenueGrowth >= 0 ? 'bg-success' : 'bg-danger'}`}>
                  {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Financial Tab Component
const FinancialTab = ({ data }) => (
  <div className="row g-4">
    <div className="col-md-4">
      <div className="card border-success">
        <div className="card-header bg-success text-white">
          <h6 className="mb-0">💰 Chiffre d'Affaires Réalisé</h6>
        </div>
        <div className="card-body">
          <h3 className="text-success">{(data.revenueCompleted || 0).toFixed(0)}DT</h3>
          <p className="text-muted mb-0">{data.bookingsCompleted || 0} réservations terminées</p>
        </div>
      </div>
    </div>
    <div className="col-md-4">
      <div className="card border-warning">
        <div className="card-header bg-warning text-white">
          <h6 className="mb-0">⏳ Chiffre d'Affaires Potentiel</h6>
        </div>
        <div className="card-body">
          <h3 className="text-warning">{(data.revenuePotential || 0).toFixed(0)}DT</h3>
          <p className="text-muted mb-0">{data.bookingsConfirmed || 0} réservations confirmées</p>
        </div>
      </div>
    </div>
    <div className="col-md-4">
      <div className="card border-danger">
        <div className="card-header bg-danger text-white">
          <h6 className="mb-0">❌ Chiffre d'Affaires Perdu</h6>
        </div>
        <div className="card-body">
          <h3 className="text-danger">{(data.revenueLost || 0).toFixed(0)}DT</h3>
          <p className="text-muted mb-0">{data.bookingsLost || 0} réservations annulées</p>
        </div>
      </div>
    </div>
    
    <div className="col-12">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">💼 Interventions Admin</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6>🔧 Conversions Admin: <span className="badge bg-primary">{data.adminConversions || 0}</span></h6>
              <p className="text-muted">Valeur générée: {(data.adminConversionValue || 0).toFixed(0)}DT</p>
            </div>
            <div className="col-md-6">
              <h6>📊 Potentiel Total: <span className="badge bg-info">{(data.totalPotentialRevenue || 0).toFixed(0)}DT</span></h6>
              <p className="text-muted">Si tout était réalisé</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Drafts Tab Component
const DraftsTab = ({ data }) => {
  if (!data.overview) {
    return (
      <div className="alert alert-info">
        <h6>📝 Aucune donnée de brouillons disponible</h6>
        <p>Les données de performance des brouillons seront affichées ici une fois disponibles.</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-md-3">
        <div className="card bg-light">
          <div className="card-body text-center">
            <h6 className="card-title">📝 Brouillons Créés</h6>
            <h3 className="text-primary">{data.overview.totalDraftsCreated || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card bg-light">
          <div className="card-body text-center">
            <h6 className="card-title">✅ Convertis</h6>
            <h3 className="text-success">{data.overview.draftsConverted || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card bg-light">
          <div className="card-body text-center">
            <h6 className="card-title">⚡ Directs</h6>
            <h3 className="text-warning">{data.overview.directBookings || 0}</h3>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card bg-light">
          <div className="card-body text-center">
            <h6 className="card-title">📈 Taux de Conversion</h6>
            <h3 className="text-info">{data.overview.conversionRate || 0}%</h3>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">💰 Revenus des Conversions</h6>
          </div>
          <div className="card-body">
            <h4 className="text-success">{(data.overview.revenueFromConversions || 0).toFixed(0)}DT</h4>
            <p className="text-muted">Valeur moyenne: {(data.overview.avgConvertedValue || 0).toFixed(0)}DT</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">⚡ Revenus Directs</h6>
          </div>
          <div className="card-body">
            <h4 className="text-warning">{(data.overview.revenueFromDirect || 0).toFixed(0)}DT</h4>
            <p className="text-muted">Valeur moyenne: {(data.overview.avgDirectValue || 0).toFixed(0)}DT</p>
          </div>
        </div>
      </div>
      
      {data.insights && (
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">💡 Insights</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <span className={`badge ${
                    data.insights.conversionEffectiveness === 'excellent' ? 'bg-success' :
                    data.insights.conversionEffectiveness === 'good' ? 'bg-warning' : 'bg-danger'
                  }`}>
                    Efficacité: {
                      data.insights.conversionEffectiveness === 'excellent' ? 'Excellente' :
                      data.insights.conversionEffectiveness === 'good' ? 'Bonne' : 'À améliorer'
                    }
                  </span>
                </div>
                <div className="col-md-6">
                  <span className="text-muted">
                    {data.insights.revenueComparison === 'converted_higher' 
                      ? '💰 Conversions plus rentables' 
                      : '🎯 Directs plus rentables'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Clients Tab Component  
const ClientsTab = ({ data }) => (
  <div className="row g-4">
    <div className="col-md-6">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">👥 Nouveaux vs Fidèles</h6>
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
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">🏆 Clients VIP</h6>
        </div>
        <div className="card-body">
          {data.vipClients && data.vipClients.length > 0 ? (
            <div className="list-group list-group-flush">
              {data.vipClients.slice(0, 3).map((client, index) => (
                <div key={index} className="list-group-item px-0">
                  <div className="d-flex justify-content-between">
                    <strong>{client.name}</strong>
                    <span className="badge bg-gold">{client.totalSpent}DT</span>
                  </div>
                  <small className="text-muted">{client.totalVisits} visites</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">Aucun client VIP pour cette période</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Services Tab Component
const ServicesTab = ({ data }) => (
  <div className="row g-4">
    <div className="col-12">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">🌟 Services Populaires</h6>
        </div>
        <div className="card-body">
          {data.popularServices && data.popularServices.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
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
                      <td><strong>{(service.revenue || 0).toFixed(0)}DT</strong></td>
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

export default AdminStatistics;
