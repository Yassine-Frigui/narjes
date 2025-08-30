import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaGem, FaStar, FaHeart } from 'react-icons/fa';

const HeroSection = ({ 
  title, 
  subtitle, 
  description, 
  primaryButton, 
  secondaryButton,
  image,
  backgroundType = 'gradient' // 'gradient', 'image', 'solid'
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const getBackgroundStyle = () => {
    switch (backgroundType) {
      case 'gradient':
        return {
          background: 'var(--gradient-primary)',
          color: 'var(--white)'
        };
      case 'light':
        return {
          background: 'var(--gradient-light)',
          color: 'var(--text-dark)'
        };
      case 'solid':
        return {
          background: 'var(--primary-pink)',
          color: 'var(--white)'
        };
      default:
        return {
          background: 'var(--gradient-primary)',
          color: 'var(--white)'
        };
    }
  };

  return (
    <section 
      className="hero-section position-relative overflow-hidden"
      style={{ 
        marginTop: '76px', 
        minHeight: '70vh',
        ...getBackgroundStyle()
      }}
    >
      {/* Background Pattern */}
      <div className="position-absolute w-100 h-100" style={{
        background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        zIndex: -1
      }}></div>
      
      <Container className="h-100 d-flex align-items-center py-5">
        <Row className="w-100 align-items-center">
          <Col lg={6}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-content"
            >
              {subtitle && (
                <motion.div variants={itemVariants} className="mb-4">
                  <span className="badge bg-light text-primary px-3 py-2 rounded-pill">
                    {subtitle}
                  </span>
                </motion.div>
              )}
              
              <motion.h1 
                variants={itemVariants} 
                className="display-4 fw-bold mb-4"
                style={{ 
                  lineHeight: '1.2',
                  color: backgroundType === 'light' ? 'var(--text-dark)' : 'inherit'
                }}
              >
                {title}
              </motion.h1>
              
              {description && (
                <motion.p 
                  variants={itemVariants} 
                  className="lead mb-5"
                  style={{ 
                    opacity: 0.9,
                    color: backgroundType === 'light' ? 'var(--text-light)' : 'inherit'
                  }}
                >
                  {description}
                </motion.p>
              )}
              
              {(primaryButton || secondaryButton) && (
                <motion.div 
                  variants={itemVariants} 
                  className="d-flex flex-wrap gap-3"
                >
                  {primaryButton && (
                    <Link 
                      to={primaryButton.to || '#'} 
                      className={`btn ${primaryButton.variant || 'btn-light'} btn-lg rounded-pill px-4`}
                      onClick={primaryButton.onClick}
                    >
                      {primaryButton.icon && <primaryButton.icon className="me-2" />}
                      {primaryButton.text}
                    </Link>
                  )}
                  {secondaryButton && (
                    <Link 
                      to={secondaryButton.to || '#'} 
                      className={`btn ${secondaryButton.variant || 'btn-outline-light'} btn-lg rounded-pill px-4`}
                      onClick={secondaryButton.onClick}
                    >
                      {secondaryButton.icon && <secondaryButton.icon className="me-2" />}
                      {secondaryButton.text}
                    </Link>
                  )}
                </motion.div>
              )}
            </motion.div>
          </Col>
          
          {image && (
            <Col lg={6} className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="position-relative"
              >
                <div className="float-animation">
                  <div 
                    className="rounded-circle mx-auto d-flex align-items-center justify-content-center overflow-hidden"
                    style={{
                      width: '350px',
                      height: '350px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <img 
                      src={image.src}
                      alt={image.alt}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
                
                {/* Floating decorative elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="position-absolute"
                  style={{ top: '10%', right: '10%', fontSize: '30px', color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  <FaStar />
                </motion.div>
                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="position-absolute"
                  style={{ bottom: '20%', left: '5%', fontSize: '25px', color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  <FaGem />
                </motion.div>
                <motion.div
                  animate={{ y: [-5, 15, -5] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="position-absolute"
                  style={{ top: '60%', right: '5%', fontSize: '20px', color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  <FaHeart />
                </motion.div>
              </motion.div>
            </Col>
          )}
        </Row>
      </Container>

      <style jsx>{`
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
