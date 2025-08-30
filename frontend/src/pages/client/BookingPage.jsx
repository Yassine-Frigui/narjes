import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCalendarAlt, FaClock, FaUser, FaPhone, FaEnvelope, FaCheck, FaStar, FaInfoCircle, FaSave } from 'react-icons/fa';
import { publicAPI } from '../../services/api';
import ReservationConfirmation from './ReservationConfirmation';
import HeroSection from '../../components/HeroSection';

const BookingPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const serviceIdFromUrl = searchParams.get('service') || '';
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedService, setSelectedService] = useState(serviceIdFromUrl);
  const [sessionId, setSessionId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    date_reservation: '',
    heure_reservation: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reservationData, setReservationData] = useState(null);
  const [error, setError] = useState('');

  // horrairex horaires disponibles
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30'
  ];

  useEffect(() => {
    fetchServices(); // This now also fetches categories
    
    // Generate unique session ID and store in sessionStorage (not localStorage)
    initializeSession();
  }, [i18n.language]); // Re-fetch when language changes

  // Initialize session with unique ID that persists only for this tab session
  const initializeSession = async () => {
    let currentSessionId = sessionStorage.getItem('waad_nails_booking_session');
    
    if (!currentSessionId) {
      // Generate truly unique session ID
      currentSessionId = 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
      sessionStorage.setItem('waad_nails_booking_session', currentSessionId);
    }
    
    setSessionId(currentSessionId);
    
    // Try to load existing draft for this session
    try {
      const response = await publicAPI.getDraft(currentSessionId);
      if (response.data.success && response.data.data) {
        const draftData = response.data.data;
        
        // Convert draft field names to form field names
        const formData = {
          nom: draftData.nom || '',
          prenom: draftData.prenom || '',
          email: draftData.email || '',
          telephone: draftData.telephone || '',
          date_reservation: draftData.date_reservation || '',
          heure_reservation: draftData.heure_reservation || '',
          notes: draftData.notes || ''
        };
        
        setFormData(formData);
        if (draftData.service_id) {
          setSelectedService(draftData.service_id.toString());
        }
        setAutoSaveStatus('📄 Brouillon chargé');
        setTimeout(() => setAutoSaveStatus(''), 3000);
      }
    } catch (error) {
      // No existing draft, which is fine
      console.log('Nouvelle session - aucun brouillon existant');
    }
  };

  const fetchServices = async () => {
    try {
      // Use the same API calls as ServicesPage
      const [servicesRes, categoriesRes] = await Promise.all([
        publicAPI.getServices(),
        publicAPI.getCategories()
      ]);

      setServices(servicesRes.data.services || servicesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      setServices([]); // Set empty array on error
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await publicAPI.getCategories();
      const categoriesData = response.data || response;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    // Immediately update the same draft when service is selected
    if (sessionId && formData.telephone && formData.telephone.trim() !== '') {
      saveDraft({ 
        ...formData, 
        service_id: serviceId,
        heure_reservation: formData.heure_reservation
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date_reservation: date
    }));
    
    // Simuler la vérification des horrairex disponibles
    // En production, ceci ferait un appel API pour vérifier les disponibilités
    const randomAvailable = timeSlots.filter(() => Math.random() > 0.3);
    setAvailableSlots(randomAvailable);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const reservationData = {
        // Client data
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        date_naissance: null, // Optional field
        adresse: '', // Optional field
        
        // Reservation data
        service_id: selectedService,
        date_reservation: formData.date_reservation,
        heure_debut: formData.heure_reservation,
        notes_client: formData.notes || '',
        
        // Session ID for draft conversion
        session_id: sessionId
      };

      console.log('Sending reservation data:', reservationData);

      const response = await publicAPI.createReservation(reservationData);
      console.log('Reservation response:', response);
      
      // Store reservation data for confirmation page
      setReservationData({
        reservation: response.data.reservation,
        service: response.data.reservation.service || services.find(s => s.id == selectedService),
        clientData: response.data.reservation.client || {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone
        }
      });
      
      // Show confirmation page instead of success page
      setShowConfirmation(true);
      
      // Delete the draft after successful reservation (clean up)
      if (sessionId) {
        try {
          await publicAPI.deleteDraft(sessionId);
          sessionStorage.removeItem('waad_nails_booking_session'); // Clear session storage
        } catch (error) {
          console.error('Erreur lors de la suppression du brouillon:', error);
        }
      }
      
      // Reset form
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_reservation: '',
        heure_reservation: '',
        notes: ''
      });
      setSelectedService('');
      setAvailableSlots([]);
    } catch (error) {
      console.error('Erreur réservation complète:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Une erreur est survenue lors de la réservation. Veuillez réessayer.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Service non trouvé. Veuillez sélectionner un autre service.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erreur du serveur. Veuillez contacter le support.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Réservation à partir de demain
    return today.toISOString().split('T')[0];
  };

  const selectedServiceData = Array.isArray(services) 
    ? services.find(s => s.id === parseInt(selectedService))
    : null;

  // Group services by category
  const servicesByCategory = categories.map(category => {
    // Get services that directly belong to this category (base services and addons)
    const directServices = services.filter(service => service.categorie_id === category.id);
    
    // Get variant and package services that belong to services in this category
    const relatedServices = services.filter(service => {
      if (!service.parent_service_id || service.categorie_id) return false; // Avoid double counting
      // Find the parent service and check if it belongs to this category
      const parentService = services.find(s => s.id === service.parent_service_id);
      return parentService && parentService.categorie_id === category.id;
    });
    
    const allCategoryServices = [...directServices, ...relatedServices];
    
    return {
      ...category,
      services: allCategoryServices
    };
  }).filter(category => category.services.length > 0);
  
  // Add uncategorized services (if any) to a special category
  const uncategorizedServices = services.filter(service => 
    !service.categorie_id && 
    !service.parent_service_id && 
    service.service_type !== 'addon'
  );
  
  if (uncategorizedServices.length > 0) {
    servicesByCategory.push({
      id: 'uncategorized',
      nom: 'Autres Services',
      couleur_theme: '#888888',
      services: uncategorizedServices
    });
  }

  // Auto-save function - updates the SAME draft every time
  const saveDraft = useCallback(async (data) => {
    if (!sessionId) return;
    
    // Only save if client has provided at least a phone number (minimum requirement)
    if (!data.telephone || data.telephone.trim() === '') {
      return; // Don't save draft without phone number
    }
    
    try {
      const draftData = {
        sessionId,
        ...data,
        service_id: selectedService || null,
        // Convert heure_reservation to the draft format
        heure_reservation: data.heure_reservation
      };
      
      await publicAPI.saveDraft(draftData);
      setAutoSaveStatus('💾 Auto-sauvegardé');
      setTimeout(() => setAutoSaveStatus(''), 1500);
    } catch (error) {
      console.error('Erreur auto-sauvegarde:', error);
      setAutoSaveStatus('⚠️ Erreur sauvegarde');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  }, [sessionId, selectedService]);

  // Auto-save with debouncing - always updates the SAME draft
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only auto-save if client has at least a phone number (spa's minimum requirement)
      const hasPhoneNumber = formData.telephone && formData.telephone.trim() !== '';
      if (hasPhoneNumber && sessionId) {
        saveDraft(formData); // Always updates the same draft for this session
      }
    }, 1500); // Save 1.5 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [formData, saveDraft, sessionId]);

  // Confirmation page handlers
  const handleEditReservation = () => {
    setShowConfirmation(false);
    // Keep the form data intact for editing
  };

  const handleConfirmReservation = async (reservation, method = 'code') => {
    // Delete the draft after confirmation
    if (sessionId) {
      try {
        await publicAPI.deleteDraft(sessionId);
        sessionStorage.removeItem('waad_nails_booking_session');
      } catch (error) {
        console.error('Erreur lors de la suppression du brouillon:', error);
      }
    }
    
    // Reset form and show success
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      date_reservation: '',
      heure_reservation: '',
      notes: ''
    });
    setSelectedService('');
    setAvailableSlots([]);
    
    setShowConfirmation(false);
    setSuccess(true);
  };

  const handleCancelReservation = () => {
    setShowConfirmation(false);
    setReservationData(null);
    // Optionally delete the reservation from backend
  };

  // Show confirmation page
  if (showConfirmation && reservationData) {
    return (
      <ReservationConfirmation
        reservationData={reservationData}
        onEdit={handleEditReservation}
        onConfirm={handleConfirmReservation}
        onCancel={handleCancelReservation}
      />
    );
  }

  if (success && reservationData) {
    const { reservation, service, clientData } = reservationData;
    
    // Format date for display
    const reservationDate = new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <motion.div
        className="booking-success py-5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ minHeight: '80vh' }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10 text-center">
              <motion.div
                className="success-card bg-white rounded-4 shadow-lg p-5"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="success-icon mb-4">
                  <FaCheck className="text-success" style={{ fontSize: '4rem' }} />
                </div>
                <h2 className="text-primary fw-bold mb-3">
                  ✨ Réservation confirmée ! ✨
                </h2>
                <p className="lead text-muted mb-4">
                  Votre rendez-vous a été enregistré avec succès. Vous recevrez un email de confirmation avec tous les détails.
                </p>
                
                {/* Reservation Details */}
                <div className="bg-light border-left border-primary p-4 rounded mb-4 text-start">
                  <h5 className="text-primary mb-3">📋 Détails de votre réservation</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>🎯 Service :</strong> {service?.nom}</p>
                      <p><strong>📅 Date :</strong> {reservationDate}</p>
                      <p><strong>⏰ Heure :</strong> {reservation.heure_debut}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>👤 Client :</strong> {clientData.prenom} {clientData.nom}</p>
                      <p><strong>📧 Email :</strong> {clientData.email}</p>
                      <p><strong>💰 Prix :</strong> {service?.prix} DT</p>
                    </div>
                  </div>
                </div>

                {/* Email notification */}
                <div className="alert alert-info mb-4">
                  <h6 className="alert-heading">📧 Email de confirmation envoyé !</h6>
                  <p className="mb-0">
                    Un email de confirmation avec un <strong>code de vérification</strong> a été envoyé à <strong>{clientData.email}</strong>. 
                    Présentez ce code lors de votre visite.
                  </p>
                </div>

                <div className="alert alert-warning">
                  <p className="mb-0 text-warning">
                    <strong>⚠️ Important :</strong> Veuillez arriver 10 minutes avant votre rendez-vous pour l'accueil.
                  </p>
                </div>

                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                  <button
                    className="btn btn-green btn-lg px-4"
                    onClick={() => {
                      setSuccess(false);
                      setReservationData(null);
                    }}
                  >
                    {t('booking.form.newBooking')}
                  </button>
                  <Link to="/client/services" className="btn btn-outline-green btn-lg px-4">
                    Voir nos services
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="booking-page">
      {/* Hero Section */}
      <HeroSection
        title={t('booking.hero.title')}
        subtitle={t('booking.hero.subtitle')}
        description=""
        backgroundType="gradient"
        primaryButton={{
          text: t('booking.cta.primary', 'Réserver maintenant'),
          href: '#booking-form',
          style:{ background: `linear-gradient(135deg, var(--snow), var(--snow ) ` }
        }}
        image={{
          src: '/images/nails_example2.jpg',
          alt: 'Beauty Nails - Chez Waad'
        }}
      />

      {/* Booking Form */}
      <section id="booking-form" className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <motion.div
                className="booking-form-card bg-white rounded-4 shadow-lg"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <div className="card-body p-5">
                  {/* Auto-save status indicator */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold text-primary mb-0">{t('booking.form.title')}</h3>
                    <div className="d-flex flex-column align-items-end">
                      {sessionId && (
                        <small className="text-muted mb-1">
                          {t('booking.form.session')}: {sessionId.slice(-8)}
                        </small>
                      )}
                      {autoSaveStatus && (
                        <div className="auto-save-status">
                          <small className={`text-${autoSaveStatus.includes('💾') ? 'success' : autoSaveStatus.includes('⚠️') ? 'danger' : 'info'}`}>
                            {autoSaveStatus}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="booking-form">
                    {/* Service Selection */}
                    <motion.div
                      className="mb-4"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    >
                      <label className="form-label fw-bold text-primary">
                        <FaStar className="me-2" />
                        {t('booking.form.selectService')}
                      </label>
                      
                      {servicesByCategory.length > 0 ? servicesByCategory.map((category) => (
                        <div key={category.id} className="mb-4">
                          <div className="category-header">
                            {category.nom}
                            <small className="ms-2 opacity-75">
                              ({category.services.length} {category.services.length > 1 ? t('booking.form.services_count_plural') : t('booking.form.services_count')})
                            </small>
                          </div>
                          <div className="row">
                            {category.services.map((service) => (
                              <div key={service.id} className="col-md-6 mb-3">
                                <motion.div
                                  className={`service-card ${
                                    selectedService === service.id.toString() 
                                      ? 'selected border-primary' 
                                      : 'border border-light'
                                  }`}
                                  onClick={() => handleServiceChange(service.id.toString())}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <h6 className="fw-bold text-primary mb-1">
                                        {service.nom}
                                      </h6>
                                      <p className="text-muted small mb-2">
                                        {service.description}
                                      </p>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                          <FaClock className="text-primary me-1" size={12} />
                                          <span className="small text-muted me-3">
                                            {service.duree} {t('booking.form.duration')}
                                          </span>
                                          <span className="fw-bold text-primary">
                                            {service.prix}DT
                                          </span>
                                        </div>
                                        <Link 
                                          to={`/services/${service.id}`}
                                          className="btn btn-sm btn-outline-green text-decoration-none"
                                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <FaInfoCircle className="me-1" size={10} />
                                          {t('booking.form.serviceDetails')}
                                        </Link>
                                      </div>
                                    </div>
                                    <div className={`form-check-input ms-2 ${
                                      selectedService === service.id.toString() ? 'bg-primary-500 border-primary-500' : ''
                                    }`}>
                                      {selectedService === service.id.toString() && '✓'}
                                    </div>
                                  </div>
                                </motion.div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-4">
                          <p className="text-muted">Chargement des services...</p>
                        </div>
                      )}
                    </motion.div>

                    {/* Personal Information */}
                    <motion.div
                      className="mb-4"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    >
                      <h5 className="fw-bold text-primary mb-3">
                        <FaUser className="me-2" />
                        {t('booking.form.personalInfo')}
                      </h5>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t('booking.form.firstName')}</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleInputChange}
                            required
                            placeholder={t('booking.form.placeholders.firstName')}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t('booking.form.lastName')}</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                            required
                            placeholder={t('booking.form.placeholders.lastName')}
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            <FaEnvelope className="me-2" />
                            {t('booking.form.email')}
                          </label>
                          <input
                            type="email"
                            className="form-control form-control-lg"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder={t('booking.form.placeholders.email')}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            <FaPhone className="me-2" />
                            {t('booking.form.phone')} 
                            <small className="text-muted ms-2">{t('booking.form.phoneHelper')}</small>
                          </label>
                          <input
                            type="tel"
                            className="form-control form-control-lg"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleInputChange}
                            required
                            placeholder={t('booking.form.placeholders.phone')}
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Date and Time Selection */}
                    <motion.div
                      className="mb-4"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.0, duration: 0.6 }}
                    >
                      <h5 className="fw-bold text-primary mb-3">
                        <FaCalendarAlt className="me-2" />
                        {t('booking.form.dateTime.title')}
                      </h5>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t('booking.form.dateTime.date')}</label>
                          <input
                            type="date"
                            className="form-control form-control-lg"
                            name="date_reservation"
                            value={formData.date_reservation}
                            onChange={(e) => handleDateChange(e.target.value)}
                            min={getMinDate()}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t('booking.form.dateTime.time')}</label>
                          <select
                            className="form-select form-select-lg"
                            name="heure_reservation"
                            value={formData.heure_reservation}
                            onChange={handleInputChange}
                            required
                            disabled={!formData.date_reservation}
                          >
                            <option value="">{t('booking.form.dateTime.selectTime')}</option>
                            {availableSlots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                          {formData.date_reservation && availableSlots.length === 0 && (
                            <div className="text-muted small mt-1">
                              {t('booking.form.dateTime.noAvailableSlots')}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Notes */}
                    <motion.div
                      className="mb-4"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                    >
                      <label className="form-label">{t('booking.form.notes.label')}</label>
                      <textarea
                        className="form-control"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder={t('booking.form.notes.placeholder')}
                      />
                    </motion.div>

                    {/* Summary */}
                    {selectedServiceData && (
                      <motion.div
                        className="alert alert-light border-primary-200 bg-pink-50 mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <h6 className="fw-bold text-primary mb-2">{t('booking.form.summary.title')}</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{selectedServiceData.nom}</strong>
                            <div className="small text-muted">
                              {t('booking.form.summary.duration')}: {selectedServiceData.duree} {t('booking.form.summary.minutes')}
                            </div>
                          </div>
                          <div className="text-end">
                            <strong className="text-pink-600 fs-5">
                              {selectedServiceData.prix}DT
                            </strong>
                          </div>
                        </div>
                        {formData.date_reservation && formData.heure_reservation && (
                          <div className="mt-2 pt-2 border-top border-pink-200">
                            <strong>{t('booking.form.summary.appointment')}:</strong> {' '}
                            {new Date(formData.date_reservation).toLocaleDateString(i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'en' ? 'en-US' : 'fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} à {formData.heure_reservation}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        className="alert alert-danger"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <motion.div
                      className="text-center"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1.4, duration: 0.6 }}
                    >
                      <button
                        type="submit"
                        className="btn btn-dark-green text-white btn-lg px-5 "
                        disabled={loading || !selectedService || !formData.date_reservation || !formData.heure_reservation}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            {t('booking.form.submitting')}
                          </>
                        ) : (
                          <>
                            <FaCheck className="me-2" />
                            {t('booking.form.submit')}
                          </>
                        )}
                      </button>
                    </motion.div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <FaCalendarAlt className="text-primary mb-3" size={40} />
                <h5 className="fw-bold text-primary">Réservation facile</h5>
                <p className="text-muted">
                  Choisissez votre horraire en ligne, recevez une confirmation immédiate
                </p>
              </motion.div>
            </div>
            <div className="col-md-4 text-center mb-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <FaPhone className="text-primary mb-3" size={40} />
                <h5 className="fw-bold text-primary">Support disponible</h5>
                <p className="text-muted">
                  Une question ? Contactez-nous au 01 23 45 67 89
                </p>
              </motion.div>
            </div>
            <div className="col-md-4 text-center mb-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <FaSave className="text-primary mb-3" size={40} />
                <h5 className="fw-bold text-primary">Sauvegarde intelligente</h5>
                <p className="text-muted">
                  Vos informations sont automatiquement sauvegardées dès que vous saisissez votre téléphone - pas besoin de vous inquiéter de perdre vos données
                </p>
              </motion.div>
            </div>
            <div className="col-md-4 text-center mb-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <FaCheck className="text-green mb-3" size={40} />
                <h5 className="fw-bold text-green">Rappel automatique</h5>
                <p className="text-muted">
                  Recevez un rappel 24h avant votre rendez-vous
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingPage;
