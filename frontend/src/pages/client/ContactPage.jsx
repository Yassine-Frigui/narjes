import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaClock, 
  FaInstagram, 
  FaPaperPlane,
  FaHeart,
  FaComment,
  FaGem
} from 'react-icons/fa';
import HeroSection from '../../components/HeroSection';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    sujet: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simuler l'envoi du message
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setFormData({
        nom: '',
        email: '',
        sujet: '',
        message: ''
      });
    } catch (error) {
      setError('Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt className="text-primary" size={24} />,
      title: "Adresse",
      details: [
        "Centre Ikram,Menzah 8,",
        " Tunis, Tunisie",
      ]
    },
    {
      icon: <FaPhone className="text-primary" size={24} />,
      title: "Téléphone",
      details: [
        "01 23 45 67 89",
        "06 12 34 56 78"
      ]
    },
    {
      icon: <FaEnvelope className="text-primary" size={24} />,
      title: "Email",
      details: [
        "contact@beauty-nails-waad.tn",
        "reservation@beauty-nails-waad.tn"
      ]
    },
    {
      icon: <FaClock className="text-primary" size={24} />,
      title: "Horaires",
      details: [
        "Mon - Sat: 9h00 - 19h00", 
        ""
      ]
    }
  ];

  const socialLinks = [
    {
      icon: <FaInstagram />,
      name: "Instagram",
      url: "https://www.instagram.com/chez_waad.beautynails/",
      color: "instagram",
      followers: "4.3K"
    },

  ];

  const faqItems = [
    {
      question: "Comment prendre rendez-vous ?",
      answer: "Vous pouvez réserver en ligne via notre page de réservation, nous appeler directement ou nous écrire par email."
    },
    {
      question: "Puis-je annuler ou modifier ma réservation ?",
      answer: "Oui, vous pouvez modifier ou annuler votre réservation jusqu'à 4h avant l'heure prévue en nous contactant."
    },
    {
      question: "Quels moyens de paiement acceptez-vous ?",
      answer: "Nous acceptons les espèces, cartes bancaires, et les paiements sans contact."
    },
    {
      question: "Proposez-vous des forfaits ou des cartes de fidélité ?",
      answer: "Oui, nous avons plusieurs forfaits avantageux et un programme de fidélité pour nos clientes régulières."
    }
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <HeroSection
        title="Contactez-nous"
        subtitle="Service client premium"
        description="Nous sommes là pour répondre à toutes vos questions et vous aider à planifier votre prochaine expérience beauté."
        primaryButton={{
          text: "Prendre votre rendez-vous",
          to: '/booking',
          icon: FaHeart,
          variant: 'btn-light'
        }}
        image={{
          src: "images/hydrafacial.jpg",
          alt: "Contact Beauty Nails - Chez Waad"
        }}
        backgroundType="gradient"
      />

      {/* Contact Info Section */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                className="col-lg-3 col-md-6 mb-4"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="contact-card h-100 text-center p-4 border-0 rounded-3 shadow-sm hover-lift">
                  <div className="icon-wrapper mb-3 d-flex justify-content-center">
                    {info.icon}
                  </div>
                  <h5 className="fw-bold text-primary mb-3">{info.title}</h5>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-muted mb-1">{detail}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Map Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            {/* Contact Form */}
            <div className="col-lg-6 mb-5">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="fw-bold text-green mb-4">
                  <FaComment className="me-3" />
                  Envoyez-nous un message
                </h2>
                
                {success ? (
                  <motion.div
                    className="alert alert-success border-0 rounded-3 p-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h5 className="fw-bold mb-2">Message envoyé avec succès !</h5>
                    <p className="mb-0">
                      Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                    </p>
                    <button
                      className="btn btn-outline-success mt-3"
                      onClick={() => setSuccess(false)}
                    >
                      Envoyer un autre message
                    </button>
                  </motion.div>
                ) : (
                  <div className="contact-form bg-white rounded-3 shadow-sm p-4">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Nom complet *</label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="nom"
                          value={formData.nom}
                          onChange={handleInputChange}
                          required
                          placeholder="Votre nom complet"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Email *</label>
                        <input
                          type="email"
                          className="form-control form-control-lg"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="votre@email.com"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Sujet *</label>
                        <select
                          className="form-select form-select-lg"
                          name="sujet"
                          value={formData.sujet}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Choisir un sujet</option>
                          <option value="reservation">Réservation</option>
                          <option value="information">Demande d'information</option>
                          <option value="reclamation">Réclamation</option>
                          <option value="partenariat">Partenariat</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label fw-semibold">Message *</label>
                        <textarea
                          className="form-control"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows="5"
                          placeholder="Votre message..."
                        />
                      </div>

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
                      
                      <button
                        type="submit"
                        className="btn btn-green btn-lg w-100"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane className="me-2" />
                            Envoyer le message
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Map */}
            <div className="col-lg-6">
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="h-100"
              >
                <h2 className="fw-bold text-green mb-4">Notre emplacement</h2>
                <div className="map-container bg-white rounded-3 shadow-sm p-3" style={{ height: '400px' }}>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3192.4348657579962!2d10.165080875217063!3d36.85600857223121!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd3355d480b6dd%3A0x2a95d3a970231827!2z2YXYsdmD2LIg2KXZg9ix2KfZhQ!5e0!3m2!1sen!2stn!4v1756146087823!5m2!1sen!2stn" 
                    height="100%"
                    width="100%"
                    style={{ border: 0, borderRadius: '8px' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Chez Waad Beauty Location - Centre Ikram Menzah 8"
                  />
                </div>
                <div className="mt-3 p-3 bg-soft-green rounded-3 border border-green">
                  <p className="mb-0 text-green">
                    <FaMapMarkerAlt className="me-2" />
                    <strong>Facilement accessible</strong> en métro (ligne 1, 6, 9) 
                    et en bus. Parking public à proximité.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-5">
        <div className="container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <h2 className="fw-bold text-green mb-4">Suivez-nous</h2>
            <p className="lead text-muted">
              Découvrez nos dernières créations et restez informée de nos actualités
            </p>
          </motion.div>

          <div className="row justify-content-center">
            {socialLinks.map((social, index) => (
              <motion.div
                key={index}
                className="col-md-4 col-lg-3 mb-4"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.a
                  href={social.url}
                  className={`social-card d-block text-decoration-none bg-white rounded-3 shadow-sm p-4 text-center h-100 border-0 social-${social.color}`}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="social-icon mb-3 d-flex justify-content-center align-items-center mx-auto"
                       style={{ 
                         width: '60px', 
                         height: '60px', 
                         borderRadius: '50%',
                         background: social.color === 'instagram' 
                           ? 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' 
                           : '#1877f2'
                       }}>
                    <span className="text-white fs-4">{social.icon}</span>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">{social.name}</h5>
                  <p className="text-muted mb-0">{social.followers} abonnés</p>
                </motion.a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <h2 className="fw-bold text-green mb-4">Questions fréquentes</h2>
            <p className="lead text-muted">
              Trouvez rapidement les réponses à vos questions
            </p>
          </motion.div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                {faqItems.map((item, index) => (
                  <motion.div
                    key={index}
                    className="accordion-item border-0 shadow-sm mb-3 rounded-3 overflow-hidden"
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <h5 className="accordion-header">
                      <button
                        className="accordion-button fw-bold text-green bg-white"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#faq${index}`}
                        aria-expanded={index === 0}
                      >
                        {item.question}
                      </button>
                    </h5>
                    <div
                      id={`faq${index}`}
                      className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="accordion-body bg-soft-green text-muted">
                        {item.answer}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-4 bg-soft-green">
        <div className="container">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="row align-items-center text-center text-md-start"
          >
            <div className="col-md-8">
              <h5 className="text-dark fw-bold mb-2">Besoin d'aide urgente ?</h5>
              <p className="text-dark mb-0 opacity-90">
                Pour toute urgence ou question de dernière minute, n'hésitez pas à nous appeler directement.
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <a href="tel:0123456789" className="btn btn-light btn-lg fw-bold">
                <FaPhone className="me-2" />
                01 23 45 67 89
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
