import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

// Helper function to safely format numbers
const formatNumber = (value, decimals = 0) => {
  const num = parseFloat(value) || 0;
  return num.toFixed(decimals);
};

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
    { id: 'overview', label: '📊 Vue d\'ensemble', icon: '📊' },
    { id: 'financial', label: '💰 Financier', icon: '💰' },
    { id: 'drafts', label: '📝 Brouillons', icon: '📝' },
    { id: 'clients', label: '👥 Clients', icon: '👥' },
    { id: 'services', label: '🌟 Services', icon: '🌟' }
  ];

  return (
    <div className="container-fluid p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="mb-2" style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
                    📊 Tableau de Bord Analytics
                  </h1>
                  <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
                    Analysez les performances et optimisez votre spa
                  </p>
                </div>
                <div className="col-md-4">
                  <div className="position-relative">
                    <select 
                      className="form-select shadow-sm border-0"
                      style={{ 
                        borderRadius: '15px', 
                        background: 'linear-gradient(45deg, #f8f9ff, #e8ecff)',
                        fontSize: '1rem',
                        padding: '12px 20px'
                      }}
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                    >
                      <option value="week">📅 7 derniers jours</option>
                      <option value="month">📅 30 derniers jours</option>
                      <option value="quarter">📅 90 derniers jours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="card-body p-3">
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {tabs.map(tab => (
                  <button 
                    key={tab.id}
                    className={`btn position-relative px-4 py-3 fw-bold transition-all ${
                      activeTab === tab.id 
                        ? 'btn-primary shadow-lg' 
                        : 'btn-outline-secondary'
                    }`}
                    style={{ 
                      borderRadius: '15px',
                      minWidth: '140px',
                      border: activeTab === tab.id ? 'none' : '2px solid #e9ecef',
                      background: activeTab === tab.id 
                        ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                        : 'transparent',
                      color: activeTab === tab.id ? 'white' : '#6c757d',
                      transform: activeTab === tab.id ? 'translateY(-2px)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setActiveTab(tab.id)}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.transform = 'none';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div className="d-flex flex-column align-items-center">
                      <span style={{ fontSize: '1.5rem' }}>{tab.icon}</span>
                      <span style={{ fontSize: '0.9rem', marginTop: '4px' }}>{tab.label.split(' ').slice(1).join(' ')}</span>
                    </div>
                    {activeTab === tab.id && (
                      <div 
                        className="position-absolute bottom-0 start-50 translate-middle-x"
                        style={{
                          width: '30px',
                          height: '4px',
                          background: 'rgba(255,255,255,0.8)',
                          borderRadius: '2px',
                          marginBottom: '-2px'
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="row">
        <div className="col-12">
          <div className="fade-in" style={{ animation: 'fadeIn 0.5s ease-in' }}>
            {activeTab === 'overview' && <OverviewTab data={overviewData} />}
            {activeTab === 'financial' && <FinancialTab data={financialData} />}
            {activeTab === 'drafts' && <DraftsTab data={draftData} />}
            {activeTab === 'clients' && <ClientsTab data={clientData} />}
            {activeTab === 'services' && <ServicesTab data={serviceData} />}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .transition-all {
          transition: all 0.3s ease !important;
        }
        .card:hover {
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data }) => (
  <div className="row g-4">
    {/* Metric Cards */}
    <div className="col-lg-3 col-md-6">
      <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body text-center p-4 text-white">
          <div className="mb-3" style={{ fontSize: '3rem' }}>👥</div>
          <h5 className="card-title mb-2 fw-bold">Clients Total</h5>
          <h2 className="display-5 fw-bold mb-0">{data.totalClients || 0}</h2>
          <div className="mt-3 small opacity-75">Base clients active</div>
        </div>
      </div>
    </div>
    
    <div className="col-lg-3 col-md-6">
      <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
        <div className="card-body text-center p-4 text-white">
          <div className="mb-3" style={{ fontSize: '3rem' }}>📅</div>
          <h5 className="card-title mb-2 fw-bold">Réservations</h5>
          <h2 className="display-5 fw-bold mb-0">{data.totalReservations || 0}</h2>
          <div className="mt-3 small opacity-75">Total des réservations</div>
        </div>
      </div>
    </div>
    
    <div className="col-lg-3 col-md-6">
      <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
        <div className="card-body text-center p-4 text-white">
          <div className="mb-3" style={{ fontSize: '3rem' }}>💰</div>
          <h5 className="card-title mb-2 fw-bold">Chiffre d'Affaires</h5>
          <h2 className="display-5 fw-bold mb-0">{formatNumber(data.totalRevenue)}DT</h2>
          <div className="mt-3 small opacity-75">Revenus générés</div>
        </div>
      </div>
    </div>
    
    <div className="col-lg-3 col-md-6">
      <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
        <div className="card-body text-center p-4 text-white">
          <div className="mb-3" style={{ fontSize: '3rem' }}>✅</div>
          <h5 className="card-title mb-2 fw-bold">Terminées</h5>
          <h2 className="display-5 fw-bold mb-0">{data.completedReservations || 0}</h2>
          <div className="mt-3 small opacity-75">Séances réalisées</div>
        </div>
      </div>
    </div>
    
    {/* Growth Metrics */}
    <div className="col-12">
      <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0' }}>
          <h4 className="mb-0 text-white fw-bold">📈 Performance et Croissance</h4>
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-primary mb-1 fw-bold">Croissance des réservations</h6>
                    <small className="text-muted">Évolution par rapport au mois précédent</small>
                  </div>
                  <div className="text-end">
                    <span className={`badge px-3 py-2 ${data.bookingGrowth >= 0 ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '1rem', borderRadius: '10px' }}>
                      {data.bookingGrowth >= 0 ? '📈 +' : '📉 '}{Math.abs(data.bookingGrowth || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-purple mb-1 fw-bold">Croissance du chiffre d'affaires</h6>
                    <small className="text-muted">Évolution financière mensuelle</small>
                  </div>
                  <div className="text-end">
                    <span className={`badge px-3 py-2 ${data.revenueGrowth >= 0 ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '1rem', borderRadius: '10px' }}>
                      {data.revenueGrowth >= 0 ? '💰 +' : '💸 '}{Math.abs(data.revenueGrowth || 0)}%
                    </span>
                  </div>
                </div>
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
    {/* Revenue Cards */}
    <div className="col-lg-4">
      <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
        <div className="card-body p-4 text-white">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h6 className="card-title mb-2 fw-bold opacity-90">💰 Chiffre d'Affaires Réalisé</h6>
              <h3 className="fw-bold mb-0">{formatNumber(data.revenueCompleted)}DT</h3>
            </div>
            <div className="text-end opacity-75">
              <div style={{ fontSize: '2.5rem' }}>💚</div>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="d-flex justify-content-between align-items-center">
              <span className="small">Réservations terminées</span>
              <span className="badge bg-light text-dark fw-bold">{data.bookingsCompleted || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="col-lg-4">
      <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
        <div className="card-body p-4 text-white">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h6 className="card-title mb-2 fw-bold opacity-90">⏳ Chiffre d'Affaires Potentiel</h6>
              <h3 className="fw-bold mb-0">{formatNumber(data.revenuePotential)}DT</h3>
            </div>
            <div className="text-end opacity-75">
              <div style={{ fontSize: '2.5rem' }}>⏰</div>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="d-flex justify-content-between align-items-center">
              <span className="small">Réservations confirmées</span>
              <span className="badge bg-light text-dark fw-bold">{data.bookingsConfirmed || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="col-lg-4">
      <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body p-4 text-white">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h6 className="card-title mb-2 fw-bold opacity-90">❌ Chiffre d'Affaires Perdu</h6>
              <h3 className="fw-bold mb-0">{formatNumber(data.revenueLost)}DT</h3>
            </div>
            <div className="text-end opacity-75">
              <div style={{ fontSize: '2.5rem' }}>💔</div>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="d-flex justify-content-between align-items-center">
              <span className="small">Réservations annulées</span>
              <span className="badge bg-light text-dark fw-bold">{data.bookingsLost || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Admin Impact Section */}
    <div className="col-12">
      <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #ffecd2, #fcb69f)', borderRadius: '20px 20px 0 0' }}>
          <h4 className="mb-0 text-dark fw-bold">💼 Impact des Interventions Admin</h4>
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)', border: '2px solid #c3e6cb' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3" style={{ fontSize: '2rem' }}>🔧</div>
                  <div>
                    <h6 className="mb-1 text-success fw-bold">Conversions Admin</h6>
                    <span className="badge bg-primary fs-6 px-3 py-2">{data.adminConversions || 0}</span>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-2" style={{ background: 'rgba(25, 135, 84, 0.1)' }}>
                  <div className="text-muted small mb-1">Valeur générée</div>
                  <div className="h5 text-success fw-bold mb-0">{formatNumber(data.adminConversionValue)}DT</div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%)', border: '2px solid #b3d9ff' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3" style={{ fontSize: '2rem' }}>📊</div>
                  <div>
                    <h6 className="mb-1 text-primary fw-bold">Potentiel Total</h6>
                    <span className="badge bg-info fs-6 px-3 py-2">{formatNumber(data.totalPotentialRevenue)}DT</span>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-2" style={{ background: 'rgba(13, 110, 253, 0.1)' }}>
                  <div className="text-muted small mb-1">Si tout était réalisé</div>
                  <div className="h6 text-info fw-bold mb-0">Objectif maximal</div>
                </div>
              </div>
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
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
            <div className="card-body text-center p-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
              <h4 className="text-primary fw-bold mb-3">Aucune donnée de brouillons disponible</h4>
              <p className="text-muted mb-0">Les données de performance des brouillons seront affichées ici une fois disponibles.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Key Metrics */}
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="card-body text-center p-4 text-white">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</div>
            <h6 className="fw-bold opacity-90">Brouillons Créés</h6>
            <h3 className="fw-bold mb-0">{data.overview.totalDraftsCreated || 0}</h3>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
          <div className="card-body text-center p-4 text-white">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <h6 className="fw-bold opacity-90">Convertis</h6>
            <h3 className="fw-bold mb-0">{data.overview.draftsConverted || 0}</h3>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
          <div className="card-body text-center p-4 text-white">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
            <h6 className="fw-bold opacity-90">Directs</h6>
            <h3 className="fw-bold mb-0">{data.overview.directBookings || 0}</h3>
          </div>
        </div>
      </div>
      
      <div className="col-lg-3 col-md-6">
        <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
          <div className="card-body text-center p-4 text-white">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
            <h6 className="fw-bold opacity-90">Taux de Conversion</h6>
            <h3 className="fw-bold mb-0">{data.overview.conversionRate || 0}%</h3>
          </div>
        </div>
      </div>
      
      {/* Revenue Comparison */}
      <div className="col-md-6">
        <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px' }}>
          <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #11998e, #38ef7d)', borderRadius: '20px 20px 0 0' }}>
            <h5 className="mb-0 text-white fw-bold">💰 Revenus des Conversions</h5>
          </div>
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h2 className="text-success fw-bold">{formatNumber(data.overview.revenueFromConversions)}DT</h2>
            </div>
            <div className="p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Valeur moyenne par conversion</span>
                <span className="badge bg-success fs-6 px-3 py-1">{formatNumber(data.overview.avgConvertedValue)}DT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px' }}>
          <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #ff9a9e, #fecfef)', borderRadius: '20px 20px 0 0' }}>
            <h5 className="mb-0 text-white fw-bold">⚡ Revenus Directs</h5>
          </div>
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h2 className="text-warning fw-bold">{formatNumber(data.overview.revenueFromDirect)}DT</h2>
            </div>
            <div className="p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Valeur moyenne directe</span>
                <span className="badge bg-warning fs-6 px-3 py-1 text-dark">{formatNumber(data.overview.avgDirectValue)}DT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Insights */}
      {data.insights && (
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0' }}>
              <h4 className="mb-0 text-white fw-bold">💡 Insights & Recommandations</h4>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                    <div className="d-flex align-items-center">
                      <div className="me-3" style={{ fontSize: '2rem' }}>🎯</div>
                      <div>
                        <h6 className="mb-2 text-primary fw-bold">Efficacité de Conversion</h6>
                        <span className={`badge px-3 py-2 ${
                          data.insights.conversionEffectiveness === 'excellent' ? 'bg-success' :
                          data.insights.conversionEffectiveness === 'good' ? 'bg-warning' : 'bg-danger'
                        }`} style={{ fontSize: '0.9rem' }}>
                          {data.insights.conversionEffectiveness === 'excellent' ? '🌟 Excellente' :
                           data.insights.conversionEffectiveness === 'good' ? '👍 Bonne' : '⚠️ À améliorer'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                    <div className="d-flex align-items-center">
                      <div className="me-3" style={{ fontSize: '2rem' }}>💰</div>
                      <div>
                        <h6 className="mb-2 text-purple fw-bold">Comparaison des Revenus</h6>
                        <span className="text-muted">
                          {data.insights.revenueComparison === 'converted_higher' 
                            ? '🎯 Conversions plus rentables' 
                            : '⚡ Directs plus rentables'}
                        </span>
                      </div>
                    </div>
                  </div>
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
const ClientsTab = ({ data }) => {
  if (!data.newVsReturning && !data.vipClients) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)' }}>
            <div className="card-body text-center p-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
              <h4 className="text-success fw-bold mb-3">Aucune donnée de clients disponible</h4>
              <p className="text-muted mb-0">Les statistiques des clients seront affichées ici une fois disponibles.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* New vs Returning Clients */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px' }}>
          <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0' }}>
            <h5 className="mb-0 text-white fw-bold">👥 Nouveaux vs Fidèles</h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-6">
                <div className="text-center p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🆕</div>
                  <h3 className="text-white fw-bold mb-1">{data.newVsReturning?.newClients || 0}</h3>
                  <h6 className="text-white opacity-90 fw-bold">Nouveaux clients</h6>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💎</div>
                  <h3 className="text-white fw-bold mb-1">{data.newVsReturning?.returningClients || 0}</h3>
                  <h6 className="text-white opacity-90 fw-bold">Clients fidèles</h6>
                </div>
              </div>
            </div>
            
            {/* Additional metrics if available */}
            {data.newVsReturning && (
              <div className="mt-4 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                <div className="text-center">
                  <h6 className="text-primary fw-bold mb-2">Taux de Fidélisation</h6>
                  <div className="d-flex align-items-center justify-content-center">
                    <div className="progress me-3" style={{ width: '120px', height: '10px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ 
                          width: `${Math.round((data.newVsReturning.returningClients / (data.newVsReturning.newClients + data.newVsReturning.returningClients)) * 100)}%` 
                        }}>
                      </div>
                    </div>
                    <span className="fw-bold text-primary">
                      {Math.round((data.newVsReturning.returningClients / (data.newVsReturning.newClients + data.newVsReturning.returningClients)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* VIP Clients */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '20px' }}>
          <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #ffecd2, #fcb69f)', borderRadius: '20px 20px 0 0' }}>
            <h5 className="mb-0 text-dark fw-bold">🏆 Clients VIP</h5>
          </div>
          <div className="card-body p-4">
            {data.vipClients && data.vipClients.length > 0 ? (
              <div className="space-y-3">
                {data.vipClients.slice(0, 4).map((client, index) => (
                  <div key={index} className="p-3 rounded-3 mb-3" style={{ 
                    background: index === 0 
                      ? 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' 
                      : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' 
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" 
                               style={{ 
                                 width: '45px', 
                                 height: '45px', 
                                 background: index === 0 ? '#ff6b6b' : '#4ecdc4' 
                               }}>
                            {index === 0 ? '👑' : index < 3 ? '⭐' : '💎'}
                          </div>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1 text-dark">{client.name}</h6>
                          <small className="text-muted">{client.totalVisits} visites</small>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-dark px-3 py-2 fs-6">
                          {formatNumber(client.totalSpent)}DT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👑</div>
                <h6 className="text-muted mb-2">Aucun client VIP</h6>
                <p className="text-muted small mb-0">Les clients VIP apparaîtront ici selon leurs dépenses</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Client Growth Trend */}
      {data.clientGrowth && (
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
            <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #11998e, #38ef7d)', borderRadius: '20px 20px 0 0' }}>
              <h4 className="mb-0 text-white fw-bold">📈 Croissance de la Clientèle</h4>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="text-center p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                    <h5 className="text-success fw-bold mb-1">{data.clientGrowth.thisMonth || 0}</h5>
                    <span className="text-muted small">Ce mois</span>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                    <h5 className="text-warning fw-bold mb-1">{data.clientGrowth.lastMonth || 0}</h5>
                    <span className="text-muted small">Mois dernier</span>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                    <h5 className="text-primary fw-bold mb-1">
                      {data.clientGrowth.growthRate >= 0 ? '+' : ''}{data.clientGrowth.growthRate || 0}%
                    </h5>
                    <span className="text-muted small">Croissance</span>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                    <h5 className="text-purple fw-bold mb-1">{data.clientGrowth.totalActive || 0}</h5>
                    <span className="text-muted small">Total actifs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Client Insights */}
      {data.clientInsights && (
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0' }}>
              <h4 className="mb-0 text-white fw-bold">💡 Insights Clientèle</h4>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="p-4 rounded-3 text-center h-100" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎯</div>
                    <h6 className="text-success fw-bold mb-2">Segment Principal</h6>
                    <span className="badge bg-success px-3 py-2" style={{ fontSize: '0.9rem' }}>
                      {data.clientInsights.primarySegment || 'Clients réguliers'}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-4 rounded-3 text-center h-100" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰</div>
                    <h6 className="text-warning fw-bold mb-2">Valeur Moyenne</h6>
                    <span className="text-dark fw-bold">
                      {formatNumber(data.clientInsights.avgLifetimeValue)}DT
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-4 rounded-3 text-center h-100" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐</div>
                    <h6 className="text-purple fw-bold mb-2">Satisfaction</h6>
                    <span className="text-dark fw-bold">
                      {data.clientInsights.satisfactionScore || 'N/A'}/5 ⭐
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Services Tab Component
const ServicesTab = ({ data }) => {
  if (!data.popularServices || data.popularServices.length === 0) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
            <div className="card-body text-center p-5">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌟</div>
              <h4 className="text-purple fw-bold mb-3">Aucune donnée de services disponible</h4>
              <p className="text-muted mb-0">Les statistiques des services seront affichées ici une fois disponibles.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Top Services Grid */}
      <div className="col-12">
        <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
          <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0' }}>
            <h4 className="mb-0 text-white fw-bold">🌟 Services Populaires</h4>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              {data.popularServices.slice(0, 6).map((service, index) => (
                <div key={index} className="col-lg-4 col-md-6">
                  <div className="card border-0 shadow-sm h-100" style={{ 
                    borderRadius: '15px',
                    background: index < 3 
                      ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' 
                      : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' 
                  }}>
                    <div className="card-body p-4 text-white">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="fw-bold mb-1 opacity-90">#{index + 1}</h6>
                          <h5 className="fw-bold mb-2">{service.name}</h5>
                        </div>
                        <div className="text-end">
                          <div style={{ fontSize: '2rem' }}>
                            {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="text-center p-2 rounded-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <div className="small opacity-90">Réservations</div>
                            <div className="h6 fw-bold mb-0">{service.bookings}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center p-2 rounded-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <div className="small opacity-90">Revenus</div>
                            <div className="h6 fw-bold mb-0">{formatNumber(service.revenue)}DT</div>
                          </div>
                        </div>
                      </div>
                      
                      {service.avgRating && (
                        <div className="mt-3 text-center">
                          <span className="badge bg-light text-dark px-3 py-1">
                            ⭐ {service.avgRating}/5
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Performance Summary */}
      {data.serviceStats && (
        <div className="col-12">
          <div className="row g-4">
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body text-center p-4 text-white">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
                  <h6 className="fw-bold opacity-90">Total Services</h6>
                  <h3 className="fw-bold mb-0">{data.serviceStats.totalServices || 0}</h3>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <div className="card-body text-center p-4 text-white">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔥</div>
                  <h6 className="fw-bold opacity-90">Services Actifs</h6>
                  <h3 className="fw-bold mb-0">{data.serviceStats.activeServices || 0}</h3>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}>
                <div className="card-body text-center p-4 text-white">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
                  <h6 className="fw-bold opacity-90">Taux de Réservation</h6>
                  <h3 className="fw-bold mb-0">{data.serviceStats.bookingRate || 0}%</h3>
                </div>
              </div>
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="card border-0 shadow-lg h-100" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                <div className="card-body text-center p-4 text-white">
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰</div>
                  <h6 className="fw-bold opacity-90">Revenus Moyens</h6>
                  <h3 className="fw-bold mb-0">{formatNumber(data.serviceStats.avgRevenue)}DT</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Detailed Service Table */}
      <div className="col-12">
        <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
          <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #11998e, #38ef7d)', borderRadius: '20px 20px 0 0' }}>
            <h4 className="mb-0 text-white fw-bold">📋 Analyse Détaillée des Services</h4>
          </div>
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr className="border-bottom border-3">
                    <th className="fw-bold text-primary">Rang</th>
                    <th className="fw-bold text-primary">Service</th>
                    <th className="fw-bold text-primary text-center">Réservations</th>
                    <th className="fw-bold text-primary text-center">Revenus</th>
                    <th className="fw-bold text-primary text-center">Moy/Réservation</th>
                    <th className="fw-bold text-primary text-center">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.popularServices.map((service, index) => (
                    <tr key={index} className="border-bottom">
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="badge badge-pill me-2" style={{ 
                            background: index < 3 ? 'linear-gradient(45deg, #11998e, #38ef7d)' : 'linear-gradient(45deg, #667eea, #764ba2)',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem'
                          }}>
                            {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <h6 className="mb-1 fw-bold text-dark">{service.name}</h6>
                          {service.category && (
                            <small className="text-muted">{service.category}</small>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary px-3 py-2 fs-6">{service.bookings}</span>
                      </td>
                      <td className="text-center">
                        <span className="fw-bold text-success">{formatNumber(service.revenue)}DT</span>
                      </td>
                      <td className="text-center">
                        <span className="text-muted fw-bold">
                          {formatNumber(service.revenue / (service.bookings || 1))}DT
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="progress" style={{ height: '8px', width: '80px', margin: '0 auto' }}>
                          <div 
                            className="progress-bar bg-gradient" 
                            style={{ 
                              width: `${Math.min((service.bookings / Math.max(...data.popularServices.map(s => s.bookings))) * 100, 100)}%`,
                              background: index < 3 ? 'linear-gradient(45deg, #11998e, #38ef7d)' : 'linear-gradient(45deg, #ff9a9e, #fecfef)'
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
      {data.serviceInsights && (
        <div className="col-12">
          <div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(90deg, #ffecd2, #fcb69f)', borderRadius: '20px 20px 0 0' }}>
              <h4 className="mb-0 text-dark fw-bold">💡 Insights Services</h4>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="p-4 rounded-3 text-center h-100" style={{ background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏆</div>
                    <h6 className="text-success fw-bold mb-2">Service Star</h6>
                    <span className="text-dark fw-bold">
                      {data.serviceInsights.topPerformer || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-4 rounded-3 text-center h-100" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
                    <h6 className="text-warning fw-bold mb-2">Tendance</h6>
                    <span className="text-dark fw-bold">
                      {data.serviceInsights.trend === 'up' ? '📈 En hausse' : 
                       data.serviceInsights.trend === 'stable' ? '➡️ Stable' : '📉 En baisse'}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-4 rounded-3 text-center h-100" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💡</div>
                    <h6 className="text-purple fw-bold mb-2">Opportunité</h6>
                    <span className="text-dark fw-bold">
                      {data.serviceInsights.opportunity || 'Diversification'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatistics;
