import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSave, 
  FaTimes, 
  FaCut
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const ServiceForm = ({ 
  service = null, 
  isOpen, 
  onClose, 
  onSave, 
  mode = 'create' // 'create' or 'edit'
}) => {
  const [loading, setLoading] = useState(false);
  
  // Simplified form data for NBrow Studio - French only
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    duree: '',
    service_type: 'base',
    image_url: '',
    populaire: false,
    nouveau: false,
    actif: true
  });

  useEffect(() => {
    if (isOpen) {
      if (service && mode === 'edit') {
        populateForm();
      } else {
        resetForm();
      }
    }
  }, [isOpen, service, mode]);

  const populateForm = () => {
    if (!service) return;
    
    // NBrow Studio - Simplified form population
    setFormData({
      nom: service.nom || '',
      description: service.description || '',
      prix: service.prix || '',
      duree: service.duree || '',
      service_type: service.service_type || 'base',
      image_url: service.image_url || '',
      populaire: service.populaire || false,
      nouveau: service.nouveau || false,
      actif: service.actif !== undefined ? service.actif : true
    });
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix: '',
      duree: '',
      service_type: 'base',
      image_url: '',
      populaire: false,
      nouveau: false,
      actif: true
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // NBrow Studio - Simplified validation
      if (!formData.nom || !formData.prix || !formData.duree) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const dataToSend = {
        nom: formData.nom,
        description: formData.description,
        prix: parseFloat(formData.prix),
        duree: parseInt(formData.duree),
        service_type: formData.service_type,
        image_url: formData.image_url,
        populaire: formData.populaire,
        nouveau: formData.nouveau,
        actif: formData.actif
      };

      let response;
      if (mode === 'edit' && service) {
        response = await adminAPI.updateService(service.id, dataToSend);
      } else {
        response = await adminAPI.createService(dataToSend);
      }

      onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Erreur lors de la sauvegarde: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
              {mode === 'edit' ? 'Modifier le service' : 'Nouveau service NBrow'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {loading && (
                <div className="text-center mb-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              )}

              {/* NBrow Studio - Simplified Form */}
              <div className="row">
                <div className="col-md-12">
                  <h6 className="fw-bold text-primary mb-3">🏪 Service Sourcils NBrow Studio</h6>

                  {/* Service Name */}
                  <div className="mb-3">
                    <label className="form-label">Nom du service *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                      placeholder="Ex: Épilation Sourcils, Lamination..."
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Description du service sourcils..."
                    />
                  </div>

                  <div className="row">
                    {/* Price */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Prix (€) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.prix}
                          onChange={(e) => handleInputChange('prix', e.target.value)}
                          placeholder="25.00"
                          required
                        />
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Durée (minutes) *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.duree}
                          onChange={(e) => handleInputChange('duree', e.target.value)}
                          placeholder="30"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Image URL */}
                  <div className="mb-3">
                    <label className="form-label">URL de l'image</label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      placeholder="/images/service-sourcils.jpg"
                    />
                  </div>

                  {/* Service Options */}
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.populaire}
                          onChange={(e) => handleInputChange('populaire', e.target.checked)}
                        />
                        <label className="form-check-label">⭐ Service populaire</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.nouveau}
                          onChange={(e) => handleInputChange('nouveau', e.target.checked)}
                        />
                        <label className="form-check-label">🆕 Nouveau service</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.actif}
                          onChange={(e) => handleInputChange('actif', e.target.checked)}
                        />
                        <label className="form-check-label">✅ Service actif</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                <FaTimes className="me-2" />
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    {mode === 'edit' ? 'Mettre à jour' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceForm;