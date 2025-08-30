import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useClientAuth } from '../../context/ClientAuthContext';

const ClientLogin = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const { login, isAuthenticated } = useClientAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/profile';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic validation
        if (!formData.email || !formData.password) {
            setError(t('auth.login.errors.emailRequired'));
            setLoading(false);
            return;
        }

        try {
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                // Redirect to intended page or profile
                const from = location.state?.from?.pathname || '/profile';
                navigate(from, { replace: true });
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('Une erreur inattendue s\'est produite');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="py-5" 
             style={{ background: 'linear-gradient(135deg, #ffeef4 0%, #fff 100%)', minHeight: '80vh' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
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
                                            <FaSignInAlt className="text-white" size={24} />
                                        </div>
                                    </div>
                                    <h2 className="text-dark mb-2">{t('auth.login.title')}</h2>
                                    <p className="text-muted">{t('navigation.login')}</p>
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

                                {/* Login Form */}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label text-dark fw-medium">
                                            {t('auth.login.email')}
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
                                                placeholder={t('auth.login.email')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label text-dark fw-medium">
                                            {t('auth.login.password')}
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
                                                placeholder={t('auth.login.password')}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary border-start-0"
                                                onClick={togglePasswordVisibility}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
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
                                                {t('common.loading')}
                                            </>
                                        ) : (
                                            <>
                                                <FaSignInAlt className="me-2" />
                                                {t('auth.login.loginButton')}
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Footer Links */}
                                <div className="text-center">
                                    <div className="mb-3">
                                        <Link to="/client/forgot-password" className="text-pink text-decoration-none">
                                            {t('auth.login.forgotPassword')}
                                        </Link>
                                    </div>
                                    
                                    <hr className="my-3" />
                                    
                                    <p className="text-muted mb-3">{t('auth.login.noAccount')}</p>
                                    <Link to="/client/signup" className="btn btn-outline-pink w-100">
                                        <FaUserPlus className="me-2" />
                                        {t('auth.login.createAccount')}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
