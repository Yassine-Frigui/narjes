import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminCosts = () => {
  const [expenses, setExpenses] = useState({});
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Default preset categories with icons (fallback if DB is empty)
  const defaultCategories = [
    { name: 'Loyer', icon: '🏠' },
    { name: 'Salaires', icon: '👥' },
    { name: 'Factures', icon: '⚡' },
    { name: 'Fournitures', icon: '💄' },
    { name: 'Marketing', icon: '📱' },
    { name: 'Assurance', icon: '🛡️' },
    { name: 'Entretien', icon: '🔧' }
  ];

  useEffect(() => {
    loadCategories();
    loadCurrentMonthExpenses();
    loadMonthlyRevenue();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await adminAPI.getExpenseCategories();
      const dbCategories = response.data.categories || [];
      
      if (dbCategories.length === 0) {
        // If no categories in DB, show defaults but don't save them yet
        setCategories(defaultCategories.map(cat => ({ name: cat.name, icon: cat.icon })));
      } else {
        // Map DB categories with icons
        const categoriesWithIcons = dbCategories.map(categoryName => {
          const defaultCat = defaultCategories.find(def => 
            def.name.toLowerCase() === categoryName.toLowerCase()
          );
          return {
            name: categoryName,
            icon: defaultCat?.icon || '📋'
          };
        });
        setCategories(categoriesWithIcons);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to defaults if API fails
      setCategories(defaultCategories.map(cat => ({ name: cat.name, icon: cat.icon })));
    }
  };

  const loadCurrentMonthExpenses = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const response = await adminAPI.getMonthlyExpenses(currentMonth, currentYear);
      
      // Convert array to object with category name as key
      const expenseData = {};
      response.data.expenses?.forEach(expense => {
        expenseData[expense.category] = expense.amount;
      });
      
      setExpenses(expenseData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses({});
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
      setMonthlyRevenue(0);
    }
  };

  const updateExpenseAmount = async (categoryName, amount) => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      await adminAPI.updateExpense(categoryName, {
        month: currentMonth,
        year: currentYear,
        amount: parseFloat(amount) || 0
      });
      
      setExpenses(prev => ({
        ...prev,
        [categoryName]: parseFloat(amount) || 0
      }));
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const categoryName = newCategoryName.trim();
    
    // Add to local state immediately
    const newCategory = {
      name: categoryName,
      icon: '📋'
    };
    
    setCategories(prev => [...prev, newCategory]);
    
    // Initialize with 0 amount
    await updateExpenseAmount(categoryName, 0);
    
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const removeCategory = async (categoryName) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) return;
    
    try {
      await adminAPI.deleteExpenseCategory(categoryName);
      
      // Remove from local state
      setCategories(prev => prev.filter(cat => cat.name !== categoryName));
      
      // Remove from expenses
      const newExpenses = { ...expenses };
      delete newExpenses[categoryName];
      setExpenses(newExpenses);
      
      alert('Catégorie supprimée avec succès');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Erreur lors de la suppression de la catégorie');
    }
  };

  // Calculate totals
  const totalExpenses = categories.reduce((sum, cat) => {
    return sum + (parseFloat(expenses[cat.name]) || 0);
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
              {/* Dynamic Categories */}
              {categories.map((category, index) => (
                <div key={category.name} className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="d-flex flex-grow-1 me-3">
                      <button 
                        className="btn btn-outline-secondary flex-grow-1 text-start"
                        style={{ cursor: 'default', minWidth: '160px' }}
                        disabled
                      >
                        {category.icon} {category.name}
                      </button>
                      {categories.length > 3 && (
                        <button 
                          className="btn btn-sm btn-outline-danger ms-1"
                          onClick={() => removeCategory(category.name)}
                          title="Supprimer cette catégorie"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="input-group" style={{ maxWidth: '150px' }}>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={expenses[category.name] || ''}
                        onChange={(e) => updateExpenseAmount(category.name, e.target.value)}
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
                      onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                      autoFocus
                    />
                    <button 
                      className="btn btn-success me-1"
                      onClick={addCategory}
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
