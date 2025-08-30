import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaClock, 
  FaMoneyBill, 
  FaCalendarAlt, 
  FaArrowLeft, 
  FaStar,
  FaCheck,
  FaInfoCircle
} from 'react-icons/fa';
import { publicAPI } from '../../services/api';

const ServiceDetailPage = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServiceDetail();
  }, [id]);

  const fetchServiceDetail = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getServiceById(id);
      const serviceData = response.data || response;
      setService(serviceData);

      // Fetch related services from same category
      if (serviceData.categorie_id) {
        const relatedResponse = await publicAPI.getServicesByCategory(serviceData.categorie_id);
        const relatedData = relatedResponse.data || relatedResponse;
        setRelatedServices(Array.isArray(relatedData) ? relatedData.filter(s => s.id !== parseInt(id)) : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du service:', error);
      setError('Service non trouvé');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center main-content" style={{ height: '80vh' }}>
        <div className="spinner-green"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container main-content" style={{ minHeight: '60vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <h3 className="text-green mb-4">Soin non trouvé</h3>
            <Link to="/services" className="btn btn-green">
              <FaArrowLeft className="me-2" />
              Retour aux soins
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="service-detail-page main-content">
      {/* Header */}
      <section className="py-4 bg-light">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/" className="text-green">Accueil</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/services" className="text-green">Soins</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {service.nom}
              </li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Service Detail */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mb-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="card-green h-100 p-4">
                  <div className="d-flex align-items-center mb-4">
                    <div className="service-icon bg-gradient-footer text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                         style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                      🌿
                    </div>
                    <div>
                      <h1 className="h2 text-green mb-1">{service.nom}</h1>
                      <span className="badge badge-green">{service.categorie_nom}</span>
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-4 mb-3">
                      <div className="d-flex align-items-center text-green">
                        <FaClock className="me-2" />
                        <div>
                          <div className="fw-bold">{service.duree} minutes</div>
                          <small className="text-muted">Durée</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="d-flex align-items-center text-green">
                        <FaMoneyBill className="me-2" />
                        <div>
                          <div className="fw-bold">{service.prix} DT</div>
                          <small className="text-muted">Prix</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="d-flex align-items-center text-green">
                        <FaStar className="me-2" />
                        <div>
                          <div className="fw-bold">★★★★★</div>
                          <small className="text-muted">Très populaire</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-green mb-3">
                      <FaInfoCircle className="me-2" />
                      Description du service
                    </h4>
                    <p className="text-muted lh-lg">
                      {service.description_detaillee || service.description || 
                       "Ce service vous offre une expérience de beauté exceptionnelle dans un cadre relaxant et professionnel. Nos expertes utilisent des produits de haute qualité pour vous garantir un résultat parfait."}
                    </p>
                  </div>

                  {service.inclus && (
                    <div className="mb-4">
                      <h5 className="text-green mb-3">
                        <FaCheck className="me-2" />
                        Ce qui est inclus :
                      </h5>
                      <div className="row">
                        {service.inclus.split(',').map((item, index) => (
                          <div key={index} className="col-md-6 mb-2">
                            <div className="d-flex align-items-center">
                              <FaCheck className="text-success me-2" />
                              <span>{item.trim()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {service.conseils_apres_soin && (
                    <div className="mb-4">
                      <h5 className="text-green mb-3">
                        <FaInfoCircle className="me-2" />
                        Conseils après-soin :
                      </h5>
                      <div className="alert alert-light border-green">
                        <p className="mb-0 text-muted">{service.conseils_apres_soin}</p>
                      </div>
                    </div>
                  )}

                  {service.contre_indications && (
                    <div className="mb-4">
                      <h5 className="text-danger mb-3">
                        <FaInfoCircle className="me-2" />
                        Important à savoir :
                      </h5>
                      <div className="alert alert-warning">
                        <p className="mb-0">{service.contre_indications}</p>
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-3 flex-wrap">
                    <Link 
                      to={`/booking?service=${service.id}`} 
                      className="btn btn-green btn-lg"
                    >
                      <FaCalendarAlt className="me-2" />
                      Réserver maintenant
                    </Link>
                    <Link to="/services" className="btn btn-outline-green btn-lg">
                      <FaArrowLeft className="me-2" />
                      Tous les services
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {/* Quick Booking */}
                <div className="card-green p-4 mb-4">
                  <h5 className="text-green mb-3">Réservation rapide</h5>
                  <p className="text-muted mb-3">
                    Réservez ce service en quelques clics
                  </p>
                  <Link 
                    to={`/booking?service=${service.id}`} 
                    className="btn btn-green w-100 mb-2"
                  >
                    <FaCalendarAlt className="me-2" />
                    Réserver
                  </Link>
                  <Link to="/contact" className="btn btn-outline-green w-100">
                    Nous contacter
                  </Link>
                </div>

                {/* Related Services */}
                {relatedServices.length > 0 && (
                  <div className="card-green p-4">
                    <h5 className="text-green mb-3">Services similaires</h5>
                    {relatedServices.slice(0, 3).map((relatedService) => (
                      <div key={relatedService.id} className="border-bottom pb-3 mb-3 last:border-0">
                        <Link 
                          to={`/services/${relatedService.id}`}
                          className="text-decoration-none"
                        >
                          <h6 className="text-green mb-1">{relatedService.nom}</h6>
                          <div className="d-flex justify-content-between text-muted small">
                            <span>{relatedService.duree} min</span>
                            <span className="fw-bold text-green">{relatedService.prix} DT</span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceDetailPage;
