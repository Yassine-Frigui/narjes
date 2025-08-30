import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Carousel } from 'react-bootstrap'
import { motion } from 'framer-motion';
import { FaHeart, FaStar, FaLeaf, FaSpa, FaQuoteLeft, FaGem } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { publicAPI } from '../../services/api'
import HeroSection from '../../components/HeroSection'

const AboutPage = () => {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [salonInfo, setSalonInfo] = useState(null)

  useEffect(() => {
    fetchTestimonials()
    fetchSalonInfo()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await publicAPI.getAvis(1, 12)
      setTestimonials(response.data.avis)
    } catch (error) {
      console.error('Erreur lors du chargement des témoignages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalonInfo = async () => {
    try {
      const response = await publicAPI.getSpaInfo()
      setSalonInfo(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des informations du salon:', error)
    }
  }

  const values = [
    {
      icon: <FaHeart className="text-warning" />,
      title: t('about.values.feminine_wellness.title'),
      description: t('about.values.feminine_wellness.description')
    },
    {
      icon: <FaLeaf className="text-warning" />,
      title: t('about.values.holistic_approach.title'),
      description: t('about.values.holistic_approach.description')
    },
    {
      icon: <FaSpa className="text-warning" />,
      title: t('about.values.excellence_discretion.title'),
      description: t('about.values.excellence_discretion.description')
    }
  ];

  // Group testimonials by 3 for carousel slides
  const groupedTestimonials = []
  for (let i = 0; i < testimonials.length; i += 3) {
    groupedTestimonials.push(testimonials.slice(i, i + 3))
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-pink"></div>
      </div>
    )
  }

  return (
    <div className="about-page">
      {/* Hero Section */}
      <HeroSection
        title={t('about.hero.title')}
        description={salonInfo?.message_accueil || t('about.hero.subtitle')}
        image={{
          src: '/images/nailstech.jpg',
          alt: salonInfo?.nom_salon || "Beauty Nails - Chez Waad"
        }}
        backgroundType="gradient"
      />

      {/* Mission Section */}
      <section className="py-5">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-green fw-bold mb-4">{t('about.mission.title')}</h2>
                <p className="lead text-muted mb-4">
                  {t('about.mission.description')} 
                  à son essence féminine à travers des soins spécialisés de bien-être intime. 
                  Nos services allient sagesse ancestrale et techniques modernes pour offrir 
                  une expérience de guérison complète.
                </p>
                <p className="text-muted">
                  Nous croyons que le bien-être intime est essentiel à l'épanouissement global 
                  de la femme. C'est pourquoi nous offrons un environnement sûr, confidentiel 
                  et bienveillant où vous pouvez vous détendre, vous ressourcer et célébrer 
                  votre féminité.
                </p>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Values Section */}
      <section className="py-5 bg-light">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-5"
          >
            <h2 className="text-green fw-bold mb-3">Nos Valeurs</h2>
            <p className="lead text-muted">
              Les principes qui guident chaque aspect de notre pratique
            </p>
          </motion.div>

          <Row className="g-4">
            {values.map((value, index) => (
              <Col lg={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="card-green h-100 text-center">
                    <Card.Body className="p-4">
                      <div className="mb-3" style={{ fontSize: '3rem' }}>
                        {value.icon}
                      </div>
                      <Card.Title className="text-green fw-bold mb-3">
                        {value.title}
                      </Card.Title>
                      <Card.Text className="text-muted">
                        {value.description}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-5">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-5"
          >
            <h2 className="text-green fw-bold mb-3">Témoignages de Nos Clientes</h2>
            <p className="lead text-muted">
              Découvrez les expériences transformatrices de nos clientes
            </p>
          </motion.div>

          {groupedTestimonials.length > 0 && (
            <Carousel 
              interval={5000}
              indicators={true}
              controls={true}
              className="testimonials-carousel"
            >
              {groupedTestimonials.map((group, groupIndex) => (
                <Carousel.Item key={groupIndex}>
                  <Row className="g-4">
                    {group.map((testimonial, index) => (
                      <Col lg={4} key={index}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <Card className="card-green h-100 shadow-sm">
                            <Card.Body className="p-4">
                              <div className="text-warning mb-3" style={{ fontSize: '2rem' }}>
                                <FaQuoteLeft />
                              </div>
                              
                              <div className="d-flex mb-3">
                                {[...Array(testimonial.note)].map((_, i) => (
                                  <FaStar key={i} className="text-warning me-1" />
                                ))}
                              </div>
                              
                              <Card.Text className="mb-3 fst-italic">
                                "{testimonial.commentaire}"
                              </Card.Text>
                              
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-green fw-bold">
                                  {testimonial.client_nom}
                                </small>
                                <small className="text-muted">
                                  {new Date(testimonial.date_avis).toLocaleDateString('fr-FR')}
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        </motion.div>
                      </Col>
                    ))}
                  </Row>
                </Carousel.Item>
              ))}
            </Carousel>
          )}
        </Container>
      </section>

      {/* Contact Info */}
      <section className="py-5 ">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-green fw-bold mb-4">Nous Contacter</h2>
                <p className="lead text-muted mb-4">
                  Centre Ikram , Menzah 8 , Tunis
                </p>
                <p className="text-muted mb-4">
                  <strong>Téléphone:</strong> +216 20 777 051 <br />
                  <strong>instagram:</strong> nails_waad
                </p>
                <a 
                  href="/booking" 
                  className="btn btn-green btn-lg rounded-pill px-5"
                >
                  Prendre Rendez-Vous
                </a>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}

export default AboutPage
