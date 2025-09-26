-- NBrow Studio Database - Clean Version
-- Transformation from nail salon to French-only eyebrow studio
-- Updated: September 26, 2025

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ============================================================================
-- CORE BUSINESS TABLES (KEPT AND CLEANED)
-- ============================================================================

-- Categories table removed - services will not be categorized

--
-- Table structure for table `clients`
-- Keep clients table as is (essential for reservations)
--

DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prenom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `mot_de_passe` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email_verifie` tinyint(1) DEFAULT '0',
  `langue_preferee` varchar(5) COLLATE utf8mb4_general_ci DEFAULT 'fr',
  `statut` enum('actif','inactif') COLLATE utf8mb4_general_ci DEFAULT 'actif',
  `telephone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `adresse` text COLLATE utf8mb4_general_ci,
  `notes` text COLLATE utf8mb4_general_ci,
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Keep existing client data
INSERT INTO `clients` VALUES 
(1,'Marie','Dupont','marie.dupont@email.com',NULL,1,'fr','actif','514-555-0123',NULL,NULL,NULL,1,'2025-07-17 13:10:32','2025-08-04 13:16:32'),
(2,'Yassine','FRIGUI','friguiyassine750@gmail.com',NULL,1,'fr','actif','111111111111',NULL,NULL,NULL,1,'2025-07-17 19:31:32','2025-08-13 21:52:31'),
(3,'User','Test','testmple.com','$2a$12$OxMRvS0TtDBXo4orwxeLwe2nJjp1bpI3FbCcGNzh8IgjbULXUJYQ2',0,'fr','actif','12345678',NULL,NULL,NULL,1,'2025-08-13 11:40:58','2025-08-13 21:21:07'),
(12,'Yassine','Frigui','yassinefrigui9@gmail.com','$2a$12$LvD27O7YwzZFmeSzFiD9Du5c9JaqJUfGMQHbDtFqVim5XA9ou9fLa',1,'fr','actif','+21653278997',NULL,NULL,NULL,1,'2025-08-13 22:44:35','2025-08-13 22:44:35');

--
-- Table structure for table `services`
-- Replace all nail services with NBrow eyebrow services
--

DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `description_detaillee` text COLLATE utf8mb4_general_ci,
  `service_type` enum('base','variant','package','addon') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'base',
  `parent_service_id` int DEFAULT NULL,
  `prix` decimal(10,2) NOT NULL,
  `duree` int NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `inclus` text COLLATE utf8mb4_general_ci,
  `contre_indications` text COLLATE utf8mb4_general_ci,
  `conseils_apres_soin` text COLLATE utf8mb4_general_ci,
  `nombre_sessions` int DEFAULT NULL,
  `prix_par_session` decimal(10,2) DEFAULT NULL,
  `validite_jours` int DEFAULT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `populaire` tinyint(1) DEFAULT '0',
  `nouveau` tinyint(1) DEFAULT '0',
  `ordre_affichage` int DEFAULT '0',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `services_ibfk_2` (`parent_service_id`),
  CONSTRAINT `services_ibfk_2` FOREIGN KEY (`parent_service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert NBrow eyebrow services
INSERT INTO `services` VALUES 
(1,'Microblading','Technique de restructuration des sourcils poil par poil','Technique semi-permanente qui redessine vos sourcils avec un effet naturel poil par poil. Idéal pour combler les zones clairsemées et redéfinir la forme de vos sourcils.','base',NULL,280.00,120,'/images/microblading.jpg','Consultation, design personnalisé, anesthésie locale, pigmentation','Grossesse, allaitement, diabète non contrôlé, traitement anticoagulant','Éviter l\'eau et la transpiration pendant 7 jours, appliquer la crème cicatrisante',NULL,NULL,NULL,1,1,0,1,NOW()),
(2,'Microshading','Technique d\'ombrage doux pour des sourcils poudrés','Technique semi-permanente créant un effet poudré et ombragé naturel. Parfait pour un look plus dense et défini, idéal pour tous types de peau.','base',NULL,320.00,150,'/images/microshading.jpg','Consultation, design, anesthésie, pigmentation par ombrage','Grossesse, allaitement, problèmes de cicatrisation, infections cutanées','Ne pas exposer au soleil pendant 10 jours, pas de gommage sur la zone',NULL,NULL,NULL,1,1,1,2,NOW()),
(3,'Nanocombo','Combinaison microblading et microshading pour un résultat optimal','Technique hybride combinant le tracé poil par poil du microblading et l\'ombrage du microshading pour un résultat ultra-naturel et volumineux.','base',NULL,380.00,180,'/images/nanocombo.jpg','Consultation approfondie, double technique, anesthésie renforcée','Même contre-indications que microblading et microshading','Suivi rigoureux post-soin, pas de maquillage sur la zone pendant 10 jours',NULL,NULL,NULL,1,1,1,3,NOW()),
(4,'Bblips','Technique avancée de pigmentation des lèvres','Pigmentation semi-permanente des lèvres pour une couleur naturelle et durable. Redessine le contour et intensifie la couleur naturelle.','base',NULL,350.00,120,'/images/bblips.jpg','Design du contour, choix de la couleur, pigmentation complète','Herpès labial actif, grossesse, allergie aux pigments','Appliquer un baume cicatrisant, éviter les aliments épicés pendant 5 jours',NULL,NULL,NULL,1,0,1,4,NOW()),
(5,'Correction couleurs sourcils','Correction et harmonisation des couleurs de sourcils existants','Service de correction pour les sourcils précédemment pigmentés. Neutralise les couleurs indésirables et harmonise le résultat final.','base',NULL,250.00,90,'/images/correction-couleurs.jpg','Analyse des pigments existants, correction par neutralisation','Sourcils récemment traités (moins de 4 semaines), irritations','Patience pendant la période de cicatrisation, possibilité de plusieurs séances',NULL,NULL,NULL,1,0,0,5,NOW());

--
-- Table structure for table `reservations`
-- Keep reservations table but clean old data and adapt to new services
--

DROP TABLE IF EXISTS `reservations`;
CREATE TABLE `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int DEFAULT NULL,
  `service_id` int NOT NULL,
  `date_reservation` date NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `statut` enum('en_attente','confirmee','en_cours','terminee','annulee','no_show','draft') COLLATE utf8mb4_general_ci DEFAULT 'en_attente',
  `reservation_status` enum('draft','reserved','confirmed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'draft',
  `prix_service` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prix_final` decimal(10,2) NOT NULL DEFAULT '0.00',
  `client_nom` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `client_prenom` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `client_telephone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `client_email` varchar(191) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes_client` text COLLATE utf8mb4_general_ci,
  `verification_code` varchar(6) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verification_token` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `session_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `couleurs_choisies` text COLLATE utf8mb4_general_ci,
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reservations_ibfk_1` (`client_id`),
  KEY `reservations_ibfk_2` (`service_id`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Clean sample reservations with new NBrow services
INSERT INTO `reservations` VALUES 
(1,1,1,'2025-10-15','10:00:00','12:00:00','confirmee','confirmed',280.00,280.00,'Dupont','Marie','514-555-0123','marie.dupont@email.com','Première séance microblading','123456',NULL,NULL,NULL,NOW(),NOW()),
(2,2,2,'2025-10-18','14:00:00','16:30:00','en_attente','reserved',320.00,320.00,'FRIGUI','Yassine','111111111111','friguiyassine750@gmail.com','Microshading - retouche','789012',NULL,NULL,NULL,NOW(),NOW());

--
-- Table structure for table `reservation_items`
-- Keep for multi-service bookings
--

DROP TABLE IF EXISTS `reservation_items`;
CREATE TABLE `reservation_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `service_id` int NOT NULL,
  `item_type` enum('main','addon') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'main',
  `prix` decimal(10,2) NOT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `reservation_items_ibfk_1` (`reservation_id`),
  KEY `reservation_items_ibfk_2` (`service_id`),
  CONSTRAINT `reservation_items_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservation_items_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `creneaux_horaires`
-- Keep business hours scheduling
--

DROP TABLE IF EXISTS `creneaux_horaires`;
CREATE TABLE `creneaux_horaires` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jour_semaine` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') COLLATE utf8mb4_general_ci NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- NBrow Studio opening hours
INSERT INTO `creneaux_horaires` VALUES 
(1,'lundi','09:00:00','18:00:00',1,NOW()),
(2,'mardi','09:00:00','18:00:00',1,NOW()),
(3,'mercredi','09:00:00','18:00:00',1,NOW()),
(4,'jeudi','09:00:00','19:00:00',1,NOW()),
(5,'vendredi','09:00:00','19:00:00',1,NOW()),
(6,'samedi','09:00:00','17:00:00',1,NOW());

--
-- Table structure for table `fermetures_exceptionnelles`
-- Keep for holiday closures
--

DROP TABLE IF EXISTS `fermetures_exceptionnelles`;
CREATE TABLE `fermetures_exceptionnelles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date_fermeture` date NOT NULL,
  `raison` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `toute_journee` tinyint(1) DEFAULT '1',
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `parametres_salon`
-- Update with NBrow Studio information
--

DROP TABLE IF EXISTS `parametres_salon`;
CREATE TABLE `parametres_salon` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom_salon` varchar(150) COLLATE utf8mb4_general_ci DEFAULT 'NBrow Studio by Narjes',
  `adresse` text COLLATE utf8mb4_general_ci,
  `telephone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '+216 24 157 715',
  `email` varchar(191) COLLATE utf8mb4_general_ci DEFAULT 'contact@nbrowstudio.tn',
  `site_web` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'https://nbrowstudio.tn',
  `horaires_ouverture` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `couleur_principale` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#8B4A6B',
  `couleur_secondaire` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#D4A5C7',
  `logo_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT '/images/nbrow_logo.png',
  `message_accueil` text COLLATE utf8mb4_general_ci,
  `politique_annulation` text COLLATE utf8mb4_general_ci,
  `cgv` text COLLATE utf8mb4_general_ci,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `parametres_salon` VALUES 
(1,'NBrow Studio by Narjes','Tunis, Tunisia','+216 24 157 715','contact@nbrowstudio.tn','https://nbrowstudio.tn','{"lundi":"9h-18h","mardi":"9h-18h","mercredi":"9h-18h","jeudi":"9h-19h","vendredi":"9h-19h","samedi":"9h-17h","dimanche":"Fermé"}','#8B4A6B','#D4A5C7','/images/nbrow_logo.png','Studio spécialisé dans la beauté des sourcils avec des techniques semi-permanentes de haute qualité par Narjes, experte certifiée.','Annulation gratuite jusqu\'à 48h avant le rendez-vous pour les services semi-permanents.','Conditions générales de vente NBrow Studio.',NOW());

--
-- Table structure for table `utilisateurs`
-- Keep admin access
--

DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE `utilisateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `mot_de_passe` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('admin','employe','super_admin') COLLATE utf8mb4_general_ci DEFAULT 'employe',
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `utilisateurs` VALUES 
(1,'Narjes - NBrow Studio','admin@nbrowstudio.tn','$2b$12$rOz8kWKKU5PjU7eGBEtNruQcL4M2FT8Vh5XGjGVOhKQnhK5M4C4sO','super_admin',1,NOW());

-- ============================================================================
-- AUTHENTICATION & SECURITY TABLES (KEPT)
-- ============================================================================

--
-- Client authentication tables
--

DROP TABLE IF EXISTS `client_login_attempts`;
CREATE TABLE `client_login_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `attempted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_agent` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `client_login_attempts_ibfk_1` (`client_id`),
  CONSTRAINT `client_login_attempts_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `client_sessions`;
CREATE TABLE `client_sessions` (
  `id` varchar(128) COLLATE utf8mb4_general_ci NOT NULL,
  `client_id` int NOT NULL,
  `data` text COLLATE utf8mb4_general_ci,
  `expires` datetime NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `token` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `client_sessions_ibfk_1` (`client_id`),
  CONSTRAINT `client_sessions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `client_verification_tokens`;
CREATE TABLE `client_verification_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('email','password_reset') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'email',
  `expires_at` datetime NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_verification_tokens_ibfk_1` (`client_id`),
  CONSTRAINT `client_verification_tokens_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `verification_code` varchar(6) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `password_reset_tokens_ibfk_1` (`client_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `security_settings`;
CREATE TABLE `security_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `date_modification` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `security_settings` VALUES 
(1,'password_reset_token_expiry_hours','24','Password reset token expiry in hours',NOW()),
(2,'session_timeout_hours','24','Client session timeout in hours',NOW()),
(3,'require_email_verification','1','Require email verification for new accounts',NOW()),
(4,'min_password_length','8','Minimum password length',NOW()),
(5,'max_login_attempts','5','Maximum login attempts before temporary lockout',NOW()),
(6,'lockout_duration_minutes','15','Duration of temporary lockout in minutes',NOW());

-- ============================================================================
-- REMOVED TABLES
-- ============================================================================

-- The following tables have been completely removed as they are not needed 
-- for NBrow Studio business model:

-- REMOVED: Translation tables (French-only business)
-- - categories_services_translations
-- - services_translations  
-- - parametres_salon_translations

-- REMOVED: Nail salon specific tables
-- - avis_clients (client reviews)
-- - inventaire (inventory management)
-- - promotions (promotional codes)

-- REMOVED: Unused business features
-- - expenses (expense tracking)
-- - influencer_events (influencer marketing)
-- - influencer_links (influencer tracking)

-- ============================================================================
-- FINAL SETTINGS
-- ============================================================================

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- NBrow Studio Database Cleanup Complete
-- Database now contains only essential tables for eyebrow studio business
-- All translation tables removed (French-only)
-- Services updated to 5 NBrow specialties
-- Ready for import and use