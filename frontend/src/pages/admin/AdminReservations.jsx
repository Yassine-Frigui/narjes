import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt,
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaCheck,
  FaTimes,
  FaClock,
  FaCalendarCheck,
  FaSave,
  FaUser,
  FaClipboardCheck
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [dateFilter, setDateFilter] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editFormData, setEditFormData] = useState({
    statut: '',
    service_id: '',
    client_nom: '',
    client_prenom: '',
    client_telephone: '',
    client_email: '',
    notes_admin: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchReservations();
    fetchServices();
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm]);

  const fetchServices = async () => {
    try {
      const response = await adminAPI.getServicesAdmin();
      setServices(response.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on filters
      const filters = {};
      
      if (dateFilter && dateFilter !== 'tous') {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);
        
        switch (dateFilter) {
          case 'aujourd_hui':
            filters.date = today;
            break;
          case 'ce_mois':
            filters.date_debut = `${thisMonth}-01`;
            filters.date_fin = `${thisMonth}-31`;
            break;
          case 'cette_semaine':
            const startOfWeek = new Date();
            const endOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
            filters.date_debut = startOfWeek.toISOString().split('T')[0];
            filters.date_fin = endOfWeek.toISOString().split('T')[0];
            break;
        }
      }
      
      if (statusFilter && statusFilter !== 'tous') {
        filters.statut = statusFilter;
      }
      
      const response = await adminAPI.getReservations(filters);
      const data = response.data;
      
      // Transform data to match frontend expectations
      const transformedReservations = data.map(reservation => ({
        id: reservation.id,
        client: {
          nom: reservation.client_nom?.split(' ').pop() || '',
          prenom: reservation.client_nom?.split(' ')[0] || '',
          telephone: reservation.client_telephone || '',
          email: reservation.client_email || ''
        },
        service: {
          nom: reservation.service_nom,
          duree: reservation.service_duree,
          prix: reservation.prix_final
        },
        date_reservation: reservation.date_reservation,
        heure_reservation: reservation.heure_debut,
        statut: reservation.statut,
        notes: reservation.notes_client || '',
        is_draft: reservation.is_draft || reservation.statut === 'draft',
        session_id: reservation.session_id,
        created_at: reservation.date_creation
      }));
      
      setReservations(transformedReservations);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Only filter by search term since status and date filters are handled on backend
    if (searchTerm) {
      filtered = filtered.filter(res => 
        res.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.service.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.client.telephone.includes(searchTerm)
      );
    }

    setFilteredReservations(filtered);
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      'draft': { bg: 'light text-dark', text: 'Brouillon', icon: FaEdit },
      'en_attente': { bg: 'warning', text: 'En attente', icon: FaClock },
      'confirmee': { bg: 'success', text: 'Confirmée', icon: FaCheck },
      'en_cours': { bg: 'primary', text: 'En cours', icon: FaClipboardCheck },
      'terminee': { bg: 'info', text: 'Terminée', icon: FaCalendarCheck },
      'annulee': { bg: 'danger', text: 'Annulée', icon: FaTimes },
      'absent': { bg: 'secondary', text: 'Absent', icon: FaUser }
    };
    
    const config = statusConfig[statut] || { bg: 'secondary', text: 'Inconnu', icon: FaEdit };
    const IconComponent = config.icon;
    
    return (
      <span className={`badge bg-${config.bg} d-flex align-items-center gap-1`}>
        <IconComponent size={12} />
        {config.text}
      </span>
    );
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      setIsUpdating(true);
      await adminAPI.updateReservationStatus(reservationId, newStatus);
      
      // Update local state
      setReservations(prev => prev.map(res => 
        res.id === reservationId ? { ...res, statut: newStatus } : res
      ));
      
      // Show success message
      alert('Statut mis à jour avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (reservation) => {
    setSelectedReservation(reservation);
    setEditFormData({
      statut: reservation.statut,
      service_id: reservation.service_id || '',
      client_nom: reservation.client.nom,
      client_prenom: reservation.client.prenom,
      client_telephone: reservation.client.telephone,
      client_email: reservation.client.email,
      notes_admin: reservation.notes_admin || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReservation) return;

    try {
      setIsUpdating(true);
      
      // Update reservation status and details
      await adminAPI.updateReservationStatus(
        selectedReservation.id, 
        editFormData.statut, 
        editFormData.notes_admin
      );

      // Update client details and service if provided
      const updateData = {};
      if (editFormData.client_nom) updateData.client_nom = editFormData.client_nom;
      if (editFormData.client_prenom) updateData.client_prenom = editFormData.client_prenom;
      if (editFormData.client_telephone) updateData.client_telephone = editFormData.client_telephone;
      if (editFormData.client_email) updateData.client_email = editFormData.client_email;
      if (editFormData.service_id && editFormData.service_id !== selectedReservation.service_id) {
        updateData.service_id = editFormData.service_id;
      }
      
      if (Object.keys(updateData).length > 0) {
        await adminAPI.updateReservation(selectedReservation.id, updateData);
      }

      // Refresh reservations
      await fetchReservations();
      
      // Close modal and show success
      setShowEditModal(false);
      alert('Réservation mise à jour avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de la réservation');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConvertDraft = async (reservationId) => {
    try {
      const response = await adminAPI.convertDraftReservation(reservationId);
      if (response.data) {
        // Refresh the reservations list
        fetchReservations();
        // Show success message
        alert('Brouillon converti en réservation confirmée !');
      }
    } catch (error) {
      console.error('Erreur lors de la conversion du brouillon:', error);
      alert('Erreur lors de la conversion du brouillon');
    }
  };

  const handleDelete = (reservationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      setReservations(prev => prev.filter(res => res.id !== reservationId));
    }
  };

  const openModal = (reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-pink-500 mb-3" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reservations">
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
              <FaCalendarAlt className="text-primary me-2" />
              Réservations
            </h1>
            <p className="text-muted mb-0">
              Gérez les rendez-vous de votre salon
            </p>
          </div>
          <div className="col-auto">
            <motion.button
              className="btn btn-pink"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus className="me-2" />
              Nouvelle réservation
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
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Rechercher par nom ou service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="draft">Brouillons</option>
                  <option value="en_attente">En attente</option>
                  <option value="confirmee">Confirmée</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                  <option value="annulee">Annulée</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="tous">Toutes les dates</option>
                  <option value="aujourd_hui">Aujourd'hui</option>
                  <option value="demain">Demain</option>
                  <option value="cette_semaine">Cette semaine</option>
                </select>
              </div>
              <div className="col-md-2">
                <span className="badge bg-light text-dark fs-6 w-100 py-2">
                  {filteredReservations.length} résultat(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reservations Table */}
      <motion.div
        className="reservations-table"
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
                    <th className="border-0 px-4 py-3">Cliente</th>
                    <th className="border-0 py-3">Service</th>
                    <th className="border-0 py-3">Date & Heure</th>
                    <th className="border-0 py-3">Statut</th>
                    <th className="border-0 py-3">Prix</th>
                    <th className="border-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <FaCalendarAlt className="mb-3" size={48} />
                        <p className="mb-0">Aucune réservation trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((reservation, index) => (
                      <motion.tr
                        key={reservation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
                        className="border-bottom"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <strong className="text-dark">
                                {reservation.is_draft ? (
                                  <span className="badge bg-warning text-dark me-2">DRAFT</span>
                                ) : null}
                                {reservation.client.prenom} {reservation.client.nom}
                              </strong>
                              <motion.button
                                className="btn btn-outline-primary"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => openModal(reservation)}
                                title="Voir détails"
                                style={{ 
                                  fontSize: '10px', 
                                  padding: '2px 6px',
                                  minWidth: 'auto',
                                  height: '20px'
                                }}
                              >
                                <FaEye size={10} />
                              </motion.button>
                            </div>
                            <div className="small text-muted">
                              {reservation.client.telephone}
                            </div>
                            <div className="small text-muted">
                              {reservation.client.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <span className="fw-semibold">{reservation.service.nom}</span>
                            <div className="small text-muted">
                              <FaClock className="me-1" size={12} />
                              {reservation.service.duree} min
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <span className="fw-semibold">
                              {new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}
                            </span>
                            <div className="small text-muted">
                              {reservation.heure_reservation}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          {getStatusBadge(reservation.statut)}
                        </td>
                        <td className="py-3">
                          <span className="fw-bold text-success">
                            {reservation.service.prix}DT
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex gap-1 flex-wrap">
                            <motion.button
                              className="btn btn-sm btn-outline-primary"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openModal(reservation)}
                              title="Voir détails"
                            >
                              <FaEye size={12} />
                            </motion.button>

                            <motion.button
                              className="btn btn-sm btn-outline-warning"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openEditModal(reservation)}
                              title="Modifier statut et détails"
                              disabled={isUpdating}
                            >
                              <FaEdit size={12} />
                            </motion.button>
                            
                            {reservation.is_draft ? (
                              <motion.button
                                className="btn btn-sm btn-outline-success"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleConvertDraft(reservation.id)}
                                title="Convertir en réservation"
                                disabled={isUpdating}
                              >
                                <FaCalendarCheck size={12} />
                              </motion.button>
                            ) : (
                              <>
                                {reservation.statut === 'en_attente' && (
                                  <motion.button
                                    className="btn btn-sm btn-outline-success"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(reservation.id, 'confirmee')}
                                    title="Confirmer"
                                    disabled={isUpdating}
                                  >
                                    <FaCheck size={12} />
                                  </motion.button>
                                )}
                                
                                {['en_attente', 'confirmee'].includes(reservation.statut) && (
                                  <motion.button
                                    className="btn btn-sm btn-outline-danger"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(reservation.id, 'annulee')}
                                    title="Annuler"
                                    disabled={isUpdating}
                                  >
                                    <FaTimes size={12} />
                                  </motion.button>
                                )}
                              </>
                            )}
                            
                            <motion.button
                              className="btn btn-sm btn-outline-info"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Appeler"
                            >
                              <FaPhone size={12} />
                            </motion.button>
                            
                            <motion.button
                              className="btn btn-sm btn-outline-secondary"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(reservation.id)}
                              title="Supprimer"
                              disabled={isUpdating}
                            >
                              <FaTrash size={12} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de détails */}
      {showModal && selectedReservation && (
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
                  <FaCalendarCheck className="text-primary me-2" />
                  Détails de la réservation #{selectedReservation.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Informations client</h6>
                    <div className="mb-2">
                      <strong>Nom:</strong> {selectedReservation.client.prenom} {selectedReservation.client.nom}
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong> {selectedReservation.client.email}
                    </div>
                    <div className="mb-3">
                      <strong>Téléphone:</strong> {selectedReservation.client.telephone}
                    </div>
                    
                    <h6 className="fw-bold text-primary mb-3">Service</h6>
                    <div className="mb-2">
                      <strong>Service:</strong> {selectedReservation.service.nom}
                    </div>
                    <div className="mb-2">
                      <strong>Durée:</strong> {selectedReservation.service.duree} minutes
                    </div>
                    <div className="mb-3">
                      <strong>Prix:</strong> {selectedReservation.service.prix}DT
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Rendez-vous</h6>
                    <div className="mb-2">
                      <strong>Date:</strong> {new Date(selectedReservation.date_reservation).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="mb-2">
                      <strong>Heure:</strong> {selectedReservation.heure_reservation}
                    </div>
                    <div className="mb-2">
                      <strong>Statut:</strong> {getStatusBadge(selectedReservation.statut)}
                    </div>
                    <div className="mb-3">
                      <strong>Réservé le:</strong> {new Date(selectedReservation.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    
                    {selectedReservation.notes && (
                      <>
                        <h6 className="fw-bold text-primary mb-3">Notes client</h6>
                        <div className="bg-light p-3 rounded mb-3">
                          {selectedReservation.notes}
                        </div>
                      </>
                    )}
                    
                    {selectedReservation.notes_admin && (
                      <>
                        <h6 className="fw-bold text-warning mb-3">Notes administrateur</h6>
                        <div className="bg-warning bg-opacity-10 p-3 rounded">
                          {selectedReservation.notes_admin}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <div className="d-flex gap-2 w-100">
                  <button className="btn btn-outline-success">
                    <FaPhone className="me-2" />
                    Appeler
                  </button>
                  <button className="btn btn-outline-primary">
                    <FaEnvelope className="me-2" />
                    Email
                  </button>
                  <button 
                    className="btn btn-outline-warning"
                    onClick={() => {
                      setShowModal(false);
                      openEditModal(selectedReservation);
                    }}
                  >
                    <FaEdit className="me-2" />
                    Modifier
                  </button>
                  <button
                    className="btn btn-secondary ms-auto"
                    onClick={() => setShowModal(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReservation && (
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
                  <FaEdit className="text-warning me-2" />
                  Modifier la réservation #{selectedReservation.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                />
              </div>
              
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="row">
                    {/* Status Section */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <FaClipboardCheck className="me-2" />
                        Statut de la réservation
                      </h6>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Statut actuel</label>
                        <div className="mb-2">
                          {getStatusBadge(selectedReservation.statut)}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Nouveau statut</label>
                        <select
                          className="form-select"
                          value={editFormData.statut}
                          onChange={(e) => handleInputChange('statut', e.target.value)}
                          required
                        >
                          <option value="draft">Brouillon</option>
                          <option value="en_attente">En attente</option>
                          <option value="confirmee">Confirmée</option>
                          <option value="en_cours">En cours</option>
                          <option value="terminee">Terminée</option>
                          <option value="annulee">Annulée</option>
                          <option value="absent">Absent (No-show)</option>
                        </select>
                        <div className="form-text">
                          Sélectionnez le nouveau statut pour cette réservation
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Notes administrateur</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={editFormData.notes_admin}
                          onChange={(e) => handleInputChange('notes_admin', e.target.value)}
                          placeholder="Ajoutez des notes sur cette modification..."
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Service</label>
                        <select
                          className="form-select"
                          value={editFormData.service_id}
                          onChange={(e) => handleInputChange('service_id', e.target.value)}
                        >
                          <option value="">Sélectionner un service</option>
                          {services.map(service => (
                            <option key={service.id} value={service.id}>
                              {service.nom} - {service.prix}DT ({service.duree}min)
                            </option>
                          ))}
                        </select>
                        <div className="form-text">
                          Modifier le service associé à cette réservation
                        </div>
                      </div>
                    </div>

                    {/* Client Details Section */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <FaUser className="me-2" />
                        Détails du client
                      </h6>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Prénom</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.client_prenom}
                          onChange={(e) => handleInputChange('client_prenom', e.target.value)}
                          placeholder="Prénom du client"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Nom</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.client_nom}
                          onChange={(e) => handleInputChange('client_nom', e.target.value)}
                          placeholder="Nom du client"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Téléphone</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={editFormData.client_telephone}
                          onChange={(e) => handleInputChange('client_telephone', e.target.value)}
                          placeholder="Numéro de téléphone"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={editFormData.client_email}
                          onChange={(e) => handleInputChange('client_email', e.target.value)}
                          placeholder="Adresse email"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Info (Read-only) */}
                  <div className="row mt-4">
                    <div className="col-12">
                      <h6 className="fw-bold text-primary mb-3">Informations de la réservation</h6>
                      <div className="bg-light p-3 rounded">
                        <div className="row">
                          <div className="col-md-4">
                            <strong>Service:</strong> {selectedReservation.service.nom}
                          </div>
                          <div className="col-md-4">
                            <strong>Date:</strong> {new Date(selectedReservation.date_reservation).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="col-md-4">
                            <strong>Heure:</strong> {selectedReservation.heure_reservation}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-0">
                  <div className="d-flex gap-2 w-100">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditModal(false)}
                      disabled={isUpdating}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Sauvegarder les modifications
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReservations;
