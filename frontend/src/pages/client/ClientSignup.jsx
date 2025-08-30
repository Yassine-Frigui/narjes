import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash, FaUserPlus, FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useClientAuth } from '../../context/ClientAuthContext';

function ClientSignup() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });
    
    const { register, isAuthenticated } = useClientAuth();
    const navigate = useNavigate();
    
    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/profile', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Check password strength
    useEffect(() => {
        const password = formData.password;
        setPasswordStrength({
            length: password.length >= 6, // Reduced from 8 to 6
            uppercase: false, // Removed requirement
            lowercase: true, // Always true since we don't require this
            number: false, // Removed requirement  
            special: false // Removed requirement
        });
    }, [formData.password]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
        if (success) setSuccess('');
    };

    const validateForm = () => {
        if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone || !formData.password || !formData.confirmPassword) {
            setError(t('auth.signup.errors.firstNameRequired'));
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.signup.errors.passwordsMatch'));
            return false;
        }

        if (formData.password.length < 6) {
            setError(t('auth.signup.errors.passwordMinLength'));
            return false;
        }

        // Simplified password validation - only check basic requirements
        if (!passwordStrength.length) {
            setError(t('auth.signup.errors.passwordMinLength'));
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError(t('auth.signup.errors.emailInvalid'));
            return false;
        }

        // Phone validation for Tunisia - exactly 8 digits
        const phoneRegex = /^[0-9]{8}$/;
        if (!phoneRegex.test(formData.telephone)) {
            setError(t('auth.signup.errors.phoneInvalid'));
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const userData = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                telephone: formData.telephone,
                mot_de_passe: formData.password
            };

            const result = await register(userData);
            
            if (result.success) {
                setSuccess(result.message);
                // Clear form
                setFormData({
                    nom: '',
                    prenom: '',
                    email: '',
                    telephone: '',
                    password: '',
                    confirmPassword: ''
                });
                
                // Redirect to login after a delay
                setTimeout(() => {
                    navigate('/client/login', { 
                        state: { 
                            message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.' 
                        } 
                    });
                }, 2000);
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('Une erreur inattendue s\'est produite');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        if (field === 'password') {
            setShowPassword(!showPassword);
        } else {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    return (
        <div className="py-5" 
             style={{ background: 'linear-gradient(135deg, #ffeef4 0%, #fff 100%)', minHeight: '80vh' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="card shadow-lg border-0"
                            style={{ borderRadius: '20px' }}
                        >
                            <div className="card-body p-5">
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <div className="mb-3">
                                        <div className="bg-pink rounded-circle d-inline-flex align-items-center justify-content-center"
                                             style={{ width: '60px', height: '60px' }}>
                                            <FaUserPlus className="text-white" size={24} />
                                        </div>
                                    </div>
                                    <h2 className="text-dark mb-2">{t('auth.signup.title')}</h2>
                                    <p className="text-muted">{t('auth.signup.subtitle')}</p>
                                </div>

                                {/* Error Alert */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="alert alert-danger mb-4"
                                        role="alert"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Success Alert */}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="alert alert-success mb-4"
                                        role="alert"
                                    >
                                        {success}
                                    </motion.div>
                                )}

                                {/* Signup Form */}
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="prenom" className="form-label text-dark fw-medium">
                                                {t('auth.signup.firstName')}
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0">
                                                    <FaUser className="text-muted" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0"
                                                    id="prenom"
                                                    name="prenom"
                                                    value={formData.prenom}
                                                    onChange={handleChange}
                                                    placeholder={t('auth.signup.firstName')}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="nom" className="form-label text-dark fw-medium">
                                                {t('auth.signup.lastName')}
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0">
                                                    <FaUser className="text-muted" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0"
                                                    id="nom"
                                                    name="nom"
                                                    value={formData.nom}
                                                    onChange={handleChange}
                                                    placeholder={t('auth.signup.lastName')}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label text-dark fw-medium">
                                            {t('auth.signup.email')}
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <FaEnvelope className="text-muted" />
                                            </span>
                                            <input
                                                type="email"
                                                className="form-control border-start-0"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder={t('auth.signup.email')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="telephone" className="form-label text-dark fw-medium">
                                            {t('auth.signup.phone')}
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <FaPhone className="text-muted" />
                                            </span>
                                            <span className="input-group-text bg-light border-start-0 border-end-0 text-muted">
                                                +216
                                            </span>
                                            <input
                                                type="tel"
                                                className="form-control border-start-0"
                                                id="telephone"
                                                name="telephone"
                                                value={formData.telephone}
                                                onChange={handleChange}
                                                placeholder={t('auth.signup.phone')}
                                                maxLength="8"
                                                pattern="[0-9]{8}"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="password" className="form-label text-dark fw-medium">
                                            {t('auth.signup.password')}
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <FaLock className="text-muted" />
                                            </span>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-control border-start-0 border-end-0"
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder={t('auth.signup.password')}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary border-start-0"
                                                onClick={() => togglePasswordVisibility('password')}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        
                                        {/* Password Strength Indicator */}
                                        {formData.password && (
                                            <div className="mt-2">
                                                <small className="text-muted">{t('auth.signup.password')}:</small>
                                                <div className="d-flex flex-wrap gap-2 mt-1">
                                                    <small 
                                                        className={passwordStrength.length ? 'text-success' : 'text-muted'}
                                                    >
                                                        {passwordStrength.length && <FaCheck className="me-1" />}
                                                        {t('auth.signup.password')}
                                                    </small>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="confirmPassword" className="form-label text-dark fw-medium">
                                            {t('auth.signup.confirmPassword')}
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <FaLock className="text-muted" />
                                            </span>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className="form-control border-start-0 border-end-0"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder={t('auth.signup.confirmPassword')}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary border-start-0"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-pink w-100 py-2 mb-3"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">{t('common.loading')}</span>
                                                </span>
                                                {t('auth.signup.creating')}
                                            </>
                                        ) : (
                                            <>
                                                <FaUserPlus className="me-2" />
                                                {t('auth.signup.createAccount')}
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Footer Links */}
                                <div className="text-center">
                                    <hr className="my-3" />
                                    
                                    <p className="text-muted mb-3">{t('auth.signup.alreadyHaveAccount')}</p>
                                    <Link to="/client/login" className="btn btn-outline-pink w-100">
                                        {t('auth.signup.signIn')}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );

}
export default ClientSignup;