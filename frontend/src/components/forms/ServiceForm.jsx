import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSave, 
  FaTimes, 
  FaUpload, 
  FaLanguage,
  FaCut,
  FaGlobe
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const ServiceForm = ({ 
  service = null, 
  isOpen, 
  onClose, 
  onSave, 
  mode = 'create' // 'create' or 'edit'
}) => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Form data for different languages
  const [formData, setFormData] = useState({
    // Base service data (language-independent)
    prix: '',
    duree: '',
    categorie_id: '',
    service_type: 'base',
    parent_service_id: '',
    image_url: '',
    nombre_sessions: '',
    prix_par_session: '',
    validite_jours: '',
    populaire: false,
    nouveau: false,
    ordre_affichage: 0,
    actif: true,
    
    // Translated fields - organized by language
    translations: {
      fr: {
        nom: '',
        description: '',
        description_detaillee: '',
        inclus: '',
        contre_indications: '',
        conseils_apres_soin: ''
      },
      en: {
        nom: '',
        description: '',
        description_detaillee: '',
        inclus: '',
        contre_indications: '',
        conseils_apres_soin: ''
      },
      ar: {
        nom: '',
        description: '',
        description_detaillee: '',
        inclus: '',
        contre_indications: '',
        conseils_apres_soin: ''
      }
    }
  });

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇹🇳' }
  ];

  const serviceTypes = [
    { value: 'base', label: 'Service de base' },
    { value: 'package', label: 'Package/Forfait' },
    { value: 'membership', label: 'Abonnement' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (service && mode === 'edit') {
        populateForm();
      } else {
        resetForm();
      }
    }
  }, [isOpen, service, mode]);

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const populateForm = async () => {
    if (!service) return;
    
    setLoading(true);
    try {
      // Get service details with all translations
      const response = await adminAPI.getServiceWithTranslations(service.id);
      const serviceData = response.data;
      
      setFormData({
        prix: serviceData.prix || '',
        duree: serviceData.duree || '',
        categorie_id: serviceData.categorie_id || '',
        service_type: serviceData.service_type || 'base',
        parent_service_id: serviceData.parent_service_id || '',
        image_url: serviceData.image_url || '',
        nombre_sessions: serviceData.nombre_sessions || '',
        prix_par_session: serviceData.prix_par_session || '',
        validite_jours: serviceData.validite_jours || '',
        populaire: serviceData.populaire || false,
        nouveau: serviceData.nouveau || false,
        ordre_affichage: serviceData.ordre_affichage || 0,
        actif: serviceData.actif !== false,
        translations: serviceData.translations || {
          fr: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' },
          en: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' },
          ar: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' }
        }
      });
    } catch (error) {
      console.error('Error loading service data:', error);
      // Fallback to basic service data
      setFormData(prev => ({
        ...prev,
        prix: service.prix || '',
        duree: service.duree || '',
        categorie_id: service.categorie_id || '',
        service_type: service.service_type || 'base',
        translations: {
          ...prev.translations,
          fr: {
            nom: service.nom || '',
            description: service.description || '',
            description_detaillee: service.description_detaillee || '',
            inclus: service.inclus || '',
            contre_indications: service.contre_indications || '',
            conseils_apres_soin: service.conseils_apres_soin || ''
          }
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      prix: '',
      duree: '',
      categorie_id: '',
      service_type: 'base',
      parent_service_id: '',
      image_url: '',
      nombre_sessions: '',
      prix_par_session: '',
      validite_jours: '',
      populaire: false,
      nouveau: false,
      ordre_affichage: 0,
      actif: true,
      translations: {
        fr: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' },
        en: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' },
        ar: { nom: '', description: '', description_detaillee: '', inclus: '', contre_indications: '', conseils_apres_soin: '' }
      }
    });
    setCurrentLanguage('fr');
  };

  const handleInputChange = (field, value, isTranslated = false) => {
    if (isTranslated) {
      setFormData(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [currentLanguage]: {
            ...prev.translations[currentLanguage],
            [field]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.translations.fr.nom || !formData.prix || !formData.duree || !formData.categorie_id) {
        alert('Veuillez remplir tous les champs obligatoires (au moins en français)');
        return;
      }

      const dataToSend = {
        ...formData,
        prix: parseFloat(formData.prix),
        duree: parseInt(formData.duree),
        categorie_id: parseInt(formData.categorie_id),
        parent_service_id: formData.parent_service_id ? parseInt(formData.parent_service_id) : null,
        nombre_sessions: formData.nombre_sessions ? parseInt(formData.nombre_sessions) : null,
        prix_par_session: formData.prix_par_session ? parseFloat(formData.prix_par_session) : null,
        validite_jours: formData.validite_jours ? parseInt(formData.validite_jours) : null,
        ordre_affichage: parseInt(formData.ordre_affichage)
      };

      let response;
      if (mode === 'edit' && service) {
        response = await adminAPI.updateServiceWithTranslations(service.id, dataToSend);
      } else {
        response = await adminAPI.createServiceWithTranslations(dataToSend);
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

  const currentTranslation = formData.translations[currentLanguage];

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              <FaCut className="text-primary me-2" />
              {mode === 'edit' ? 'Modifier le service' : 'Nouveau service'}
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

              {/* Language Selector */}
              <div className="mb-4">
                <label className="form-label d-flex align-items-center">
                  <FaGlobe className="me-2 text-primary" />
                  Langue de saisie
                </label>
                <div className="btn-group w-100" role="group">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`btn ${currentLanguage === lang.code ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setCurrentLanguage(lang.code)}
                    >
                      <span className="me-2">{lang.flag}</span>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="row">
                {/* Left Column - Basic Info */}
                <div className="col-md-6">
                  <h6 className="fw-bold text-primary mb-3">Informations de base</h6>

                  <div className="mb-3">
                    <label className="form-label">Type de service *</label>
                    <select
                      className="form-select"
                      value={formData.service_type}
                      onChange={(e) => handleInputChange('service_type', e.target.value)}
                      required
                    >
                      {serviceTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Catégorie *</label>
                    <select
                      className="form-select"
                      value={formData.categorie_id}
                      onChange={(e) => handleInputChange('categorie_id', e.target.value)}
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Prix (DT) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.prix}
                          onChange={(e) => handleInputChange('prix', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Durée (min) *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.duree}
                          onChange={(e) => handleInputChange('duree', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">URL de l'image</label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ordre d'affichage</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.ordre_affichage}
                      onChange={(e) => handleInputChange('ordre_affichage', e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.populaire}
                        onChange={(e) => handleInputChange('populaire', e.target.checked)}
                      />
                      <label className="form-check-label">Service populaire</label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.nouveau}
                        onChange={(e) => handleInputChange('nouveau', e.target.checked)}
                      />
                      <label className="form-check-label">Nouveau service</label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.actif}
                        onChange={(e) => handleInputChange('actif', e.target.checked)}
                      />
                      <label className="form-check-label">Service actif</label>
                    </div>
                  </div>
                </div>

                {/* Right Column - Translated Content */}
                <div className="col-md-6">
                  <h6 className="fw-bold text-primary mb-3">
                    Contenu ({languages.find(l => l.code === currentLanguage)?.name})
                  </h6>

                  <div className="mb-3">
                    <label className="form-label">Nom du service *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentTranslation.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value, true)}
                      required={currentLanguage === 'fr'}
                      placeholder={`Nom du service en ${languages.find(l => l.code === currentLanguage)?.name}`}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description courte</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={currentTranslation.description}
                      onChange={(e) => handleInputChange('description', e.target.value, true)}
                      placeholder={`Description courte en ${languages.find(l => l.code === currentLanguage)?.name}`}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description détaillée</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={currentTranslation.description_detaillee}
                      onChange={(e) => handleInputChange('description_detaillee', e.target.value, true)}
                      placeholder={`Description détaillée en ${languages.find(l => l.code === currentLanguage)?.name}`}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ce qui est inclus</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={currentTranslation.inclus}
                      onChange={(e) => handleInputChange('inclus', e.target.value, true)}
                      placeholder={`Ce qui est inclus en ${languages.find(l => l.code === currentLanguage)?.name}`}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Contre-indications</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={currentTranslation.contre_indications}
                      onChange={(e) => handleInputChange('contre_indications', e.target.value, true)}
                      placeholder={`Contre-indications en ${languages.find(l => l.code === currentLanguage)?.name}`}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Conseils après soin</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={currentTranslation.conseils_apres_soin}
                      onChange={(e) => handleInputChange('conseils_apres_soin', e.target.value, true)}
                      placeholder={`Conseils après soin en ${languages.find(l => l.code === currentLanguage)?.name}`}
                    />
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
