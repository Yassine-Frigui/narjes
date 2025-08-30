import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowLeft, FaKey } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { clientAPI } from '../../services/api';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState('email'); // 'email', 'code', 'success'
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic email validation
        if (!email || !email.includes('@')) {
            setError(t('auth.forgotPassword.errors.invalidEmail'));
            setLoading(false);
            return;
        }

        try {
            await clientAPI.forgotPassword(email);
            setStep('code');
        } catch (error) {
            setError(error.response?.data?.message || t('auth.forgotPassword.errors.general'));
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!verificationCode || verificationCode.length !== 6) {
            setError('Veuillez entrer un code de vérification valide de 6 chiffres');
            setLoading(false);
            return;
        }

        try {
            const response = await clientAPI.verifyResetCode(email, verificationCode);
            // Redirect to reset password page with the token
            navigate(`/client/reset-password?token=${response.data.token}`);
        } catch (error) {
            setError(error.response?.data?.message || 'Code de vérification invalide');
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

    // Code verification step
    if (step === 'code') {
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
                                        <div className="mb-3">
                                            <FaKey className="text-pink" size={40} />
                                        </div>
                                        <h2 className="text-pink mb-2">Code de vérification</h2>
                                        <p className="text-muted">
                                            Entrez le code de 6 chiffres envoyé à<br />
                                            <strong>{email}</strong>
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger mb-3" role="alert">
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleCodeSubmit}>
                                        <div className="mb-4">
                                            <input
                                                type="text"
                                                className="form-control form-control-lg text-center"
                                                style={{ fontSize: '24px', letterSpacing: '8px' }}
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                maxLength="6"
                                                required
                                            />
                                        </div>

                                        <div className="d-grid gap-2 mb-3">
                                            <button
                                                type="submit"
                                                className="btn btn-pink"
                                                disabled={loading || verificationCode.length !== 6}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Vérification...
                                                    </>
                                                ) : (
                                                    'Vérifier le code'
                                                )}
                                            </button>
                                        </div>
                                    </form>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            className="btn btn-link text-muted p-0"
                                            onClick={() => setStep('email')}
                                        >
                                            <FaArrowLeft className="me-1" />
                                            Retour
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Email input step (default)
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
                                    <h1 className="text-pink mb-3">{t('auth.forgotPassword.title')}</h1>
                                    <p className="text-muted">
                                        {t('auth.forgotPassword.subtitle')}
                                    </p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleEmailSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="email" className="form-label text-dark fw-bold">
                                            {t('auth.forgotPassword.emailAddress')}
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-pink text-white">
                                                <FaEnvelope />
                                            </span>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                name="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                                                required
                                                disabled={loading}
                                            />
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
                                                    {t('auth.forgotPassword.sending')}
                                                </>
                                            ) : (
                                                <>
                                                    <FaEnvelope className="me-2" />
                                                    {t('auth.forgotPassword.sendLink')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>

                                <div className="text-center">
                                    <Link to="/client/login" className="text-muted text-decoration-none">
                                        <FaArrowLeft className="me-2" />
                                        {t('auth.forgotPassword.backToLogin')}
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

export default ForgotPassword;
