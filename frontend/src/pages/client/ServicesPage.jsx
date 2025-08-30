import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Nav, Badge } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  FaSpa, 
  FaCalendarAlt, 
  FaClock,
  FaMoneyBill,
  FaLeaf,
  FaHeart,
  FaStar,
  FaGem
} from 'react-icons/fa'
import { publicAPI } from '../../services/api'
import HeroSection from '../../components/HeroSection'

const ServicesPage = () => {
  const { t, i18n } = useTranslation()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [i18n.language]) // Re-fetch when language changes

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        publicAPI.getServices(),
        publicAPI.getCategories()
      ])

      // Ensure data is always an array
      setServices(Array.isArray(servicesRes.data?.services) ? servicesRes.data.services : Array.isArray(servicesRes.data) ? servicesRes.data : [])
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
    } catch (error) {
      console.error('Error loading services:', error)
      // Set empty arrays on error
      setServices([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.categorie_id === parseInt(selectedCategory))

  const getServiceIcon = (categoryName) => {
    const icons = {
      'V-Steam': '🌿',
      'Vajacials': '🌸', 
      'Massages et Soins Corps': '💆‍♀️',
      'Waad': '✨',
      'Japanese Head Spa': '🧴',
      'Épilation': '🪒'
    }
    return icons[categoryName] || '🌺'
  }

  const getCategoryColor = (couleur) => {
    return couleur || 'var(--primary-green)'
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-pink"></div>
      </div>
    )
  }

  return (
    <div className="services-page">
      {/* Hero Section */}
      <HeroSection
        title={t('services.title')}
        subtitle={t('services.badge', 'Services premium')}
        description={t('services.subtitle')}
        primaryButton={{
          text: t('common.bookNow', 'Réserver maintenant'),
          to: '/booking',
          icon: FaCalendarAlt,
          variant: 'btn-light'
        }}

        image={{
          src: '/images/nails_example.jpg',
          alt: 'Beauty Nails - Chez Waad'
        }}
        backgroundType="gradient"
      />

      {/* Category Filters */}
      <section className="py-4 bg-light sticky-top">
        <Container>
          <Row>
            <Col>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Nav variant="pills" className="justify-content-center flex-wrap">
                  <Nav.Item className="mb-2">
                    <Nav.Link
                      active={selectedCategory === 'all'}
                      onClick={() => setSelectedCategory('all')}
                      className={`rounded-pill mx-1 ${
                        selectedCategory === 'all' ? 'bg-green text-white' : 'text-soft-green'
                      }`}
                      style={{ 
                        background: selectedCategory === 'all' ? 'var(--primary-green)' : 'text-soft-green+',
                        border: `2px solid var(--primary-green)`
                      }}
                    >
                      <FaStar className="me-2" />
                      {t('services.allServices')}
                      <Badge className="ms-2" bg="light" text="dark">
                        {services.length}
                      </Badge>
                    </Nav.Link>
                  </Nav.Item>
                  
                  {Array.isArray(categories) && categories.map((category) => {
                    const categoryServices = services.filter(s => s.categorie_id === category.id)
                    return (
                      <Nav.Item key={category.id} className="mb-2">
                        <Nav.Link
                          active={selectedCategory === category.id.toString()}
                          onClick={() => setSelectedCategory(category.id.toString())}
                          className={`rounded-pill mx-1 ${
                            selectedCategory === category.id.toString() ? 'text-white' : ''
                          }`}
                          style={{ 
                            background: selectedCategory === category.id.toString() 
                              ? getCategoryColor(category.couleur_theme) 
                              : 'transparent',
                            border: `2px solid ${getCategoryColor(category.couleur_theme)}`,
                            color: selectedCategory === category.id.toString() 
                              ? 'white' 
                              : getCategoryColor(category.couleur_theme)
                          }}
                        >
                          <span className="me-2">{getServiceIcon(category.nom)}</span>
                          {category.nom}
                          <Badge className="ms-2" bg="light" text="dark">
                            {categoryServices.length}
                          </Badge>
                        </Nav.Link>
                      </Nav.Item>
                    )
                  })}
                </Nav>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Services */}
      <section className="py-5">
        <Container>
          {selectedCategory !== 'all' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-5"
            >
              {Array.isArray(categories) && categories
                .filter(cat => cat.id.toString() === selectedCategory)
                .map(category => (
                  <div key={category.id}>
                    <h2 className="fw-bold mb-3" style={{ color: getCategoryColor(category.couleur_theme) }}>
                      <span className="me-3" style={{ fontSize: '2rem' }}>
                        {getServiceIcon(category.nom)}
                      </span>
                      {category.nom}
                    </h2>
                    <p className="lead text-muted mb-4">
                      {category.description}
                    </p>
                  </div>
                ))}
            </motion.div>
          )}

          <Row className="g-4">
            {Array.isArray(filteredServices) && filteredServices.map((service, index) => (
              <Col lg={4} md={6} key={service.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="service-card h-100 border-0 shadow-sm position-relative overflow-hidden">
                    {/* Popular/New badges */}
                    {Boolean(service.populaire) && (
                      <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 2 }}>
                        <Badge bg="warning" className="rounded-pill">
                          <FaHeart className="me-1" />
                          Populaire
                        </Badge>
                      </div>
                    )}
                    {Boolean(service.nouveau) && (
                      <div className="position-absolute top-0 start-0 m-3" style={{ zIndex: 2 }}>
                        <Badge bg="success" className="rounded-pill">
                          <FaStar className="me-1" />
                          New
                        </Badge>
                      </div>
                    )}

                    {/* Category icon background */}
                    <div 
                      className="position-absolute top-0 end-0 opacity-25"
                      style={{ 
                        fontSize: '4rem',
                        transform: 'translate(25%, -25%)',
                        color: getCategoryColor(service.couleur_theme)
                      }}
                    >
                      {getServiceIcon(service.categorie)}
                    </div>

                    <Card.Body className="p-4 position-relative">
                      <div className="mb-3">
                        <span 
                          className="badge rounded-pill px-3 py-2 small"
                          style={{ 
                            background: getCategoryColor(service.couleur_theme),
                            color: 'white'
                          }}
                        >
                          {service.categorie}
                        </span>
                      </div>

                      <Card.Title className="fw-bold mb-3" style={{ color: getCategoryColor(service.couleur_theme) }}>
                        {service.nom}
                      </Card.Title>

                      <Card.Text className="text-muted mb-4">
                        {service.description}
                      </Card.Text>

                      {/* Price and duration */}
                      <Row className="align-items-center mb-4">
                        <Col>
                          <div className="d-flex align-items-center text-muted small">
                            <FaClock className="me-2" />
                            {service.duree} {t('services.minutes')}
                          </div>
                        </Col>
                        <Col className="text-end">
                          <div className="service-price d-flex align-items-center justify-content-end">
                            <FaMoneyBill className="me-1 small" />
                            {service.prix} TND 
                          </div>
                        </Col>
                      </Row>

                      {/* Additional information */}
                      {service.materiel_necessaire && (
                        <div className="mb-3">
                          <small className="text-muted">
                            <FaGem className="me-2" />
                            {service.materiel_necessaire}
                          </small>
                        </div>
                      )}

                      {service.instructions_speciales && (
                        <div className="mb-3">
                          <small className="text-info">
                            💡 {service.instructions_speciales}
                          </small>
                        </div>
                      )}

                      <div className="d-grid gap-2">
                        <Link 
                          to={`/services/${service.id}`}
                          className="btn btn-outline-green"
                          style={{ background: `linear-gradient(135deg, var(--snow), var(--snow ) ` }}
                        >
                          View Details
                        </Link>
                        <Link 
                          to={`/booking?service=${service.id}`}
                          className="btn btn-green"
                          style={{
                            background: `linear-gradient(135deg, var(--accent-green), var(--accent-green))`
                          }}
                        >
                          <FaCalendarAlt className="me-2" />
                          {t('services.bookService')}
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>

          {filteredServices.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-5"
            >
              <div style={{ fontSize: '4rem' }} className="mb-3">🔍</div>
              <h3 className="text-muted">{t('services.noServicesFound')}</h3>
              <p className="text-muted">
                {t('services.tryDifferentCategory')}
              </p>
            </motion.div>
          )}
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-5 bg-soft-green">
        <Container>
          <Row className="text-center">
            <Col>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-green fw-bold mb-4">
                  {t('services.cta.title')}
                </h3>
                <p className="lead text-muted mb-4">
                  {t('services.cta.description')}
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Link to="/contact" className="btn btn-outline-green">
                    <FaCalendarAlt className="me-2" />
                    {t('contact.title')}
                  </Link>
                  <Link to="/booking" className="btn btn-green">
                    <FaCalendarAlt className="me-2" />
                    {t('booking.title')}
                  </Link>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}

export default ServicesPage
