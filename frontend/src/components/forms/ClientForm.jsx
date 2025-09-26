import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSave, 
  FaTimes, 
  FaUser,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const ClientForm = ({ 
  client = null, 
  isOpen, 
  onClose, 
  onSave, 
  mode = 'create' // 'create' or 'edit'
}) => {
  const [loading, setLoading] = useState(false);
  
  // NBrow Studio - Simple client form
  const [formData, setFormData] = useState({
    prenom: client?.prenom || '',
    nom: client?.nom || '',
    telephone: client?.telephone || '',
    email: client?.email || '',
    date_naissance: client?.date_naissance || '',
    adresse: client?.adresse || '',
    notes: client?.notes || '',
    actif: client?.actif !== undefined ? client.actif : true
  });

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
      // NBrow Studio - Simple validation
      if (!formData.prenom || !formData.nom || !formData.telephone) {
        alert('Veuillez remplir au moins le prénom, nom et téléphone');
        return;
      }

      const dataToSend = {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email.trim(),
        date_naissance: formData.date_naissance || null,
        adresse: formData.adresse.trim(),
        notes: formData.notes.trim(),
        actif: formData.actif
      };

      let response;
      if (mode === 'edit' && client) {
        response = await adminAPI.updateClient(client.id, dataToSend);
      } else {
        response = await adminAPI.createClient(dataToSend);
      }

      onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
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
              <FaUser className="text-primary me-2" />
              {mode === 'edit' ? 'Modifier la cliente' : 'Nouvelle cliente NBrow'}
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

              {/* NBrow Studio - Client Form */}
              <div className="row">
                <div className="col-md-12">
                  <h6 className="fw-bold text-primary mb-3">👥 Informations Cliente</h6>

                  <div className="row">
                    {/* First Name */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Prénom *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.prenom}
                          onChange={(e) => handleInputChange('prenom', e.target.value)}
                          placeholder="Marie"
                          required
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nom *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.nom}
                          onChange={(e) => handleInputChange('nom', e.target.value)}
                          placeholder="Dupont"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    {/* Phone */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          <FaPhone className="me-2" />
                          Téléphone *
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          value={formData.telephone}
                          onChange={(e) => handleInputChange('telephone', e.target.value)}
                          placeholder="+216 XX XXX XXX"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          <FaEnvelope className="me-2" />
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="marie@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="mb-3">
                    <label className="form-label">Date de naissance</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date_naissance}
                      onChange={(e) => handleInputChange('date_naissance', e.target.value)}
                    />
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <label className="form-label">Adresse</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.adresse}
                      onChange={(e) => handleInputChange('adresse', e.target.value)}
                      placeholder="Tunis, Tunisie"
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Notes sur la cliente, préférences, allergies..."
                    />
                  </div>

                  {/* Active Status */}
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.actif}
                      onChange={(e) => handleInputChange('actif', e.target.checked)}
                    />
                    <label className="form-check-label">✅ Cliente active</label>
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

export default ClientForm;