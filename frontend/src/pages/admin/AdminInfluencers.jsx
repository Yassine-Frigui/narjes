import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminInfluencers = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    target_url: '',
    active: true
  });
  const [selectedLink, setSelectedLink] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/influencer');
      setLinks(response.data.links || []);
    } catch (error) {
      console.error('Error loading influencer links:', error);
      alert('Erreur lors du chargement des liens influenceurs');
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminAPI.post('/influencer', formData);
      setFormData({ name: '', code: '', target_url: '', active: true });
      setShowCreateForm(false);
      await loadLinks();
      alert('Lien créé avec succès!');
    } catch (error) {
      console.error('Error creating link:', error);
      alert(error.response?.data?.error || 'Erreur lors de la création du lien');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (linkId, currentActive) => {
    try {
      await adminAPI.put(`/influencer/${linkId}`, { active: !currentActive });
      await loadLinks();
    } catch (error) {
      console.error('Error updating link:', error);
      alert('Erreur lors de la mise à jour du lien');
    }
  };

  const loadStats = async (linkId) => {
    try {
      const response = await adminAPI.get(`/influencer/${linkId}/stats`);
      setStats(response.data.stats);
      setSelectedLink(response.data.link);
    } catch (error) {
      console.error('Error loading stats:', error);
      alert('Erreur lors du chargement des statistiques');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Lien copié dans le presse-papier!');
    });
  };

  const generateShareableLink = (code) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : window.location.origin;
    return `${baseUrl}/r/${code}`;
  };

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestion des Influenceurs</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Annuler' : '+ Nouveau Lien'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Créer un nouveau lien influenceur</h5>
          </div>
          <div className="card-body">
            <form onSubmit={createLink}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Nom de l'influenceur *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Code personnalisé (optionnel)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      placeholder="Laissez vide pour auto-génération"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">URL de redirection (optionnel)</label>
                <input
                  type="url"
                  className="form-control"
                  value={formData.target_url}
                  onChange={(e) => setFormData({...formData, target_url: e.target.value})}
                  placeholder="Par défaut: page d'accueil"
                />
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  />
                  <label className="form-check-label">Lien actif</label>
                </div>
              </div>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Création...' : 'Créer le lien'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Links Table */}
      <div className="card">
        <div className="card-header">
          <h5>Liens Influenceurs ({links.length})</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Code</th>
                    <th>Lien</th>
                    <th>Clics</th>
                    <th>Conversions</th>
                    <th>Taux</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id}>
                      <td>{link.name}</td>
                      <td>
                        <code>{link.code}</code>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <small className="text-muted me-2">
                            {generateShareableLink(link.code).substring(0, 40)}...
                          </small>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => copyToClipboard(generateShareableLink(link.code))}
                            title="Copier le lien"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info">{link.clicks}</span>
                      </td>
                      <td>
                        <span className="badge bg-success">{link.conversions}</span>
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {link.conversion_rate}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${link.active ? 'bg-success' : 'bg-secondary'}`}>
                          {link.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => loadStats(link.id)}
                            title="Voir les statistiques"
                          >
                            📊
                          </button>
                          <button
                            className={`btn ${link.active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => toggleActive(link.id, link.active)}
                            title={link.active ? 'Désactiver' : 'Activer'}
                          >
                            {link.active ? '⏸️' : '▶️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {links.length === 0 && (
                <div className="text-center p-4 text-muted">
                  Aucun lien influenceur créé pour le moment.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Modal */}
      {selectedLink && stats && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Statistiques - {selectedLink.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {setSelectedLink(null); setStats(null);}}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title">{stats.total_clicks}</h5>
                        <p className="card-text">Clics totaux</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title">{stats.total_conversions}</h5>
                        <p className="card-text">Conversions</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title">{stats.conversion_rate}%</h5>
                        <p className="card-text">Taux de conversion</p>
                      </div>
                    </div>
                  </div>
                </div>

                <h6>Événements récents</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Date</th>
                        <th>IP</th>
                        <th>Réservation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_events.slice(0, 10).map((event, index) => (
                        <tr key={index}>
                          <td>
                            <span className={`badge ${event.event_type === 'click' ? 'bg-info' : 'bg-success'}`}>
                              {event.event_type === 'click' ? 'Clic' : 'Conversion'}
                            </span>
                          </td>
                          <td>
                            <small>{new Date(event.created_at).toLocaleString()}</small>
                          </td>
                          <td>
                            <small className="text-muted">{event.ip || 'N/A'}</small>
                          </td>
                          <td>
                            {event.reservation_id && (
                              <small>#{event.reservation_id}</small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {setSelectedLink(null); setStats(null);}}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInfluencers;
