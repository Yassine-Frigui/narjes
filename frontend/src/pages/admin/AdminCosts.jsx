import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminCosts = () => {
  // Expense management state
  const [expenses, setExpenses] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    name: '',
    amount: '',
    category: 'fixed',
    recurring: true,
    description: ''
  });

  // Influencer tracking state
  const [influencerLinks, setInfluencerLinks] = useState([]);
  const [showInfluencerForm, setShowInfluencerForm] = useState(false);
  const [influencerFormData, setInfluencerFormData] = useState({
    name: '',
    code: '',
    target_url: '',
    active: true
  });

  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('expenses'); // 'expenses' or 'influencers'

  // Preset expense categories
  const expenseCategories = [
    { id: 'rent', name: 'Loyer', icon: '🏠' },
    { id: 'salaries', name: 'Salaires', icon: '👥' },
    { id: 'utilities', name: 'Factures', icon: '⚡' },
    { id: 'supplies', name: 'Fournitures', icon: '💄' },
    { id: 'marketing', name: 'Marketing', icon: '📱' },
    { id: 'other', name: 'Autres', icon: '📋' }
  ];

  useEffect(() => {
    loadExpenses();
    loadInfluencerLinks();
    loadMonthlyRevenue();
  }, []);

  // Expense management functions
  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/expenses');
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyRevenue = async () => {
    try {
      const response = await adminAPI.get('/revenue/monthly');
      setMonthlyRevenue(response.data.revenue || 0);
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  };

  const createExpense = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminAPI.post('/expenses', expenseFormData);
      setExpenseFormData({ name: '', amount: '', category: 'fixed', recurring: true, description: '' });
      setShowExpenseForm(false);
      await loadExpenses();
      alert('Dépense ajoutée avec succès!');
    } catch (error) {
      console.error('Error creating expense:', error);
      alert(error.response?.data?.error || 'Erreur lors de la création de la dépense');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense?')) return;
    
    try {
      await adminAPI.delete(`/expenses/${expenseId}`);
      await loadExpenses();
      alert('Dépense supprimée avec succès!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Erreur lors de la suppression de la dépense');
    }
  };

  // Influencer tracking functions
  const loadInfluencerLinks = async () => {
    try {
      const response = await adminAPI.get('/influencer');
      setInfluencerLinks(response.data.links || []);
    } catch (error) {
      console.error('Error loading influencer links:', error);
    }
  };

  const createInfluencerLink = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminAPI.post('/influencer', influencerFormData);
      setInfluencerFormData({ name: '', code: '', target_url: '', active: true });
      setShowInfluencerForm(false);
      await loadInfluencerLinks();
      alert('Lien influenceur créé avec succès!');
    } catch (error) {
      console.error('Error creating influencer link:', error);
      alert(error.response?.data?.error || 'Erreur lors de la création du lien influenceur');
    } finally {
      setLoading(false);
    }
  };

  const generateShareableLink = (code) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : window.location.origin;
    return `${baseUrl}/r/${code}`;
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
  const netProfit = monthlyRevenue - totalExpenses;
  const profitMargin = monthlyRevenue > 0 ? ((netProfit / monthlyRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestion des Coûts & Marketing</h2>
        <div className="btn-group" role="group">
          <button 
            className={`btn ${selectedTab === 'expenses' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setSelectedTab('expenses')}
          >
            💰 Dépenses
          </button>
          <button 
            className={`btn ${selectedTab === 'influencers' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setSelectedTab('influencers')}
          >
            📱 Influenceurs
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6>Revenus Mensuels</h6>
              <h4>{monthlyRevenue.toFixed(2)} €</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h6>Dépenses Totales</h6>
              <h4>{totalExpenses.toFixed(2)} €</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className={`card ${netProfit >= 0 ? 'bg-info' : 'bg-warning'} text-white`}>
            <div className="card-body">
              <h6>Bénéfice Net</h6>
              <h4>{netProfit.toFixed(2)} €</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6>Marge Bénéficiaire</h6>
              <h4>{profitMargin}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Tab */}
      {selectedTab === 'expenses' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>📊 Gestion des Dépenses</h4>
            <button 
              className="btn btn-success"
              onClick={() => setShowExpenseForm(!showExpenseForm)}
            >
              {showExpenseForm ? 'Annuler' : '+ Nouvelle Dépense'}
            </button>
          </div>

          {/* Add Expense Form */}
          {showExpenseForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>Ajouter une Dépense</h5>
              </div>
              <div className="card-body">
                <form onSubmit={createExpense}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nom de la dépense *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={expenseFormData.name}
                          onChange={(e) => setExpenseFormData({...expenseFormData, name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Montant (€) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={expenseFormData.amount}
                          onChange={(e) => setExpenseFormData({...expenseFormData, amount: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-3">
                        <label className="form-label">Catégorie</label>
                        <select
                          className="form-control"
                          value={expenseFormData.category}
                          onChange={(e) => setExpenseFormData({...expenseFormData, category: e.target.value})}
                        >
                          {expenseCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <input
                          type="text"
                          className="form-control"
                          value={expenseFormData.description}
                          onChange={(e) => setExpenseFormData({...expenseFormData, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <div className="form-check mt-4">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={expenseFormData.recurring}
                            onChange={(e) => setExpenseFormData({...expenseFormData, recurring: e.target.checked})}
                          />
                          <label className="form-check-label">Dépense récurrente</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Création...' : 'Ajouter la Dépense'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Expenses List */}
          <div className="card">
            <div className="card-header">
              <h5>Liste des Dépenses</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">Chargement...</div>
              ) : expenses.length === 0 ? (
                <div className="text-center text-muted">Aucune dépense enregistrée</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Catégorie</th>
                        <th>Montant</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(expense => {
                        const category = expenseCategories.find(cat => cat.id === expense.category) || expenseCategories[5];
                        return (
                          <tr key={expense.id}>
                            <td>{expense.name}</td>
                            <td>{category.icon} {category.name}</td>
                            <td className="text-end">{parseFloat(expense.amount).toFixed(2)} €</td>
                            <td>
                              <span className={`badge ${expense.recurring ? 'bg-primary' : 'bg-secondary'}`}>
                                {expense.recurring ? 'Récurrente' : 'Ponctuelle'}
                              </span>
                            </td>
                            <td>{expense.description || '-'}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteExpense(expense.id)}
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Influencers Tab */}
      {selectedTab === 'influencers' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>📱 Liens Influenceurs</h4>
            <button 
              className="btn btn-success"
              onClick={() => setShowInfluencerForm(!showInfluencerForm)}
            >
              {showInfluencerForm ? 'Annuler' : '+ Nouveau Lien'}
            </button>
          </div>

          {/* Add Influencer Link Form */}
          {showInfluencerForm && (
            <div className="card mb-4">
              <div className="card-header">
                <h5>Créer un Lien Influenceur</h5>
              </div>
              <div className="card-body">
                <form onSubmit={createInfluencerLink}>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Nom de l'influenceur *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={influencerFormData.name}
                          onChange={(e) => setInfluencerFormData({...influencerFormData, name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Code du lien</label>
                        <input
                          type="text"
                          className="form-control"
                          value={influencerFormData.code}
                          onChange={(e) => setInfluencerFormData({...influencerFormData, code: e.target.value})}
                          placeholder="Laissez vide pour générer automatiquement"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">URL de destination</label>
                        <input
                          type="url"
                          className="form-control"
                          value={influencerFormData.target_url}
                          onChange={(e) => setInfluencerFormData({...influencerFormData, target_url: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Création...' : 'Créer le Lien'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Influencer Links List */}
          <div className="card">
            <div className="card-header">
              <h5>Liens Actifs</h5>
            </div>
            <div className="card-body">
              {influencerLinks.length === 0 ? (
                <div className="text-center text-muted">Aucun lien influenceur créé</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Code</th>
                        <th>Lien Partageable</th>
                        <th>Statut</th>
                        <th>Clics</th>
                        <th>Conversions</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {influencerLinks.map(link => (
                        <tr key={link.id}>
                          <td>{link.name}</td>
                          <td><code>{link.code}</code></td>
                          <td>
                            <div className="input-group input-group-sm">
                              <input 
                                type="text" 
                                className="form-control" 
                                value={generateShareableLink(link.code)}
                                readOnly
                              />
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => navigator.clipboard.writeText(generateShareableLink(link.code))}
                              >
                                Copier
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${link.active ? 'bg-success' : 'bg-secondary'}`}>
                              {link.active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td>{link.click_count || 0}</td>
                          <td>{link.conversion_count || 0}</td>
                          <td>
                            <button className="btn btn-sm btn-info">Voir Stats</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCosts;
