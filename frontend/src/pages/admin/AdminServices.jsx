import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCut,
  FaPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaClock,
  FaMoneyBill,
  FaStar,
  FaImage
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import ServiceForm from '../../components/forms/ServiceForm';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  
  // New state for forms and modals
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFormMode, setServiceFormMode] = useState('create');
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getServicesAdmin();
      setServices(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const openModal = (service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const openCreateForm = () => {
    setServiceFormMode('create');
    setSelectedServiceForEdit(null);
    setShowServiceForm(true);
  };

  const openEditForm = (service) => {
    setServiceFormMode('edit');
    setSelectedServiceForEdit(service);
    setShowServiceForm(true);
  };

  const closeServiceForm = () => {
    setShowServiceForm(false);
    setSelectedServiceForEdit(null);
  };

  const handleServiceSave = (savedService) => {
    if (serviceFormMode === 'create') {
      setServices(prev => [...prev, savedService]);
    } else {
      setServices(prev => prev.map(service => 
        service.id === savedService.id ? savedService : service
      ));
    }
    fetchServices(); // Refresh the list to get updated data
  };

  const openDeleteModal = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    
    setDeleteLoading(true);
    try {
      await adminAPI.deleteService(serviceToDelete.id);
      setServices(prev => prev.filter(service => service.id !== serviceToDelete.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-pink-500 mb-3" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted">Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-services">
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
              <FaCut className="text-primary me-2" />
              Gestion des Services
            </h1>
            <p className="text-muted mb-0">
              {services.length} services disponibles
            </p>
          </div>
          <div className="col-auto">
            <motion.button
              className="btn btn-pink"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateForm}
            >
              <FaPlus className="me-2" />
              Nouveau service
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        className="search-section mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Rechercher un service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <span className="badge bg-light text-dark fs-6 w-100 py-2">
                  {filteredServices.length} résultat(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Services Grid */}
      <motion.div
        className="services-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {filteredServices.length === 0 ? (
          <div className="text-center py-5">
            <FaCut className="text-muted mb-3" size={48} />
            <p className="text-muted">Aucun service trouvé</p>
          </div>
        ) : (
          <div className="row">
            {filteredServices.map((service, index) => (
              <div key={service.id} className="col-lg-4 col-md-6 mb-4">
                <motion.div
                  className="card border-0 shadow-sm h-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="card-title text-dark fw-bold">{service.nom}</h5>
                      <span className="badge bg-pink text-white">{service.prix}DT</span>
                    </div>
                    
                    <p className="card-text text-muted small mb-3">
                      {service.description}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <FaClock className="text-primary me-2" size={14} />
                        <span className="small text-muted">{service.duree} min</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <FaMoneyBill className="text-success me-2" size={14} />
                        <span className="small text-muted">{service.prix} DT</span>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <motion.button
                        className="btn btn-sm btn-outline-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openModal(service)}
                        title="Voir détails"
                      >
                        <FaEye size={12} />
                      </motion.button>
                      <motion.button
                        className="btn btn-sm btn-outline-secondary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditForm(service)}
                        title="Modifier"
                      >
                        <FaEdit size={12} />
                      </motion.button>
                      <motion.button
                        className="btn btn-sm btn-outline-danger"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openDeleteModal(service)}
                        title="Supprimer"
                      >
                        <FaTrash size={12} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal de détails service */}
      {showModal && selectedService && (
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
                  <FaCut className="text-primary me-2" />
                  {selectedService.nom}
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
                    <h6 className="fw-bold text-primary mb-3">Détails du service</h6>
                    <div className="mb-2">
                      <strong>Nom:</strong> {selectedService.nom}
                    </div>
                    <div className="mb-2">
                      <strong>Prix:</strong> <span className="text-success">{selectedService.prix} DT</span>
                    </div>
                    <div className="mb-2">
                      <strong>Durée:</strong> {selectedService.duree} minutes
                    </div>
                    <div className="mb-3">
                      <strong>Description:</strong> {selectedService.description}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    {selectedService.image && (
                      <>
                        <h6 className="fw-bold text-primary mb-3">Image</h6>
                        <img 
                          src={selectedService.image} 
                          alt={selectedService.nom}
                          className="img-fluid rounded"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary" onClick={() => openEditForm(selectedService)}>
                    <FaEdit className="me-2" />
                    Modifier
                  </button>
                  <button
                    className="btn btn-secondary"
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

      {/* Service Form Modal */}
      <ServiceForm
        service={selectedServiceForEdit}
        isOpen={showServiceForm}
        onClose={closeServiceForm}
        onSave={handleServiceSave}
        mode={serviceFormMode}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Supprimer le service"
        message="Êtes-vous sûr de vouloir supprimer ce service ?"
        itemName={serviceToDelete?.nom}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminServices;
