import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  FaStar,
  FaCalendarAlt, 
  FaHeart,
  FaLeaf,
  FaSpa,
  FaGift,
  FaImages,
  FaGem
} from 'react-icons/fa'

import { publicAPI } from '../../services/api'
import HeroSection from '../../components/HeroSection'

const HomePage = () => {
  const { t, i18n } = useTranslation()

  const [popularServices, setPopularServices] = useState([])
  const [newServices, setNewServices] = useState([])
  const [avis, setAvis] = useState([])
  const [spaInfo, setSpaInfo] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [i18n.language]) // Re-fetch when language changes

  const fetchData = async () => {
    try {
      const [popularRes, newRes, avisRes, spaRes] = await Promise.all([
        publicAPI.getPopularServices(4),
        publicAPI.getNewServices(3),
        publicAPI.getAvis(1, 6),
        publicAPI.getSpaInfo()
      ])

      // Ensure data is always an array
      setPopularServices(Array.isArray(popularRes.data) ? popularRes.data : [])
      setNewServices(Array.isArray(newRes.data?.services) ? newRes.data.services : Array.isArray(newRes.data) ? newRes.data : [])
      setAvis(Array.isArray(avisRes.data?.avis) ? avisRes.data.avis : [])
      setSpaInfo(spaRes.data || {})
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      // Set empty arrays on error
      setPopularServices([])
      setNewServices([])
      setAvis([])
      setSpaInfo({})
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-pink"></div>
      </div>
    )
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <HeroSection
        title={t('home.hero.title')}
        subtitle={t('home.hero.sanctuary_badge', 'Salon de beauté des ongles spécialisé')}
        description={spaInfo?.message_accueil || t('home.hero.subtitle')}
        primaryButton={{
          text: t('home.hero.bookNow'),
          to: '/booking',
          icon: FaCalendarAlt,
          variant: 'btn-light'
        }}
        secondaryButton={{
          text: t('home.hero.discoverServices'),
          to: '/services',
          icon: FaGem,
          variant: 'btn-outline-light'
        }}
        image={{
          src: '/images/chez_waad_beauty.jpg',
          alt: 'Beauty Nails - Chez Waad'
        }}
        backgroundType="gradient"
      />

      {/* Services Populaires */}
      <section className="py-5 bg-light">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-5"
          >
            <h2 className="text-green fw-bold mb-3">
              <FaHeart className="me-3" />
              {t('home.featuredServices')}
            </h2>
            <p className="lead text-muted">
              {t('home.featuredServicesDesc', 'Découvrez pourquoi nos clients adorent ces soins')}
            </p>
          </motion.div>
          <Row className="g-4">
            {Array.isArray(popularServices) && popularServices.map((service, index) => (
              <Col md={6} lg={3} key={service.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="service-card h-100 border-0 shadow-sm">
                    <Card.Body className="text-center p-4">
                      <div className="mb-3" style={{ fontSize: '3rem' }}>
                        {index === 0 && '💆‍♀️'}
                        {index === 1 && '🌸'}
                        {index === 2 && '🧴'}
                        {index === 3 && '✨'}
                      </div>
                      <Card.Title className="text-green fw-bold mb-3">
                        {service.nom}
                      </Card.Title>
                      <Card.Text className="text-muted small mb-3">
                        {service.description}
                      </Card.Text>
                      <div className="mb-3">
                        <span className="service-price">{service.prix}DT</span>
                        <div className="service-duration small">
                          {service.duree} {t('services.minutes')}
                        </div>
                      </div>
                      <Link to="/booking" className="btn btn-green btn-sm">
                        {t('home.hero.bookNow')}
                      </Link>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-5"
          >
            <Link to="/services" className="btn btn-outline-green btn-lg">
              {t('home.viewAllServices')}
            </Link>
          </motion.div>
        </Container>
      </section>

      {/* Nouveautés */}
      {newServices.length > 0 && (
        <section className="py-5 bg-soft-green">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-5"
            >
              <h2 className="text-green fw-bold mb-3">
                <FaGift className="me-3" />
                {t('home.newServices.title')}
              </h2>
              <p className="lead text-muted">
                {t('home.newServices.description')}
              </p>
            </motion.div>

            <Row className="g-4">
              {Array.isArray(newServices) && newServices.map((service, index) => (
                <Col lg={4} key={service.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="card-green h-100">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <Card.Title className="text-green fw-bold">
                            {service.nom}
                          </Card.Title>
                          <span className="badge bg-warning text-dark rounded-pill">
                            {t('home.newServices.badge')}
                          </span>
                        </div>
                        <Card.Text className="text-muted mb-3">
                          {service.description}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="service-price">{service.prix}DT</span>
                            <div className="service-duration small">
                              {service.duree} {t('services.minutes')}
                            </div>
                          </div>
                          <Link to="/booking" className="btn btn-green">
                            {t('home.newServices.tryButton')}
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* Galerie de nos réalisations */}
      <section className="py-5 bg-light">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-5"
          >
            <h2 className="text-green fw-bold mb-3">
              <FaImages className="me-3" />
              {t('home.gallery.title')}
            </h2>
            <p className="lead text-muted">
              {t('home.gallery.description')}
            </p>
          </motion.div>

          <Row className="g-4">
            {[
              { name: 'chez_waad_beauty.jpg', title: 'Accueil Chez Waad Beauty' },
              { name: 'lashes.jpg', title: 'Salle V-Steam' },
              { name: 'nails_feet_1.jpg', title: 'Suite Vajacial' },
              { name: 'nailstudio_logo.jpg', title: 'Espace Relaxation' },
              { name: 'nails1.jpg', title: 'Head Spa Japonais' },
              { name: 'nails2.jpg', title: 'Salle de Rituels' }
            ].map((item, index) => (
              <Col md={6} lg={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="gallery-item"
                >
                  <div className="overflow-hidden rounded-4 shadow-lg position-relative">
                    <img 
                      src={`/images/${item.name}`}
                      alt={item.title}
                      className="w-100"
                      style={{ 
                        height: '250px', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div 
                      className="w-100 h-100 d-flex align-items-center justify-content-center bg-soft-green position-absolute top-0"
                      style={{ display: 'none', fontSize: '3rem' }}
                    >
                      {index === 0 ? '🌿' : index === 1 ? '🌸' : index === 2 ? '💆‍♀️' : index === 3 ? '✨' : index === 4 ? '🧴' : '🪒'}
                    </div>
                    <div className="position-absolute bottom-0 start-0 w-100 p-3 text-white" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                      <h6 className="mb-0">{item.title}</h6>
                    </div>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>

          <Row className="mt-5">
            <Col className="text-center">
              <Link to="/services" className="btn btn-green btn-lg rounded-pill px-5">
                <FaSpa className="me-2" />
                {t('home.viewAllServices')}
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Avis Clients */}
      {avis.length > 0 && (
        <section className="py-5">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-5"
            >
              <h2 className="text-green fw-bold mb-3">
                <FaStar className="me-3" />
                {t('home.testimonials.title')}
              </h2>
              <p className="lead text-muted">
                {t('home.testimonials.description')}
              </p>
            </motion.div>

            <Row className="g-4">
              {Array.isArray(avis) && avis.slice(0, 3).map((avis, index) => (
                <Col lg={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="card-green h-100">
                      <Card.Body className="p-4">
                        <div className="d-flex mb-3">
                          {[...Array(Math.floor(avis.note || 0))].map((_, i) => (
                            <FaStar
                              key={i} 
                              className="text-warning me-1" 
                            />
                          ))}
                        </div>
                        <Card.Text className="mb-3 fst-italic">
                          "{avis.commentaire}"
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted fw-bold">
                            {avis.client_nom}
                          </small>
                          <small className="text-muted">
                            {new Date(avis.date_avis).toLocaleDateString('fr-FR')}
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-5 bg-gradient-footer text-white">
        <Container>
          <Row className="text-center">
            <Col>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="fw-bold mb-4">
                  {t('home.cta.title')}
                </h2>
                <p className="lead mb-4 opacity-90">
                  {t('home.cta.description')}
                </p>
                <Link to="/booking" className="btn btn-light btn-lg rounded-pill px-5">
                  <FaCalendarAlt className="me-2" />
                  {t('home.cta.button')}
                </Link>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}

export default HomePage
