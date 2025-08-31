import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminCosts = () => {
  const [expenses, setExpenses] = useState({});
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Preset expense categories - buttons that can't be edited
  const presetCategories = [
    { id: 'rent', name: 'Loyer', icon: '🏠' },
    { id: 'salaries', name: 'Salaires', icon: '👥' },
    { id: 'utilities', name: 'Factures', icon: '⚡' },
    { id: 'supplies', name: 'Fournitures', icon: '💄' },
    { id: 'marketing', name: 'Marketing', icon: '📱' },
    { id: 'insurance', name: 'Assurance', icon: '🛡️' },
    { id: 'maintenance', name: 'Entretien', icon: '🔧' }
  ];

  useEffect(() => {
    loadCurrentMonthExpenses();
    loadMonthlyRevenue();
    loadCustomCategories();
  }, []);

  const loadCurrentMonthExpenses = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const response = await adminAPI.getMonthlyExpenses(currentMonth, currentYear);
      
      // Convert array to object with category as key
      const expenseData = {};
      response.data.expenses?.forEach(expense => {
        expenseData[expense.category] = expense.amount;
      });
      
      setExpenses(expenseData);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyRevenue = async () => {
    try {
      const response = await adminAPI.getMonthlyRevenue();
      setMonthlyRevenue(response.data.revenue || 0);
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  };

  const loadCustomCategories = async () => {
    // For now, we'll store custom categories in state
    // Later this could be saved to database
    const saved = localStorage.getItem('customExpenseCategories');
    if (saved) {
      setCustomCategories(JSON.parse(saved));
    }
  };

  const updateExpenseAmount = async (category, amount) => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      await adminAPI.updateExpense(category, {
        month: currentMonth,
        year: currentYear,
        amount: parseFloat(amount) || 0
      });
      
      setExpenses(prev => ({
        ...prev,
        [category]: parseFloat(amount) || 0
      }));
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      icon: '📋'
    };
    
    const updated = [...customCategories, newCategory];
    setCustomCategories(updated);
    localStorage.setItem('customExpenseCategories', JSON.stringify(updated));
    
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const removeCustomCategory = (categoryId) => {
    const updated = customCategories.filter(cat => cat.id !== categoryId);
    setCustomCategories(updated);
    localStorage.setItem('customExpenseCategories', JSON.stringify(updated));
    
    // Remove from expenses too
    const newExpenses = { ...expenses };
    delete newExpenses[categoryId];
    setExpenses(newExpenses);
  };

  // Calculate totals
  const allCategories = [...presetCategories, ...customCategories];
  const totalExpenses = allCategories.reduce((sum, cat) => {
    return sum + (parseFloat(expenses[cat.id]) || 0);
  }, 0);
  const netProfit = monthlyRevenue - totalExpenses;
  const profitMargin = monthlyRevenue > 0 ? ((netProfit / monthlyRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>💰 Gestion des Coûts</h2>
        <div className="text-muted">
          {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
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
              <h6>Marge</h6>
              <h4>{profitMargin}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Management */}
      <div className="card">
        <div className="card-header">
          <h5>📊 Dépenses Mensuelles</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">Chargement...</div>
          ) : (
            <div className="row">
              {/* Preset Categories */}
              {presetCategories.map(category => (
                <div key={category.id} className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-outline-secondary flex-grow-1 text-start me-3"
                      style={{ cursor: 'default', minWidth: '200px' }}
                      disabled
                    >
                      {category.icon} {category.name}
                    </button>
                    <div className="input-group" style={{ maxWidth: '150px' }}>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={expenses[category.id] || ''}
                        onChange={(e) => updateExpenseAmount(category.id, e.target.value)}
                        placeholder="0.00"
                      />
                      <span className="input-group-text">€</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Custom Categories */}
              {customCategories.map(category => (
                <div key={category.id} className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="d-flex flex-grow-1 me-3">
                      <button 
                        className="btn btn-outline-info flex-grow-1 text-start"
                        style={{ cursor: 'default', minWidth: '160px' }}
                        disabled
                      >
                        {category.icon} {category.name}
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger ms-1"
                        onClick={() => removeCustomCategory(category.id)}
                        title="Supprimer cette catégorie"
                      >
                        ×
                      </button>
                    </div>
                    <div className="input-group" style={{ maxWidth: '150px' }}>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={expenses[category.id] || ''}
                        onChange={(e) => updateExpenseAmount(category.id, e.target.value)}
                        placeholder="0.00"
                      />
                      <span className="input-group-text">€</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Category Button */}
              <div className="col-md-6 mb-3">
                {showAddCategory ? (
                  <div className="d-flex align-items-center">
                    <input
                      type="text"
                      className="form-control me-2"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nom de la nouvelle catégorie"
                      onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
                      autoFocus
                    />
                    <button 
                      className="btn btn-success me-1"
                      onClick={addCustomCategory}
                    >
                      ✓
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn btn-success w-100"
                    onClick={() => setShowAddCategory(true)}
                  >
                    + Ajouter une catégorie
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCosts;
