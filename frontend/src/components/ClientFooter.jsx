import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaHeart
} from 'react-icons/fa'

const ClientFooter = () => {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { icon: FaInstagram, url: '#', label: 'Instagram' },
    { icon: FaFacebookF, url: '#', label: 'Facebook' },
    { icon: FaTiktok, url: '#', label: 'TikTok' }
  ]

  const quickLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/services', label: 'Nos Services' },
    { to: '/reservation', label: 'Réserver' },
    { to: '/a-propos', label: 'À Propos' },
    { to: '/contact', label: 'Contact' }
  ]

  return (
    <footer className="bg-gradient-footer text-white py-5 mt-auto">
      <Container>
        <Row className="g-4">
          {/* Logo et description */}
          <Col md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="d-flex align-items-center mb-3">
                <img 
                  src="/images/chez_waad_beauty.jpg" 
                  alt="Waad Beauty"
                  style={{ 
                    height: '50px', 
                    marginRight: '15px', 
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
                <h4 className="fw-bold mb-0">
                  Chez Waad Beauty Nails
                </h4>
              </div>
              <p className="mb-3 text-white">
                Your premier destination for intimate wellness and holistic healing, creating unforgettable moments of peace and reconnection.
              </p>
              <div className="d-flex gap-3">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href={social.url}
                      className="text-white fs-4"
                      whileHover={{ scale: 1.2, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      title={social.label}
                    >
                      <IconComponent />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </Col>

          {/* Liens rapides */}
          <Col md={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h5 className="fw-bold mb-3">Liens Rapides</h5>
              <ul className="list-unstyled">
                {quickLinks.map((link, index) => (
                  <li key={index} className="mb-2">
                    <Link 
                      to={link.to} 
                      className="text-white text-decoration-none"
                      style={{ opacity: 0.9 }}
                    >
                      <motion.div whileHover={{ x: 5 }}>
                        {link.label}
                      </motion.div>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </Col>

          {/* Horaires */}
          <Col md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h5 className="fw-bold mb-3">Horaires d'Ouverture</h5>
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span>Lundi - Mercredi</span>
                  <span>9h - 19h</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Jeudi - Vendredi</span>
                  <span>9h - 20h</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Samedi</span>
                  <span>9h - 18h</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Dimanche</span>
                  <span className="text-warning">Fermé</span>
                </div>
              </div>
            </motion.div>
          </Col>

          {/* Contact */}
          <Col md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h5 className="fw-bold mb-3">Contact</h5>
              <div className="d-flex align-items-center mb-2">
                <FaMapMarkerAlt className="me-3" />
                <small>9777 Yonge Street, Richmond Hill, ON L4C 1T9, Canada</small>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaPhone className="me-3" />
                <small>905-605-1188</small>
              </div>
              <div className="d-flex align-items-center mb-3">
                <FaEnvelope className="me-3" />
                <small>info@chezwaad.ca</small>
              </div>
              <Link to="/booking" className="btn btn-outline-light btn-sm rounded-pill px-3">
                <FaHeart className="me-2" />
                Prendre RDV
              </Link>
            </motion.div>
          </Col>
        </Row>

        <hr className="my-4" style={{ opacity: 0.3 }} />

        {/* Copyright */}
        <Row>
          <Col className="text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <small>
                © {currentYear} Chez Waad Beauty Nails. Tous droits réservés. 
                <span className="ms-2">
                  Fait avec <FaHeart className="text-danger" /> pour votre bien-être
                </span>
              </small>
            </motion.div>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        footer a:hover {
          color: #8fbbb8 !important;
          transition: color 0.3s ease;
        }
      `}</style>
    </footer>
  )
}

export default ClientFooter
