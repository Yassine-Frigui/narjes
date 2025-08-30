import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FaUser, 
    FaEnvelope, 
    FaPhone, 
    FaMapMarkerAlt, 
    FaEdit, 
    FaSave, 
    FaTimes, 
    FaLock, 
    FaSignOutAlt, 
    FaEye, 
    FaEyeSlash, 
    FaCheckCircle,
    FaCalendarAlt,
    FaHistory,
    FaSpinner
} from 'react-icons/fa';
import { useClientAuth } from '../../context/ClientAuthContext';
import { clientAPI } from '../../services/api';

const ClientProfile = () => {
    const { client, updateProfile, changePassword, logout } = useClientAuth();
    
    const [activeTab, setActiveTab] = useState('profile');
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reservationsLoading, setReservationsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    
    const [profileData, setProfileData] = useState({
        nom: '',
        prenom: '',
        telephone: '',
        adresse: ''
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [reservations, setReservations] = useState([]);

    // Load client data
    useEffect(() => {
        if (client) {
            setProfileData({
                nom: client.nom || '',
                prenom: client.prenom || '',
                telephone: client.telephone || '',
                adresse: client.adresse || ''
            });
        }
    }, [client]);

    // Load reservations when switching to reservations tab
    useEffect(() => {
        if (activeTab === 'reservations' && client) {
            loadReservations();
        }
    }, [activeTab, client]);

    // Clear messages after delay
    useEffect(() => {
        if (message.content) {
            const timer = setTimeout(() => {
                setMessage({ type: '', content: '' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadReservations = async () => {
        try {
            setReservationsLoading(true);
            const response = await clientAPI.getMyReservations();
            if (response.data && response.data.reservations) {
                setReservations(response.data.reservations);
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
            setMessage({
                type: 'error',
                content: 'Erreur lors du chargement des réservations'
            });
        } finally {
            setReservationsLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        try {
            const result = await updateProfile(profileData);
            
            if (result.success) {
                setMessage({ type: 'success', content: result.message });
                setEditing(false);
            } else {
                setMessage({ type: 'error', content: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', content: 'Une erreur inattendue s\'est produite' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setMessage({ type: 'error', content: 'Veuillez remplir tous les champs' });
            setLoading(false);
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', content: 'Les nouveaux mots de passe ne correspondent pas' });
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setMessage({ type: 'error', content: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
            setLoading(false);
            return;
        }

        try {
            const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
            
            if (result.success) {
                setMessage({ type: 'success', content: result.message });
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setChangingPassword(false);
            } else {
                setMessage({ type: 'error', content: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', content: 'Une erreur inattendue s\'est produite' });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleLogout = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            await logout();
        }
    };

    const cancelEdit = () => {
        setEditing(false);
        setProfileData({
            nom: client?.nom || '',
            prenom: client?.prenom || '',
            telephone: client?.telephone || '',
            adresse: client?.adresse || ''
        });
    };

    const cancelPasswordChange = () => {
        setChangingPassword(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'confirme': return 'success';
            case 'en_attente': return 'warning';
            case 'annule': return 'danger';
            case 'brouillon': return 'secondary';
            default: return 'primary';
        }
    };

    const getStatusText = (statut) => {
        switch (statut) {
            case 'confirme': return 'Confirmée';
            case 'en_attente': return 'En attente';
            case 'annule': return 'Annulée';
            case 'brouillon': return 'Brouillon';
            default: return statut;
        }
    };

    if (!client) {
        return (
            <div className="py-5" style={{ background: 'linear-gradient(135deg, #ffeef4 0%, #fff 100%)', minHeight: '80vh' }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6">
                            <div className="text-center">
                                <div className="spinner-border text-pink" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="text-muted mt-3">Chargement de votre profil...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-5" style={{ background: 'linear-gradient(135deg, #ffeef4 0%, #fff 100%)', minHeight: '80vh' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Header */}
                            <div className="text-center mb-5">
                                <div className="bg-pink rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                     style={{ width: '80px', height: '80px' }}>
                                    <FaUser className="text-white" size={32} />
                                </div>
                                <h1 className="text-dark mb-2">
                                    Bonjour, {client.prenom || client.nom} !
                                </h1>
                                <p className="text-muted">Gérez votre profil et vos informations</p>
                            </div>

                            {/* Message Alert */}
                            {message.content && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`alert alert-${message.type === 'error' ? 'danger' : 'success'} mb-4`}
                                >
                                    {message.content}
                                </motion.div>
                            )}

                            {/* Navigation Tabs */}
                            <div className="card border-0 shadow-lg mb-4" style={{ borderRadius: '20px' }}>
                                <div className="card-body p-0">
                                    <nav className="nav nav-pills nav-fill">
                                        <button
                                            className={`nav-link border-0 px-4 py-3 ${
                                                activeTab === 'profile' ? 'active bg-pink text-white' : 'text-dark'
                                            }`}
                                            onClick={() => setActiveTab('profile')}
                                            style={{ borderRadius: '20px 0 0 20px' }}
                                        >
                                            <FaUser className="me-2" />
                                            Mon Profil
                                        </button>
                                        <button
                                            className={`nav-link border-0 px-4 py-3 ${
                                                activeTab === 'reservations' ? 'active bg-pink text-white' : 'text-dark'
                                            }`}
                                            onClick={() => setActiveTab('reservations')}
                                        >
                                            <FaCalendarAlt className="me-2" />
                                            Mes Réservations
                                        </button>
                                        <button
                                            className={`nav-link border-0 px-4 py-3 ${
                                                activeTab === 'password' ? 'active bg-pink text-white' : 'text-dark'
                                            }`}
                                            onClick={() => setActiveTab('password')}
                                            style={{ borderRadius: '0 20px 20px 0' }}
                                        >
                                            <FaLock className="me-2" />
                                            Sécurité
                                        </button>
                                    </nav>
                                </div>
                            </div>

                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h4 className="text-dark mb-0">
                                                <FaUser className="text-pink me-2" />
                                                Informations personnelles
                                            </h4>
                                            {!editing && (
                                                <button
                                                    className="btn btn-outline-pink btn-sm"
                                                    onClick={() => setEditing(true)}
                                                >
                                                    <FaEdit className="me-1" />
                                                    Modifier
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="card-body p-4">
                                        {editing ? (
                                            <form onSubmit={handleProfileSubmit}>
                                                <div className="row">
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Prénom</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="prenom"
                                                            value={profileData.prenom}
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Nom</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="nom"
                                                            value={profileData.nom}
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Téléphone</label>
                                                        <input
                                                            type="tel"
                                                            className="form-control"
                                                            name="telephone"
                                                            value={profileData.telephone}
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">Email</label>
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            value={client.email}
                                                            disabled
                                                        />
                                                        <small className="text-muted">L'email ne peut pas être modifié</small>
                                                    </div>
                                                    <div className="col-12 mb-4">
                                                        <label className="form-label">Adresse</label>
                                                        <textarea
                                                            className="form-control"
                                                            name="adresse"
                                                            rows="3"
                                                            value={profileData.adresse}
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-pink"
                                                        disabled={loading}
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <FaSpinner className="me-2 fa-spin" />
                                                                Mise à jour...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaSave className="me-1" />
                                                                Sauvegarder
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={cancelEdit}
                                                    >
                                                        <FaTimes className="me-1" />
                                                        Annuler
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <FaUser className="text-pink me-2" />
                                                        <strong>Prénom :</strong>
                                                    </div>
                                                    <p className="text-muted ms-4">{client.prenom || 'Non renseigné'}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <FaUser className="text-pink me-2" />
                                                        <strong>Nom :</strong>
                                                    </div>
                                                    <p className="text-muted ms-4">{client.nom || 'Non renseigné'}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <FaEnvelope className="text-pink me-2" />
                                                        <strong>Email :</strong>
                                                    </div>
                                                    <p className="text-muted ms-4">
                                                        {client.email}
                                                        {client.email_verifie && (
                                                            <FaCheckCircle className="text-success ms-2" title="Email vérifié" />
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <FaPhone className="text-pink me-2" />
                                                        <strong>Téléphone :</strong>
                                                    </div>
                                                    <p className="text-muted ms-4">{client.telephone || 'Non renseigné'}</p>
                                                </div>
                                                <div className="col-12 mb-3">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <FaMapMarkerAlt className="text-pink me-2" />
                                                        <strong>Adresse :</strong>
                                                    </div>
                                                    <p className="text-muted ms-4">{client.adresse || 'Non renseignée'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reservations Tab */}
                            {activeTab === 'reservations' && (
                                <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h4 className="text-dark mb-0">
                                            <FaHistory className="text-pink me-2" />
                                            Historique des réservations
                                        </h4>
                                    </div>
                                    <div className="card-body p-0">
                                        {reservationsLoading ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-pink" role="status"></div>
                                                <p className="text-muted mt-3">Chargement de vos réservations...</p>
                                            </div>
                                        ) : reservations.length === 0 ? (
                                            <div className="text-center py-5">
                                                <FaCalendarAlt className="text-muted mb-3" size={48} />
                                                <h5 className="text-muted">Aucune réservation</h5>
                                                <p className="text-muted">Vous n'avez encore aucune réservation.</p>
                                                <a href="/services" className="btn btn-pink">
                                                    Réserver maintenant
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-hover mb-0">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th className="border-0 px-4 py-3">Service</th>
                                                            <th className="border-0 py-3">Date & Heure</th>
                                                            <th className="border-0 py-3">Prix</th>
                                                            <th className="border-0 py-3">Statut</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reservations.map((reservation, index) => (
                                                            <motion.tr
                                                                key={reservation.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.1, duration: 0.4 }}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <div>
                                                                        <strong className="text-dark">
                                                                            {reservation.service_nom || 'Service'}
                                                                        </strong>
                                                                        <div className="small text-muted">
                                                                            Durée: {reservation.service_duree || '-'} min
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3">
                                                                    <div>
                                                                        <strong className="text-dark">
                                                                            {formatDate(reservation.date_reservation)}
                                                                        </strong>
                                                                        <div className="small text-muted">
                                                                            {reservation.heure_debut}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3">
                                                                    <span className="fw-bold text-dark">
                                                                        {reservation.prix_final || reservation.service_prix || '-'} DT
                                                                    </span>
                                                                </td>
                                                                <td className="py-3">
                                                                    <span className={`badge bg-${getStatusColor(reservation.statut)}`}>
                                                                        {getStatusText(reservation.statut)}
                                                                    </span>
                                                                </td>
                                                            </motion.tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Password Tab */}
                            {activeTab === 'password' && (
                                <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                                    <div className="card-header bg-white border-0 pt-4 pb-3">
                                        <h4 className="text-dark mb-0">
                                            <FaLock className="text-pink me-2" />
                                            Changer le mot de passe
                                        </h4>
                                    </div>
                                    <div className="card-body p-4">
                                        <form onSubmit={handlePasswordSubmit}>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Mot de passe actuel</label>
                                                    <div className="input-group">
                                                        <input
                                                            type={showPasswords.current ? 'text' : 'password'}
                                                            className="form-control"
                                                            name="currentPassword"
                                                            value={passwordData.currentPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => togglePasswordVisibility('current')}
                                                        >
                                                            {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="col-md-6"></div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Nouveau mot de passe</label>
                                                    <div className="input-group">
                                                        <input
                                                            type={showPasswords.new ? 'text' : 'password'}
                                                            className="form-control"
                                                            name="newPassword"
                                                            value={passwordData.newPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => togglePasswordVisibility('new')}
                                                        >
                                                            {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 mb-4">
                                                    <label className="form-label">Confirmer le mot de passe</label>
                                                    <div className="input-group">
                                                        <input
                                                            type={showPasswords.confirm ? 'text' : 'password'}
                                                            className="form-control"
                                                            name="confirmPassword"
                                                            value={passwordData.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => togglePasswordVisibility('confirm')}
                                                        >
                                                            {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="submit"
                                                    className="btn btn-pink"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <FaSpinner className="me-2 fa-spin" />
                                                            Mise à jour...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaSave className="me-1" />
                                                            Changer le mot de passe
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={cancelPasswordChange}
                                                >
                                                    <FaTimes className="me-1" />
                                                    Annuler
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Logout Button */}
                            <div className="text-center mt-4">
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={handleLogout}
                                >
                                    <FaSignOutAlt className="me-2" />
                                    Se déconnecter
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientProfile;