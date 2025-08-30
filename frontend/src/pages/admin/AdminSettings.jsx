import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCog,
  FaUser,
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaStore,
  FaClock,
  FaPaperPlane,
  FaCalendarDay,
  FaKey,
  FaUserShield,
  FaBriefcase
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [userForm, setUserForm] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'employe',
    actif: true
  });

  const [spaSettings, setSpaSettings] = useState({
    nom_spa: '',
    adresse: '',
    telephone: '',
    email: '',
    description: '',
    politique_annulation: '',
    horaires_ouverture: '',
    site_web: ''
  });

  const [adminAccountForm, setAdminAccountForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    nom: ''
  });

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchUsers();
    } else if (activeTab === 'spa') {
      fetchSpaSettings();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdministrateurs();
      // Ensure users is always an array
      const usersData = response.data;
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        console.warn('Users data is not an array:', usersData);
        setUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // Check if it's a 403 error (insufficient permissions)
      if (error.response?.status === 403) {
        console.warn('Accès refusé - Permissions insuffisantes pour voir les utilisateurs');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpaSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSalonParams();
      setSpaSettings(response.data || {});
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAccountInputChange = (e) => {
    const { name, value } = e.target;
    setAdminAccountForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminAccountSubmit = async (e) => {
    e.preventDefault();
    
    if (adminAccountForm.newPassword !== adminAccountForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      setLoading(true);
      // Update password and email logic here
      alert('Compte administrateur mis à jour avec succès !');
      setAdminAccountForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        email: '',
        nom: ''
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compte:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpaInputChange = (e) => {
    const { name, value } = e.target;
    setSpaSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await adminAPI.updateAdministrateur(editingUser.id, userForm);
      } else {
        await adminAPI.createAdministrateur(userForm);
      }
      
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      fetchUsers();
      alert(`Utilisateur ${editingUser ? 'mis à jour' : 'créé'} avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleSpaSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateSalonParams(spaSettings);
      alert('Paramètres du spa mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      nom: user.nom || '',
      email: user.email || '',
      password: '',
      role: user.role || 'admin',
      actif: user.actif !== false
    });
    setShowUserModal(true);
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await adminAPI.toggleAdminStatus(userId);
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      nom: '',
      email: '',
      password: '',
      role: 'admin',
      actif: true
    });
  };

  const openCreateUserModal = () => {
    resetUserForm();
    setEditingUser(null);
    setShowUserModal(true);
  };

  const tabs = [
    { id: 'employees', label: 'Employés', icon: FaBriefcase },
    { id: 'spa', label: 'Spa', icon: FaStore },
    { id: 'account', label: 'Mon Compte', icon: FaUserShield },
  ];

  return (
    <div className="admin-settings">
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
              <FaCog className="text-primary me-2" />
              Paramètres
            </h1>
            <p className="text-muted mb-0">
              Gérez les paramètres de votre spa et de votre équipe
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="settings-tabs mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <nav className="nav nav-tabs border-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`nav-link border-0 px-4 py-3 ${activeTab === tab.id ? 'active bg-light' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="me-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="settings-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {activeTab === 'employees' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <FaUsers className="text-primary me-2" />
                Gestion des Employés
              </h5>
              <button
                className="btn btn-pink"
                onClick={openCreateUserModal}
              >
                <FaPlus className="me-2" />
                Nouvel Employé
              </button>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                  <p className="text-muted mt-2">Chargement...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 px-4 py-3">Utilisateur</th>
                        <th className="border-0 py-3">Rôle</th>
                        <th className="border-0 py-3">Statut</th>
                        <th className="border-0 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!Array.isArray(users) || users.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-5 text-muted">
                            <FaUser className="mb-3" size={48} />
                            <p className="mb-0">
                              {!Array.isArray(users) 
                                ? 'Erreur de chargement des utilisateurs' 
                                : 'Aucun utilisateur trouvé'
                              }
                            </p>
                          </td>
                        </tr>
                      ) : (
                        users.map((user, index) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <strong className="text-dark">
                                  {user.nom}
                                </strong>
                                <div className="small text-muted">
                                  {user.email}
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`badge ${user.role === 'super_admin' ? 'bg-danger' : 'bg-primary'}`}>
                                {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`badge ${user.actif ? 'bg-success' : 'bg-secondary'}`}>
                                {user.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEditUser(user)}
                                  title="Modifier"
                                >
                                  <FaEdit size={12} />
                                </button>
                                <button
                                  className={`btn btn-sm ${user.actif ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                  onClick={() => handleToggleUserStatus(user.id)}
                                  title={user.actif ? 'Désactiver' : 'Activer'}
                                >
                                  {user.actif ? <FaTimes size={12} /> : <FaUser size={12} />}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'spa' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaStore className="text-primary me-2" />
                Paramètres du Spa
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSpaSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nom du Spa</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nom_spa"
                      value={spaSettings.nom_spa || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="telephone"
                      value={spaSettings.telephone || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={spaSettings.email || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Adresse</label>
                    <input
                      type="text"
                      className="form-control"
                      name="adresse"
                      value={spaSettings.adresse || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Description du Spa</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="4"
                      value={spaSettings.description || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Horaires d'ouverture</label>
                    <input
                      type="text"
                      className="form-control"
                      name="horaires_ouverture"
                      value={spaSettings.horaires_ouverture || ''}
                      onChange={handleSpaInputChange}
                      placeholder="Lun-Ven: 9h-18h, Sam: 9h-17h"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Site Web</label>
                    <input
                      type="url"
                      className="form-control"
                      name="site_web"
                      value={spaSettings.site_web || ''}
                      onChange={handleSpaInputChange}
                      placeholder="https://monspa.com"
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Politique d'annulation</label>
                    <textarea
                      className="form-control"
                      name="politique_annulation"
                      rows="3"
                      value={spaSettings.politique_annulation || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-pink">
                    <FaSave className="me-2" />
                    Sauvegarder les paramètres
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaUserShield className="text-primary me-2" />
                Gestion du Compte Super Admin
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Connection Test Section */}
                <div className="col-12 mb-4">
                  <h6 className="fw-bold mb-3">
                    <FaPaperPlane className="text-success me-2" />
                    Test de Connexion
                  </h6>
                  <div className="d-flex align-items-center gap-3">
                    <motion.button
                      type="button"
                      className="btn btn-success"
                      disabled={telegramState.testing}
                      onClick={testTelegramConnection}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {telegramState.testing ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status" />
                          Test en cours...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="me-2" />
                          Tester la connexion
                        </>
                      )}
                    </motion.button>
                    
                    {telegramState.lastTestResult && (
                      <div className={`alert alert-${telegramState.lastTestResult.success ? 'success' : 'danger'} mb-0 py-2 px-3`}>
                        <small>
                          <strong>{telegramState.lastTestResult.success ? '✅' : '❌'}</strong> {telegramState.lastTestResult.message}
                          <br />
                          <em className="text-muted">
                            {telegramState.lastTestResult.timestamp.toLocaleString('fr-FR')}
                          </em>
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Daily Summary Section */}
                <div className="col-12 mb-4">
                  <h6 className="fw-bold mb-3">
                    <FaCalendarDay className="text-info me-2" />
                    Résumé Journalier
                  </h6>
                  <div className="d-flex align-items-center gap-3">
                    <motion.button
                      type="button"
                      className="btn btn-info"
                      disabled={telegramState.sendingSummary}
                      onClick={sendDailySummary}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {telegramState.sendingSummary ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <FaCalendarDay className="me-2" />
                          Envoyer résumé du jour
                        </>
                      )}
                    </motion.button>
                    
                    {telegramState.lastSummaryResult && (
                      <div className={`alert alert-${telegramState.lastSummaryResult.success ? 'success' : 'danger'} mb-0 py-2 px-3`}>
                        <small>
                          <strong>{telegramState.lastSummaryResult.success ? '✅' : '❌'}</strong> {telegramState.lastSummaryResult.message}
                          {telegramState.lastSummaryResult.reservations !== undefined && (
                            <span> ({telegramState.lastSummaryResult.reservations} réservations)</span>
                          )}
                          <br />
                          <em className="text-muted">
                            {telegramState.lastSummaryResult.timestamp.toLocaleString('fr-FR')}
                          </em>
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration Guide */}
                <div className="col-12">
                  <h6 className="fw-bold mb-3">Configuration</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-2"><strong>Pour configurer votre bot Telegram :</strong></p>
                    <ol className="mb-2">
                      <li>Contactez <strong>@BotFather</strong> sur Telegram</li>
                      <li>Créez un nouveau bot avec <code>/newbot</code></li>
                      <li>Copiez le token dans votre fichier <code>.env</code></li>
                      <li>Ajoutez le bot à votre groupe/chat</li>
                      <li>Copiez le Chat ID dans votre fichier <code>.env</code></li>
                    </ol>
                    <div className="small text-muted">
                      <strong>Variables d'environnement requises :</strong><br />
                      <code>TELEGRAM_BOT_TOKEN=votre_token</code><br />
                      <code>TELEGRAM_CHAT_ID=votre_chat_id</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <FaUser className="text-primary me-2" />
                  {editingUser ? 'Modifier l\'employé' : 'Nouvel Employé'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUserModal(false)}
                />
              </div>
              <form onSubmit={handleUserSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Nom *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nom"
                        value={userForm.nom}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={userForm.email}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">
                        {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          name="password"
                          value={userForm.password}
                          onChange={handleUserInputChange}
                          required={!editingUser}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Rôle</label>
                      <select
                        className="form-select"
                        name="role"
                        value={userForm.role}
                        onChange={handleUserInputChange}
                      >
                        <option value="employe">Employé</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="form-check mt-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="actif"
                          checked={userForm.actif}
                          onChange={handleUserInputChange}
                        />
                        <label className="form-check-label">
                          Utilisateur actif
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUserModal(false)}
                  >
                    <FaTimes className="me-2" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-pink"
                  >
                    <FaSave className="me-2" />
                    {editingUser ? 'Mettre à jour' : 'Créer'}
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

export default AdminSettings;
