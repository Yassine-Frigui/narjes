import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBox,
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaSave,
  FaTimes

} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminInventaire = () => {
  const [inventaire, setInventaire] = useState([]);
  const [filteredInventaire, setFilteredInventaire] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    nom_produit: '',
    marque: '',
    type_produit: '',
    couleur: '',
    code_produit: '',
    quantite_stock: '',
    quantite_minimum: '',
    prix_achat: '',
    prix_vente: '',
    prix_unitaire: '',
    fournisseur: '',
    date_achat: '',
    date_expiration: '',
    emplacement: '',
    notes: '',
    actif: true
  });

  useEffect(() => {
    fetchInventaire();
  }, []);

  useEffect(() => {
    filterInventaire();
  }, [inventaire, searchTerm, categoryFilter]);

  const fetchInventaire = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventaire', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }
      
      const data = await response.json();
      const items = data.produits || data.items || data;
      setInventaire(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
      setInventaire([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInventaire = () => {
    let filtered = [...inventaire];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.nom_produit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code_produit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fournisseur?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'tous') {
      filtered = filtered.filter(item => item.type_produit === categoryFilter);
    }

    setFilteredInventaire(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await adminAPI.updateProduct(editingItem.id, formData);
      } else {
        await adminAPI.createProduct(formData);
      }
      
      setShowModal(false);
      setEditingItem(null);
      setIsEditing(false);
      resetForm();
      fetchInventaire();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nom: item.nom || '',
      marque: item.marque || '',
      categorie: item.categorie || '',
      prix_achat: item.prix_achat || '',
      prix_vente: item.prix_vente || '',
      quantite_stock: item.quantite_stock || '',
      quantite_minimum: item.quantite_minimum || '',
      fournisseur: item.fournisseur || '',
      description: item.description || '',
      actif: item.actif !== false
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await adminAPI.deleteProduct(id);
        fetchInventaire();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleStockAdjustment = async (id, quantite, type) => {
    try {
      await adminAPI.adjustStock(id, quantite, type, `Ajustement ${type}`);
      fetchInventaire();
    } catch (error) {
      console.error('Erreur lors de l\'ajustement du stock:', error);
      alert('Erreur lors de l\'ajustement du stock');
    }
  };

  const resetForm = () => {
    setFormData({
      nom_produit: '',
      marque: '',
      type_produit: '',
      couleur: '',
      code_produit: '',
      quantite_stock: '',
      quantite_minimum: '',
      prix_achat: '',
      prix_vente: '',
      prix_unitaire: '',
      fournisseur: '',
      date_achat: '',
      date_expiration: '',
      emplacement: '',
      notes: '',
      actif: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsEditing(false);
    setEditingItem(null);
    setShowModal(true);
  };

  const getStockStatus = (item) => {
    const stock = parseInt(item.quantite_stock);
    const minimum = parseInt(item.quantite_minimum);
    
    if (stock <= 0) return { status: 'empty', color: 'danger', text: 'Épuisé' };
    if (stock <= minimum) return { status: 'low', color: 'warning', text: 'Stock faible' };
    return { status: 'ok', color: 'success', text: 'En stock' };
  };

  const categories = [...new Set(inventaire.map(item => item.type_produit).filter(Boolean))];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-pink-500 mb-3" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted">Chargement de l'inventaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-inventaire">
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
              <FaBox className="text-primary me-2" />
              Gestion de l'Inventaire
            </h1>
            <p className="text-muted mb-0">
              Gérez les produits et stocks de votre salon
            </p>
          </div>
          <div className="col-auto">
            <motion.button
              className="btn btn-pink"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
            >
              <FaPlus className="me-2" />
              Nouvel article
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="filters-section mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Rechercher par nom, marque ou fournisseur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="tous">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <span className="badge bg-light text-dark fs-6 w-100 py-2">
                  {filteredInventaire.length} article(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Inventory Table */}
      <motion.div
        className="inventory-table"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-4 py-3">Article</th>
                    <th className="border-0 py-3">Catégorie</th>
                    <th className="border-0 py-3">Stock</th>
                    <th className="border-0 py-3">Prix</th>
                    <th className="border-0 py-3">Fournisseur</th>
                    <th className="border-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventaire.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <FaBox className="mb-3" size={48} />
                        <p className="mb-0">Aucun article trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventaire.map((item, index) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
                          className="border-bottom"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <strong className="text-dark">{item.nom}</strong>
                              <div className="small text-muted">{item.marque}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-secondary">{item.categorie}</span>
                          </td>
                          <td className="py-3">
                            <div>
                              <span className={`badge bg-${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                              <div className="small text-muted">
                                {item.quantite_stock} / min: {item.quantite_minimum}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div>
                              <span className="fw-bold text-success">
                                {item.prix_vente}DT
                              </span>
                              <div className="small text-muted">
                                Achat: {item.prix_achat}DT
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-muted">{item.fournisseur}</span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex gap-1">
                              <motion.button
                                className="btn btn-sm btn-outline-primary"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(item)}
                                title="Modifier"
                              >
                                <FaEdit size={12} />
                              </motion.button>
                              
                              <motion.button
                                className="btn btn-sm btn-outline-danger"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(item.id)}
                                title="Supprimer"
                              >
                                <FaTrash size={12} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de création/modification */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <FaBox className="text-primary me-2" />
                  {isEditing ? 'Modifier l\'article' : 'Nouvel article'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom de l'article *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Marque</label>
                      <input
                        type="text"
                        className="form-control"
                        name="marque"
                        value={formData.marque}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Catégorie</label>
                      <input
                        type="text"
                        className="form-control"
                        name="categorie"
                        value={formData.categorie}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fournisseur</label>
                      <input
                        type="text"
                        className="form-control"
                        name="fournisseur"
                        value={formData.fournisseur}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prix d'achat (DT)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="prix_achat"
                        value={formData.prix_achat}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prix de vente (DT)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="prix_vente"
                        value={formData.prix_vente}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Quantité en stock</label>
                      <input
                        type="number"
                        className="form-control"
                        name="quantite_stock"
                        value={formData.quantite_stock}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Quantité minimum</label>
                      <input
                        type="number"
                        className="form-control"
                        name="quantite_minimum"
                        value={formData.quantite_minimum}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="actif"
                          checked={formData.actif}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">
                          Article actif
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    <FaTimes className="me-2" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-pink"
                  >
                    <FaSave className="me-2" />
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventaire;
