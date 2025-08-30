import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { clientAPI } from '../../services/api';

const ResetPassword = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(null);

    // Verify token on component mount
    useEffect(() => {
        if (!token) {
            setError(t('auth.resetPassword.errors.missingToken'));
            setTokenValid(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await clientAPI.verifyResetToken(token);
                setTokenValid(response.data.valid);
                if (!response.data.valid) {
                    setError(response.data.message || t('auth.resetPassword.errors.invalidToken'));
                }
            } catch (error) {
                setTokenValid(false);
                setError(t('auth.resetPassword.errors.verificationError'));
            }
        };

        verifyToken();
    }, [token]);

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

        // Validation
        if (!formData.newPassword || !formData.confirmPassword) {
            setError(t('auth.resetPassword.errors.allFieldsRequired'));
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            setError(t('auth.resetPassword.errors.passwordTooShort'));
            setLoading(false);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError(t('auth.resetPassword.errors.passwordMismatch'));
            setLoading(false);
            return;
        }

        try {
            await clientAPI.resetPassword(token, formData.newPassword);
            setSuccess(true);
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/client/login', { 
                    state: { message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' }
                });
            }, 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Erreur lors de la réinitialisation');
        } finally {
            setLoading(false);
        }
    };

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 }
    };

    const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.5
    };

    // Loading state while verifying token
    if (tokenValid === null) {
        return (
            <div className="py-5 bg-light d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-pink" role="status">
                        <span className="visually-hidden">Vérification...</span>
                    </div>
                    <p className="mt-3 text-muted">{t('auth.resetPassword.verifying')}</p>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="py-5 bg-light" style={{ minHeight: '80vh' }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 col-lg-4">
                            <motion.div
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                                className="card shadow-lg border-0"
                            >
                                <div className="card-body p-5">
                                    <div className="text-center">
                                        <div className="mb-3">
                                            <FaCheck className="text-success" size={60} />
                                        </div>
                                        <h2 className="text-pink mb-3">{t('auth.resetPassword.success')}</h2>
                                        <p className="text-muted mb-4">
                                            {t('auth.resetPassword.successMessage')}
                                        </p>
                                        <p className="text-muted small">
                                            {t('auth.resetPassword.redirecting')}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Invalid token state
    if (!tokenValid) {
        return (
            <div className="py-5 bg-light" style={{ minHeight: '80vh' }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6 col-lg-4">
                            <motion.div
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                                className="card shadow-lg border-0"
                            >
                                <div className="card-body p-5">
                                    <div className="text-center">
                                        <div className="mb-3">
                                            <FaExclamationTriangle className="text-warning" size={60} />
                                        </div>
                                        <h2 className="text-pink mb-3">Token invalide</h2>
                                        <p className="text-muted mb-4">
                                            {error || 'Le lien de réinitialisation est invalide ou a expiré.'}
                                        </p>
                                        <div className="d-grid gap-2">
                                            <Link to="/client/forgot-password" className="btn btn-pink">
                                                Demander un nouveau lien
                                            </Link>
                                            <Link to="/client/login" className="btn btn-outline-secondary">
                                                Retour à la connexion
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Reset password form
    return (
        <div className="py-5 bg-light" style={{ minHeight: '80vh' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-4">
                        <motion.div
                            initial="initial"
                            animate="in"
                            exit="out"
                            variants={pageVariants}
                            transition={pageTransition}
                            className="card shadow-lg border-0"
                        >
                            <div className="card-body p-5">
                                <div className="text-center mb-4">
                                    <h1 className="text-pink mb-3">{t('auth.resetPassword.title')}</h1>
                                    <p className="text-muted">
                                        {t('auth.resetPassword.instruction')}
                                    </p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="newPassword" className="form-label text-dark fw-bold">
                                            Nouveau mot de passe
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-pink text-white">
                                                <FaLock />
                                            </span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control"
                                                id="newPassword"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                placeholder="Au moins 6 caractères"
                                                required
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={loading}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="confirmPassword" className="form-label text-dark fw-bold">
                                            Confirmer le mot de passe
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-pink text-white">
                                                <FaLock />
                                            </span>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="form-control"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Confirmez votre mot de passe"
                                                required
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                disabled={loading}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="d-grid gap-2 mb-3">
                                        <button 
                                            type="submit" 
                                            className="btn btn-pink btn-lg"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Réinitialisation...
                                                </>
                                            ) : (
                                                <>
                                                    <FaCheck className="me-2" />
                                                    Réinitialiser le mot de passe
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>

                                <div className="text-center">
                                    <Link to="/client/login" className="text-muted text-decoration-none">
                                        Retour à la connexion
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

export default ResetPassword;
