import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPhone, FaArrowLeft, FaClock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const PhoneContactPage = () => {
    const { t } = useTranslation();

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

    return (
        <div className="py-5 bg-light" style={{ minHeight: '80vh' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
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
                                        <FaPhone className="text-pink" size={60} />
                                    </div>
                                    <h2 className="text-pink mb-3">Vérification par téléphone</h2>
                                    <p className="text-muted">
                                        Ne vous inquiétez pas ! Notre équipe peut vous aider à récupérer l'accès à votre compte par téléphone pour vérifier votre identité.
                                    </p>
                                </div>

                                <div className="bg-light p-4 rounded mb-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <FaClock className="text-muted me-2" />
                                        <strong>Heures de contact :</strong>
                                    </div>
                                    <ul className="list-unstyled mb-0">
                                        <li>• Lundi - Vendredi : 9h00 - 18h00</li>
                                        <li>• Samedi : 9h00 - 16h00</li>
                                        <li>• Dimanche : Fermé</li>
                                    </ul>
                                </div>

                                <div className="alert alert-info" role="alert">
                                    <strong>Comment ça marche :</strong><br />
                                    Appelez-nous directement au <strong>+216 24 157 715</strong> pendant nos heures d'ouverture. Notre équipe vérifiera votre identité et vous aidera à récupérer l'accès à votre compte.
                                </div>

                                <div className="d-grid gap-2 mb-3">
                                    <Link to="/client/login" className="btn btn-pink">
                                        <FaArrowLeft className="me-2" />
                                        Retour à la connexion
                                    </Link>
                                </div>

                                <div className="text-center">
                                    <p className="text-muted small mb-2">
                                        Vous avez retrouvé l'accès à votre email ?
                                    </p>
                                    <Link to="/client/forgot-password" className="text-pink text-decoration-none">
                                        Essayer la réinitialisation par email
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

export default PhoneContactPage;
