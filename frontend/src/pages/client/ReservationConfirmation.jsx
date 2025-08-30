import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaCheck, FaClock, FaCalendarAlt, FaUser, FaEnvelope, FaPhone, FaExclamationTriangle } from 'react-icons/fa';
import { publicAPI } from '../../services/api';

const ReservationConfirmation = ({ 
  reservationData, 
  onEdit, 
  onConfirm, 
  onCancel 
}) => {
  const { t } = useTranslation();
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationMethod, setConfirmationMethod] = useState('code'); // 'code', 'link', 'manual'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showManualConfirmation, setShowManualConfirmation] = useState(false);

  const { reservation, service, clientData } = reservationData;

  // Send verification email when component mounts
  useEffect(() => {
    sendVerificationEmail();
  }, []);

  const sendVerificationEmail = async () => {
    try {
      setLoading(true);
      await publicAPI.sendReservationVerification(reservation.id);
      setEmailSent(true);
    } catch (error) {
      console.error('Error sending verification email:', error);
      setError('Erreur lors de l\'envoi de l\'email de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez saisir un code à 6 chiffres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await publicAPI.verifyReservationCode(reservation.id, verificationCode);
      
      if (response.data.success) {
        onConfirm(reservation);
      } else {
        setError('Code de vérification incorrect');
      }
    } catch (error) {
      setError('Code de vérification incorrect ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleManualConfirmation = () => {
    setShowManualConfirmation(true);
    // You might want to send a notification to admin here
    setTimeout(() => {
      onConfirm(reservation, 'manual');
    }, 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container-fluid min-vh-100 bg-gradient-to-br from-pink-50 to-purple-50 py-5">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="row justify-content-center"
        >
          <div className="col-lg-8">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-header bg-gradient-primary text-white text-center py-4 rounded-top-4">
                <h2 className="mb-0">
                  <FaCheck className="me-2" />
                  Confirmation de votre réservation
                </h2>
                <p className="mb-0 opacity-75">Vérifiez vos informations avant de confirmer</p>
              </div>

              <div className="card-body p-5">
                {/* Reservation Details */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-5"
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="text-primary mb-0">Détails de la réservation</h4>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={onEdit}
                    >
                      <FaEdit className="me-1" />
                      Modifier
                    </button>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3">
                        <h6 className="text-muted mb-2">
                          <FaUser className="me-2" />
                          Client
                        </h6>
                        <p className="mb-1 fw-bold">{clientData.prenom} {clientData.nom}</p>
                        <p className="mb-1 text-muted">
                          <FaPhone className="me-1" />
                          {clientData.telephone}
                        </p>
                        <p className="mb-0 text-muted">
                          <FaEnvelope className="me-1" />
                          {clientData.email}
                        </p>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3">
                        <h6 className="text-muted mb-2">Service</h6>
                        <p className="mb-1 fw-bold">{service.nom}</p>
                        <p className="mb-1 text-muted">
                          <FaClock className="me-1" />
                          {service.duree} minutes
                        </p>
                        <p className="mb-0 text-primary fw-bold">{service.prix} DT</p>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3">
                        <h6 className="text-muted mb-2">
                          <FaCalendarAlt className="me-2" />
                          Date & Heure
                        </h6>
                        <p className="mb-1 fw-bold">{formatDate(reservation.date_reservation)}</p>
                        <p className="mb-0 text-muted">{reservation.heure_debut}</p>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-success bg-opacity-10 rounded-3">
                        <h6 className="text-success mb-2">Prix Total</h6>
                        <p className="mb-0 h4 text-success fw-bold">{reservation.prix_final} DT</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Verification Methods */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-4"
                >
                  <h4 className="text-primary mb-4">Confirmer votre réservation</h4>

                  {!showManualConfirmation ? (
                    <>
                      {/* Email Verification */}
                      {emailSent && (
                        <div className="alert alert-info border-0 rounded-3 mb-4">
                          <div className="d-flex align-items-center">
                            <FaEnvelope className="me-2" />
                            <div>
                              <strong>Email envoyé !</strong>
                              <p className="mb-0 small">
                                Un code de vérification et un lien de confirmation ont été envoyés à {clientData.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Method 1: Code Verification */}
                      <div className="card border-primary mb-3">
                        <div className="card-body">
                          <h6 className="card-title text-primary">
                            1. Saisir le code de vérification
                          </h6>
                          <p className="card-text text-muted small">
                            Entrez le code à 6 chiffres reçu par email
                          </p>
                          
                          <div className="row align-items-end">
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control form-control-lg text-center"
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                              />
                            </div>
                            <div className="col-md-6">
                              <button
                                className="btn btn-primary btn-lg w-100"
                                onClick={handleCodeVerification}
                                disabled={loading || verificationCode.length !== 6}
                              >
                                {loading ? 'Vérification...' : 'Confirmer'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Method 2: Email Link */}
                      <div className="alert alert-light border border-secondary mb-3">
                        <h6 className="text-secondary">
                          2. Cliquer sur le lien dans l'email
                        </h6>
                        <p className="mb-0 small text-muted">
                          Vous pouvez également cliquer directement sur le lien de confirmation dans l'email reçu
                        </p>
                      </div>

                      {/* Method 3: Manual Confirmation */}
                      <div className="text-center">
                        <p className="text-muted mb-2">Vous n'avez pas accès à votre email ?</p>
                        <button
                          className="btn btn-outline-warning"
                          onClick={handleManualConfirmation}
                        >
                          <FaExclamationTriangle className="me-2" />
                          Pas d'accès à l'email
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Manual Confirmation Message */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4"
                    >
                      <div className="alert alert-warning border-0 rounded-3">
                        <FaExclamationTriangle className="mb-3" size={48} />
                        <h5>Ne vous inquiétez pas !</h5>
                        <p className="mb-0">
                          Nous vous contacterons sous peu pour confirmer votre réservation.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <div className="alert alert-danger border-0 rounded-3 mt-3">
                      {error}
                    </div>
                  )}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="d-flex justify-content-between"
                >
                  <button
                    className="btn btn-outline-secondary btn-lg px-4"
                    onClick={onCancel}
                  >
                    Annuler
                  </button>

                  <button
                    className="btn btn-link text-muted"
                    onClick={sendVerificationEmail}
                    disabled={loading}
                  >
                    Renvoyer l'email
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReservationConfirmation;
