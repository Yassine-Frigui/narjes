-- MySQL dump 10.13  Distrib 9.1.0, for Win64 (x86_64)
--
-- Host: mysql-13f99065-yassinefrigui9-b835.g.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.35

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '066bbc5b-9ae0-11f0-bf69-069b24584bdc:1-15,
1ef2f62a-8659-11f0-b401-3a826b58740d:1-116,
ef15af9b-81b4-11f0-a97f-96c52198a404:1-27';

--
-- Table structure for table `avis_clients`
--

DROP TABLE IF EXISTS `avis_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avis_clients` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `note` decimal(2,1) NOT NULL,
  `commentaire` text COLLATE utf8mb4_general_ci,
  `date_avis` datetime NOT NULL,
  `visible` tinyint(1) DEFAULT '1',
  `reponse_admin` text COLLATE utf8mb4_general_ci,
  `date_reponse` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `avis_clients_ibfk_1` (`client_id`),
  CONSTRAINT `avis_clients_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avis_clients`
--

LOCK TABLES `avis_clients` WRITE;
/*!40000 ALTER TABLE `avis_clients` DISABLE KEYS */;
INSERT INTO `avis_clients` VALUES (1,1,5.0,'Service excellent, tr├¿s professionnel!','2025-08-13 09:59:19',1,NULL,NULL,'2025-08-13 09:59:19','2025-08-13 09:59:19'),(2,2,4.5,'Tr├¿s satisfaite du r├®sultat, je recommande!','2025-08-13 09:59:19',1,NULL,NULL,'2025-08-13 09:59:19','2025-08-13 09:59:19');
/*!40000 ALTER TABLE `avis_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories_services`
--

DROP TABLE IF EXISTS `categories_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories_services` (
  `id` int NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `couleur_theme` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#2e4d4c',
  `ordre_affichage` int DEFAULT '0',
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories_services`
--

LOCK TABLES `categories_services` WRITE;
/*!40000 ALTER TABLE `categories_services` DISABLE KEYS */;
INSERT INTO `categories_services` VALUES (1,'Manucure','Services complets de manucure avec soin des cuticules et pose de vernis','#d4789b',1,1,'2025-07-17 13:10:31'),(2,'P├®dicure','Soins des pieds complets avec pon├ºage, hydratation et pose de vernis','#f4c2c2',2,1,'2025-07-17 13:10:31'),(3,'Nail Art','Cr├®ations artistiques sur ongles avec designs personnalis├®s et d├®cors','#b85a7a',3,1,'2025-07-17 13:10:31'),(4,'Extensions','Pose de capsules et faux ongles avec gel ou r├®sine','#e4a5c7',4,1,'2025-07-17 13:10:31'),(5,'Soins des Ongles','Traitements sp├®cialis├®s pour renforcer et soigner les ongles','#fdf2f4',5,1,'2025-07-17 13:10:31'),(6,'Packages','Forfaits combin├®s pour une exp├®rience beaut├® compl├¿te','#8b4361',6,1,'2025-07-17 13:10:31');
/*!40000 ALTER TABLE `categories_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories_services_translations`
--

DROP TABLE IF EXISTS `categories_services_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories_services_translations` (
  `id` int NOT NULL,
  `category_id` int NOT NULL,
  `language_code` varchar(5) COLLATE utf8mb4_general_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `date_creation` datetime NOT NULL,
  `date_modification` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categories_services_translations_ibfk_1` (`category_id`),
  CONSTRAINT `categories_services_translations_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories_services_translations`
--

LOCK TABLES `categories_services_translations` WRITE;
/*!40000 ALTER TABLE `categories_services_translations` DISABLE KEYS */;
INSERT INTO `categories_services_translations` VALUES (15,2,'ar','Ï¿┘èÏ»┘è┘â┘èÏ▒','Ïº┘äÏ╣┘åÏº┘èÏ® Ïº┘ä┘âÏº┘à┘äÏ® Ï¿Ïº┘ä┘éÏ»┘à┘è┘å ┘àÏ╣ Ïº┘äÏ¿Ï▒Ï» ┘êÏº┘äÏ¬Ï▒ÏÀ┘èÏ¿ ┘ê┘êÏÂÏ╣ Ïº┘äÏÀ┘äÏºÏí','2025-08-04 13:16:48','2025-08-17 18:07:11'),(16,3,'ar','┘ü┘å Ïº┘äÏúÏ©Ïº┘üÏ▒','ÏÑÏ¿Ï»ÏºÏ╣ÏºÏ¬ ┘ü┘å┘èÏ® Ï╣┘ä┘ë Ïº┘äÏúÏ©Ïº┘üÏ▒ ┘àÏ╣ Ï¬ÏÁÏº┘à┘è┘à ┘àÏ«ÏÁÏÁÏ® ┘êÏ▓Ï«ÏºÏ▒┘ü','2025-08-04 13:16:48','2025-08-17 18:07:11'),(17,4,'ar','ÏÑÏÀÏº┘äÏ® Ïº┘äÏúÏ©Ïº┘üÏ▒','Ï¬Ï▒┘â┘èÏ¿ ÏúÏÀÏ▒Ïº┘ü Ïº┘äÏúÏ©Ïº┘üÏ▒ Ïº┘äÏÁ┘åÏºÏ╣┘èÏ® ┘êÏº┘äÏ¼┘ä Ïú┘ê Ïº┘äÏú┘âÏ▒┘è┘ä┘è┘â','2025-08-04 13:16:48','2025-08-17 18:07:11'),(18,5,'ar','Ï╣┘äÏºÏ¼ÏºÏ¬ Ïº┘äÏúÏ©Ïº┘üÏ▒','Ï╣┘äÏºÏ¼ÏºÏ¬ ┘àÏ¬Ï«ÏÁÏÁÏ® ┘äÏ¬┘é┘ê┘èÏ® ┘êÏº┘äÏ╣┘åÏº┘èÏ® Ï¿Ïº┘äÏúÏ©Ïº┘üÏ▒','2025-08-04 13:16:48','2025-08-17 18:07:11'),(19,6,'ar','Ï¿Ïº┘éÏºÏ¬','Ï¿Ïº┘éÏºÏ¬ ┘àÏ»┘àÏ¼Ï® ┘äÏ¬Ï¼Ï▒Ï¿Ï® Ï¼┘àÏº┘ä ┘âÏº┘à┘äÏ®','2025-08-04 13:16:48','2025-08-17 18:07:11');
/*!40000 ALTER TABLE `categories_services_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_login_attempts`
--

DROP TABLE IF EXISTS `client_login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_login_attempts` (
  `id` int NOT NULL,
  `client_id` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `attempted_at` datetime NOT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `client_login_attempts_ibfk_1` (`client_id`),
  CONSTRAINT `client_login_attempts_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Login attempt tracking for security';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_login_attempts`
--

LOCK TABLES `client_login_attempts` WRITE;
/*!40000 ALTER TABLE `client_login_attempts` DISABLE KEYS */;
INSERT INTO `client_login_attempts` VALUES (1,5,'::1',1,'2025-08-13 11:49:12',NULL);
/*!40000 ALTER TABLE `client_login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_sessions`
--

DROP TABLE IF EXISTS `client_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_sessions` (
  `id` varchar(128) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Session ID',
  `client_id` int NOT NULL COMMENT 'Client ID',
  `data` text COLLATE utf8mb4_general_ci COMMENT 'Session data in JSON format',
  `expires` datetime NOT NULL COMMENT 'Session expiration timestamp',
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Client IP address',
  `user_agent` text COLLATE utf8mb4_general_ci COMMENT 'Client user agent string',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `token` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'JWT token',
  `expires_at` datetime NOT NULL COMMENT 'Alternative expiration field',
  PRIMARY KEY (`id`),
  KEY `client_sessions_ibfk_1` (`client_id`),
  CONSTRAINT `client_sessions_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Client sessions for authentication';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_sessions`
--

LOCK TABLES `client_sessions` WRITE;
/*!40000 ALTER TABLE `client_sessions` DISABLE KEYS */;
INSERT INTO `client_sessions` VALUES ('a81cc0b1-629b-4c4c-a357-401dcb2a6af2',5,NULL,'2025-08-13 11:49:12','::1','curl/8.13.0','2025-08-13 11:49:12','2025-08-13 11:49:12','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6NSwidHlwZSI6ImNsaWVudCIsImlhdCI6MTc1NTA4NTc1MiwiZXhwIjoxNzU1NjkwNTUyfQ.b3ZMcTlRr3KZFLUiRUS9qM_EFeGbM3UwH4eGz60P26k','2025-08-20 11:49:12');
/*!40000 ALTER TABLE `client_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client_verification_tokens`
--

DROP TABLE IF EXISTS `client_verification_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_verification_tokens` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('email','password_reset') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'email',
  `expires_at` datetime NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `client_verification_tokens_ibfk_1` (`client_id`),
  CONSTRAINT `client_verification_tokens_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Client verification tokens for email verification and password reset';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_verification_tokens`
--

LOCK TABLES `client_verification_tokens` WRITE;
/*!40000 ALTER TABLE `client_verification_tokens` DISABLE KEYS */;
INSERT INTO `client_verification_tokens` VALUES (1,3,'0c1f7ff97af7bf4f56b9c4ddf9fbccfac03019ba6b2ad0f097f32cbdf88f0ecd','email','2025-08-14 11:40:58',NULL,'2025-08-13 11:40:58'),(2,4,'dae556bef576530f4ca22247cc42fd7cee17c90f486f465464595a6140b6fbf1','email','2025-08-14 11:42:56',NULL,'2025-08-13 11:42:56');
/*!40000 ALTER TABLE `client_verification_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `mot_de_passe` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Bcrypt hashed password for client authentication',
  `email_verifie` tinyint(1) DEFAULT '0' COMMENT 'Email verification status',
  `langue_preferee` varchar(5) COLLATE utf8mb4_general_ci DEFAULT 'fr' COMMENT 'Client preferred language (fr, en, ar)',
  `statut` enum('actif','inactif') COLLATE utf8mb4_general_ci DEFAULT 'actif' COMMENT 'Simplified client account status',
  `telephone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `adresse` text COLLATE utf8mb4_general_ci,
  `notes` text COLLATE utf8mb4_general_ci,
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL,
  `date_modification` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Simplified client table - removed unused security features';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'Marie','Dupont','marie.dupont@email.com',NULL,1,'fr','actif','514-555-0123',NULL,NULL,NULL,1,'2025-07-17 13:10:32','2025-08-04 13:16:32'),(2,'Yassine','FRIGUI','friguiyassine750@gmail.com',NULL,1,'fr','actif','111111111111',NULL,NULL,NULL,1,'2025-07-17 19:31:32','2025-08-13 21:52:31'),(3,'User','Test','test@example.com','$2a$12$OxMRvS0TtDBXo4orwxeLwe2nJjp1bpI3FbCcGNzh8IgjbULXUJYQ2',0,'fr','actif','12345678',NULL,NULL,NULL,1,'2025-08-13 11:40:58','2025-08-13 21:21:07'),(4,'User2','Test2','test2@example.com','$2a$12$caV6dfVcBNyCmTl4u55pRuIaMTQUKkPO/DQel4j4eoG27fJOhvk1m',0,'fr','actif','1234567890',NULL,NULL,NULL,1,'2025-08-13 11:42:56','2025-08-13 11:42:56'),(5,'Yassine','test','testfinal@example.com','$2a$12$5Y.q3PdcgooixeL6K5GRlOKavxJNA0NjF25rFpu3rjbMiEp5tBBdm',1,'fr','actif','111111111111',NULL,NULL,NULL,1,'2025-08-13 11:48:58','2025-08-15 16:30:58'),(6,'te','ts','riff3183@gmail.com','$2a$12$jZQkXwT46JwSVV4yd4rsDeivFf79yQJ8O4vGayRq8IiUqShAm/emK',1,'fr','actif','87654321',NULL,NULL,NULL,1,'2025-08-13 18:10:54','2025-08-17 18:49:09'),(10,'User','Draft','draft@example.com',NULL,0,'fr','actif','87654321',NULL,NULL,NULL,1,'2025-08-13 21:22:02','2025-08-13 21:22:02'),(11,'Test','Email','yassinematoussi42@gmail.com',NULL,0,'fr','actif','12345678',NULL,NULL,NULL,1,'2025-08-13 21:31:25','2025-08-13 21:31:25'),(12,'Yassine','Frigui','yassinefrigui9@gmail.com','$2a$12$LvD27O7YwzZFmeSzFiD9Du5c9JaqJUfGMQHbDtFqVim5XA9ou9fLa',1,'fr','actif','+21653278997',NULL,NULL,NULL,1,'2025-08-13 22:44:35','2025-08-13 22:44:35'),(13,'test','test','test@gmail.com',NULL,0,'fr','actif','1111111111111',NULL,NULL,NULL,1,'2025-08-15 13:36:30','2025-08-17 18:30:00'),(14,'Sonia','Najjar','sonyta-n-uk@hotmail.fr',NULL,0,'fr','actif','0021629361740',NULL,NULL,NULL,1,'2025-08-15 15:56:26','2025-08-15 15:56:26'),(15,'testerr','testerr','testing123456@gmail.com',NULL,0,'fr','actif','99999999',NULL,NULL,NULL,1,'2025-08-15 16:02:21','2025-08-15 16:02:21'),(16,'test','test','123@gmail.com',NULL,0,'fr','actif','1111111111111',NULL,NULL,NULL,1,'2025-08-15 16:03:29','2025-08-15 16:03:29'),(17,'Rourou','Ziadi','rahmaziadi25@gmail.com',NULL,0,'fr','actif','52768613',NULL,NULL,NULL,1,'2025-08-15 16:29:51','2025-08-15 16:29:51');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `creneaux_horaires`
--

DROP TABLE IF EXISTS `creneaux_horaires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `creneaux_horaires` (
  `id` int NOT NULL,
  `jour_semaine` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche') COLLATE utf8mb4_general_ci NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `creneaux_horaires`
--

LOCK TABLES `creneaux_horaires` WRITE;
/*!40000 ALTER TABLE `creneaux_horaires` DISABLE KEYS */;
INSERT INTO `creneaux_horaires` VALUES (1,'lundi','09:00:00','19:00:00',1,'2025-07-17 13:10:32'),(2,'mardi','09:00:00','19:00:00',1,'2025-07-17 13:10:32'),(3,'mercredi','09:00:00','19:00:00',1,'2025-07-17 13:10:32'),(4,'jeudi','09:00:00','20:00:00',1,'2025-07-17 13:10:32'),(5,'vendredi','09:00:00','20:00:00',1,'2025-07-17 13:10:32'),(6,'samedi','09:00:00','18:00:00',1,'2025-07-17 13:10:32');
/*!40000 ALTER TABLE `creneaux_horaires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `month` int NOT NULL,
  `year` int NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_month_year` (`category`,`month`,`year`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,'Loyer',0.00,8,2025,'Loyer mensuel','2025-08-31 20:09:34','2025-08-31 20:09:34'),(2,'Services publics',0.00,8,2025,'Électricité, eau, gaz','2025-08-31 20:09:34','2025-08-31 20:09:34'),(3,'Fournitures',0.00,8,2025,'Fournitures et matériaux de beauté','2025-08-31 20:09:34','2025-08-31 20:09:34'),(4,'Marketing',0.00,8,2025,'Publicité et promotions','2025-08-31 20:09:34','2025-08-31 20:09:34'),(5,'Assurance',0.00,8,2025,'Assurance professionnelle','2025-08-31 20:09:34','2025-08-31 20:09:34'),(6,'Équipement',0.00,8,2025,'Entretien et achats d\'équipement','2025-08-31 20:09:34','2025-08-31 20:09:34');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fermetures_exceptionnelles`
--

DROP TABLE IF EXISTS `fermetures_exceptionnelles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fermetures_exceptionnelles` (
  `id` int NOT NULL,
  `date_fermeture` date NOT NULL,
  `raison` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `toute_journee` tinyint(1) DEFAULT '1',
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fermetures_exceptionnelles`
--

LOCK TABLES `fermetures_exceptionnelles` WRITE;
/*!40000 ALTER TABLE `fermetures_exceptionnelles` DISABLE KEYS */;
/*!40000 ALTER TABLE `fermetures_exceptionnelles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `influencer_events`
--

DROP TABLE IF EXISTS `influencer_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `influencer_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `influencer_link_id` int NOT NULL,
  `event_type` enum('click','conversion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reservation_id` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referrer` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_influencer_link` (`influencer_link_id`),
  KEY `idx_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `influencer_events`
--

LOCK TABLES `influencer_events` WRITE;
/*!40000 ALTER TABLE `influencer_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `influencer_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `influencer_links`
--

DROP TABLE IF EXISTS `influencer_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `influencer_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_influencer_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `influencer_links`
--

LOCK TABLES `influencer_links` WRITE;
/*!40000 ALTER TABLE `influencer_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `influencer_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventaire`
--

DROP TABLE IF EXISTS `inventaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventaire` (
  `id` int NOT NULL,
  `nom_produit` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `marque` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Product brand',
  `type_produit` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Product type/category',
  `couleur` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Product color',
  `code_produit` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Product code/SKU',
  `quantite_stock` int DEFAULT '0',
  `quantite_minimum` int DEFAULT '0',
  `prix_achat` decimal(10,2) DEFAULT NULL COMMENT 'Purchase price',
  `prix_vente` decimal(10,2) DEFAULT NULL COMMENT 'Selling price',
  `prix_unitaire` decimal(10,2) DEFAULT NULL,
  `fournisseur` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_achat` date DEFAULT NULL COMMENT 'Purchase date',
  `date_expiration` date DEFAULT NULL,
  `emplacement` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Storage location',
  `notes` text COLLATE utf8mb4_general_ci COMMENT 'Additional notes',
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventaire`
--

LOCK TABLES `inventaire` WRITE;
/*!40000 ALTER TABLE `inventaire` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventaire` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parametres_salon`
--

DROP TABLE IF EXISTS `parametres_salon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametres_salon` (
  `id` int NOT NULL,
  `nom_salon` varchar(150) COLLATE utf8mb4_general_ci DEFAULT 'Chez Waad Beauty',
  `adresse` text COLLATE utf8mb4_general_ci,
  `telephone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '905-605-1188',
  `email` varchar(191) COLLATE utf8mb4_general_ci DEFAULT 'info@chezwaad.ca',
  `site_web` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'https://chezwaad.ca',
  `horaires_ouverture` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `couleur_principale` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#2e4d4c',
  `couleur_secondaire` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#4a6b69',
  `logo_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT '/images/chez_waad_logo.png',
  `message_accueil` text COLLATE utf8mb4_general_ci,
  `politique_annulation` text COLLATE utf8mb4_general_ci,
  `cgv` text COLLATE utf8mb4_general_ci,
  `date_modification` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parametres_salon`
--

LOCK TABLES `parametres_salon` WRITE;
/*!40000 ALTER TABLE `parametres_salon` DISABLE KEYS */;
INSERT INTO `parametres_salon` VALUES (1,'Beauty Nails - Chez Waad','Tunis, Tunisia','+216 24 157 715','contact@beauty-nails-waad.tn','https://beauty-nails-waad.tn','{\"lundi\":\"9h-19h\",\"mardi\":\"9h-19h\",\"mercredi\":\"9h-19h\",\"jeudi\":\"9h-20h\",\"vendredi\":\"9h-20h\",\"samedi\":\"9h-18h\",\"dimanche\":\"Ferm├®\"}','#d4789b','#f4c2c2','/images/chez_waad_logo.png','Salon de manucure et beaut├® des ongles premium offrant des services de qualit├® avec des produits haut de gamme','Annulation gratuite jusqu\'├á 24h avant le rendez-vous.',NULL,'2025-08-17 18:07:15');
/*!40000 ALTER TABLE `parametres_salon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parametres_salon_translations`
--

DROP TABLE IF EXISTS `parametres_salon_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametres_salon_translations` (
  `id` int NOT NULL,
  `parametre_id` int NOT NULL,
  `language_code` varchar(5) COLLATE utf8mb4_general_ci NOT NULL,
  `nom_salon` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `message_accueil` text COLLATE utf8mb4_general_ci,
  `politique_annulation` text COLLATE utf8mb4_general_ci,
  `cgv` text COLLATE utf8mb4_general_ci,
  `date_creation` datetime NOT NULL,
  `date_modification` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `parametres_salon_translations_ibfk_1` (`parametre_id`),
  CONSTRAINT `parametres_salon_translations_ibfk_1` FOREIGN KEY (`parametre_id`) REFERENCES `parametres_salon` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parametres_salon_translations`
--

LOCK TABLES `parametres_salon_translations` WRITE;
/*!40000 ALTER TABLE `parametres_salon_translations` DISABLE KEYS */;
INSERT INTO `parametres_salon_translations` VALUES (1,1,'fr','Beauty Nails - Chez Waad','Salon de manucure et beaut├® des ongles premium offrant des services de qualit├® avec des produits haut de gamme','Annulation gratuite jusqu\'├á 24h avant le rendez-vous.',NULL,'2025-08-04 13:16:48','2025-08-17 18:07:15'),(2,1,'en','Chez Waad Beauty','Welcome to Chez Waad Beauty, your destination for intimate wellness and holistic healing.','Free cancellation up to 24 hours before appointment.',NULL,'2025-08-04 13:16:48','2025-08-04 13:16:48'),(3,1,'ar','Ï│Ï¿Ïº Ï▓┘è┘å Ï┤┘è','┘àÏ▒Ï¡Ï¿Ïº┘ï Ï¿┘â┘à ┘ü┘è Ï│Ï¿Ïº Ï▓┘è┘å Ï┤┘èÏî ┘êÏ¼┘çÏ¬┘â┘à ┘ä┘äÏ╣Ïº┘ü┘èÏ® Ïº┘äÏ¡┘à┘è┘àÏ® ┘êÏº┘äÏ┤┘üÏºÏí Ïº┘äÏ┤Ïº┘à┘ä.','ÏÑ┘äÏ║ÏºÏí ┘àÏ¼Ïº┘å┘è Ï¡Ï¬┘ë 24 Ï│ÏºÏ╣Ï® ┘éÏ¿┘ä Ïº┘ä┘à┘êÏ╣Ï».',NULL,'2025-08-04 13:16:48','2025-08-04 13:16:48');
/*!40000 ALTER TABLE `parametres_salon_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `verification_code` varchar(6) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `password_reset_tokens_ibfk_1` (`client_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (1,5,'dda566f0c43fc4f1136462bf76e78dbb93c4f7528288539e3a2c9ebb8a28e10f',NULL,'2025-08-13 18:43:49',NULL,'2025-08-13 17:13:49'),(2,6,'32814cd8bf164987a179883f83fb9b10d00c458a63e96d27d5faed7e716ddf0d',NULL,'2025-08-13 19:41:33',NULL,'2025-08-13 18:11:33'),(3,6,'485fdc700c576be4cdbd8ee6db915f8cac5d34d6f95f0c4c29ccf08c5a91798b',NULL,'2025-08-13 20:00:41',NULL,'2025-08-13 18:30:41'),(4,6,'74e1233a06eff49b19a8b051b541bb081af5f097164a57fc09b8e1ada5d3941e',NULL,'2025-08-13 20:03:52',NULL,'2025-08-13 18:33:52'),(5,6,'daaec4a9cf6c7e5e2ef8cb62f3e5eaf0a46f962c7f4eba815260fa6f211c7192',NULL,'2025-08-13 20:16:23',NULL,'2025-08-13 18:46:23'),(6,6,'6f0b735796e739c752b43b4654c392003151078ba8fc467e65d253a46060ac6c',NULL,'2025-08-13 20:16:56',NULL,'2025-08-13 18:46:56'),(7,6,'cf44769076d90e4694abf28a330679c5259d92172bab5cbf04d0c61c40ffa758',NULL,'2025-08-13 20:18:49',NULL,'2025-08-13 18:48:49'),(8,6,'978bfbeddb3606890af4a43c23435bedab81d4d4fec3d46b85bbc5c6c1b6b104',NULL,'2025-08-13 20:25:33',NULL,'2025-08-13 18:55:33');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` int NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `type_reduction` enum('pourcentage','montant_fixe') COLLATE utf8mb4_general_ci NOT NULL,
  `valeur_reduction` decimal(10,2) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `code_promo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `montant_minimum` decimal(10,2) DEFAULT '0.00',
  `service_id` int DEFAULT NULL,
  `categorie_id` int DEFAULT NULL,
  `nombre_utilisations_max` int DEFAULT NULL,
  `nombre_utilisations_actuelles` int DEFAULT '0',
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `promotions_ibfk_1` (`service_id`),
  KEY `promotions_ibfk_2` (`categorie_id`),
  CONSTRAINT `promotions_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `promotions_ibfk_2` FOREIGN KEY (`categorie_id`) REFERENCES `categories_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_items`
--

DROP TABLE IF EXISTS `reservation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_items` (
  `id` int NOT NULL,
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_items`
--

LOCK TABLES `reservation_items` WRITE;
/*!40000 ALTER TABLE `reservation_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` int NOT NULL,
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
  `date_creation` datetime NOT NULL,
  `date_modification` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reservations_ibfk_1` (`client_id`),
  KEY `reservations_ibfk_2` (`service_id`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Client reservations';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (5,NULL,6,'2025-08-23','15:00:00','16:05:00','en_attente','reserved',130.00,130.00,'Frigui','Yassine','22222222','friguiyassine750@gmail.com',NULL,'808485',NULL,NULL,NULL,'2025-08-13 21:00:46','2025-08-13 21:00:46'),(7,NULL,6,'2025-08-23','09:30:00','10:35:00','en_attente','reserved',130.00,130.00,'Frigui','Yassine','22222222','friguiyassine750@gmail.com',NULL,'455009',NULL,NULL,NULL,'2025-08-13 21:06:38','2025-08-13 21:06:39'),(8,NULL,10,'2025-08-22','15:30:00','15:30:00','en_attente','reserved',160.00,160.00,'Frigui','Yassine','33112233','friguiyassine750@gmail.com','','218789',NULL,NULL,NULL,'2025-08-13 21:19:53','2025-08-13 21:21:35'),(9,3,1,'2025-08-25','10:00:00','10:10:00','en_attente','reserved',40.00,40.00,'Test','User','12345678','test@example.com','Test reservation','382460',NULL,NULL,NULL,'2025-08-13 21:21:07','2025-08-13 21:21:08'),(10,10,1,'2025-08-26','11:00:00','00:00:00','en_attente','reserved',40.00,40.00,'Draft','User','87654321','draft@example.com','Draft test','533985',NULL,NULL,NULL,'2025-08-13 21:22:02','2025-08-13 21:22:02'),(11,11,1,'2025-08-27','14:00:00','14:10:00','en_attente','reserved',40.00,40.00,'Email','Test','12345678','yassinematoussi42@gmail.com','Email test reservation','221838','9913d7d7d2f0fce794b1a6d243a6fca69aeb3469b4de9ad8dace312e93597c2f',NULL,NULL,'2025-08-13 21:31:25','2025-08-13 21:31:47'),(12,2,5,'2025-08-30','17:00:00','17:00:00','confirmee','confirmed',80.00,80.00,'FRIGUI','Yassine','111111111111','yassinefrigui9@gmail.com','','968720','b635c61d30c70282c08fd384b51d609066ea669bb251d9cf662acdcec56e61bd',NULL,NULL,'2025-08-13 21:42:40','2025-08-13 21:43:53'),(13,2,3,'2025-08-30','14:30:00','14:30:00','confirmee','confirmed',140.00,140.00,'FRIGUI','Yassine','111111111111','friguiyassine750@gmail.com','','581149',NULL,NULL,NULL,'2025-08-13 21:50:56','2025-08-13 22:02:04'),(14,NULL,4,'2025-07-15','09:00:00','09:30:00','draft','draft',0.00,0.00,'','','55555555','','',NULL,NULL,'booking_1755188649658_6vbexnnekw3',NULL,'2025-08-14 16:24:27','2025-08-14 16:36:42'),(15,13,11,'2025-09-02','17:00:00','17:00:00','en_attente','reserved',320.00,320.00,'test','test','111111111111','test@gmail.com','','218622','d906ca63cc1df11091e2f73a69c05d5d52166ab70a7e7ffd4b0a6d0ce7275901',NULL,NULL,'2025-08-15 13:36:25','2025-08-15 13:37:30'),(16,15,5,'2025-08-28','17:00:00','17:00:00','en_attente','reserved',80.00,80.00,'testerr','testerr','99999999','testing123456@gmail.com','','965742','dea6e47e1cb36471f0000ef201d23c946a5dead8da82496f32a9403eb3d24cf4',NULL,NULL,'2025-08-15 14:13:17','2025-08-15 16:02:22'),(17,14,1,'2025-08-16','11:00:00','11:00:00','confirmee','confirmed',40.00,40.00,'Najjar','Sonia','0021629361740','sonyta-n-uk@hotmail.fr','','865445','15bf3e76b2141d73afdd54440e60f2f00cd6c7697535aa2470088912bd5473b8',NULL,NULL,'2025-08-15 15:56:04','2025-08-15 15:57:04'),(18,16,3,'2025-08-20','17:00:00','17:00:00','en_attente','reserved',140.00,140.00,'test','test','1111111111111','123@gmail.com','','957227','c36dc94c84767312642c678c6ab040d3055d1176b03d5cf6058a9904d5e4fe12',NULL,NULL,'2025-08-15 16:03:21','2025-08-15 16:03:31'),(19,17,3,'2025-08-26','17:30:00','17:30:00','en_attente','reserved',140.00,140.00,'Ziadi','Rourou','52768613','rahmaziadi25@gmail.com','','204666','9ee0ea706408e48cbb5c40c11f6785999c29fa4b022e2e409b510313eceec686',NULL,NULL,'2025-08-15 16:29:28','2025-08-15 16:29:53'),(20,5,9,'2025-08-19','17:30:00','17:30:00','en_attente','reserved',130.00,130.00,'test','Yassine','111111111111','testfinal@example.com','','668593','3d43b3ee07c0a2f9c0f571eddf8617af0dfd939bca099cbc0be1b93a8d423bd8',NULL,NULL,'2025-08-15 16:30:51','2025-08-15 16:30:59'),(21,13,11,'2025-07-15','09:00:00','09:30:00','en_attente','reserved',320.00,320.00,'test','Yassine','22222222222222','test@gmail.com','','219951','0d50be28f585b5ebe1edd7ee70861761bb072523fed9f8b5eb2884db131234ec',NULL,NULL,'2025-08-15 16:37:00','2025-08-15 16:37:40'),(22,13,1,'2025-08-29','18:00:00','18:00:00','en_attente','reserved',25.00,25.00,'test','test','1111111111111','test@gmail.com','','187340','076d320e241c50d83e00c803b8d0d962f2f21e03dff0f09e703306ddcb71997f',NULL,NULL,'2025-08-17 18:29:55','2025-08-17 18:30:00'),(23,6,6,'2025-08-30','11:30:00','11:30:00','en_attente','reserved',40.00,40.00,'ttt','ttt','12345678','riff3183@gmail.com','','779487','4ca9ffa09509186a7bf3f3419cf9d153dcd80c91f769b54f4dec2415feb09975',NULL,NULL,'2025-08-17 18:33:22','2025-08-17 18:33:42'),(24,6,1,'2025-08-29','15:30:00','15:30:00','en_attente','reserved',25.00,25.00,'ts','te','87654321','riff3183@gmail.com','','840825','2c22fe408d96cb6c33249ea531ff489e1210f97c4903d01ee6bc31dd85b03d53',NULL,NULL,'2025-08-17 18:49:03','2025-08-17 18:49:09');
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_settings`
--

DROP TABLE IF EXISTS `security_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_settings` (
  `id` int NOT NULL,
  `setting_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Setting name',
  `setting_value` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Setting value',
  `description` text COLLATE utf8mb4_general_ci COMMENT 'Setting description',
  `date_modification` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Security settings for the application';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_settings`
--

LOCK TABLES `security_settings` WRITE;
/*!40000 ALTER TABLE `security_settings` DISABLE KEYS */;
INSERT INTO `security_settings` VALUES (3,'password_reset_token_expiry_hours','24','Password reset token expiry in hours','2025-08-04 13:16:32'),(5,'session_timeout_hours','24','Client session timeout in hours','2025-08-04 13:16:32'),(6,'require_email_verification','1','Require email verification for new accounts','2025-08-04 13:16:32'),(7,'min_password_length','8','Minimum password length','2025-08-04 13:16:32'),(8,'require_password_complexity','1','Require complex passwords (uppercase, lowercase, number, special char)','2025-08-04 13:16:32'),(11,'jwt_secret_rotation_days','30','Days between JWT secret rotation','2025-08-10 18:34:05'),(12,'session_cleanup_interval_hours','24','Hours between session cleanup runs','2025-08-10 18:34:05'),(13,'max_login_attempts','5','Maximum login attempts before temporary lockout','2025-08-10 18:34:24'),(14,'lockout_duration_minutes','15','Duration of temporary lockout in minutes','2025-08-10 18:34:24');
/*!40000 ALTER TABLE `security_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL,
  `nom` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `description_detaillee` text COLLATE utf8mb4_general_ci,
  `service_type` enum('base','variant','package','addon') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'base',
  `parent_service_id` int DEFAULT NULL,
  `categorie_id` int DEFAULT NULL,
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
  `date_creation` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `services_ibfk_1` (`categorie_id`),
  KEY `services_ibfk_2` (`parent_service_id`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`categorie_id`) REFERENCES `categories_services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `services_ibfk_2` FOREIGN KEY (`parent_service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Spa services offered';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Manucure Classique','Soin complet des ongles avec pose de vernis','Manucure traditionnelle incluant limage, soin des cuticules et pose de vernis','base',NULL,1,25.00,45,NULL,'Limage, soin cuticules, vernis base + couleur + top coat',NULL,'├ëviter l\'eau chaude pendant 2h',NULL,NULL,NULL,1,1,0,1,'2025-08-17 18:07:14'),(2,'Manucure Gel','Manucure avec vernis gel longue tenue','Manucure premium avec vernis gel semi-permanent','base',NULL,1,35.00,60,NULL,'Pr├®paration ongles, vernis gel, s├®chage UV/LED',NULL,'Ne pas arracher le vernis, utiliser dissolvant sp├®cial',NULL,NULL,NULL,1,1,0,2,'2025-08-17 18:07:14'),(3,'Manucure Express','Manucure rapide pour retouches','Service rapide de remise en forme des ongles','base',NULL,1,15.00,30,NULL,'Limage et pose de vernis classique',NULL,'├ëviter l\'eau chaude pendant 1h',NULL,NULL,NULL,1,0,0,3,'2025-08-17 18:07:14'),(4,'P├®dicure Classique','Soin complet des pieds et ongles','P├®dicure traditionnelle avec bain de pieds relaxant','base',NULL,2,30.00,60,NULL,'Bain de pieds, gommage, soin cuticules, limage, vernis',NULL,'Hydrater quotidiennement',NULL,NULL,NULL,1,1,0,1,'2025-08-17 18:07:14'),(5,'P├®dicure Spa','P├®dicure luxe avec massage et masque','P├®dicure premium avec soins relaxants','base',NULL,2,45.00,90,NULL,'Bain aromatique, gommage, masque hydratant, massage 15min, vernis',NULL,'Porter des chaussures ouvertes, ├®viter efforts intenses',NULL,NULL,NULL,1,1,1,2,'2025-08-17 18:07:14'),(6,'P├®dicure Gel','P├®dicure avec vernis gel semi-permanent','P├®dicure avec vernis gel longue dur├®e','base',NULL,2,40.00,75,NULL,'Soin complet + vernis gel + s├®chage UV',NULL,'Ne pas gratter le vernis, utiliser dissolvant adapt├®',NULL,NULL,NULL,1,0,0,3,'2025-08-17 18:07:14'),(7,'Nail Art Simple','D├®coration simple sur ongles','Motifs simples et ├®l├®gants','base',NULL,3,5.00,15,NULL,'D├®coration sur 2-5 ongles, motifs au choix',NULL,'Laisser s├®cher compl├¿tement',NULL,NULL,NULL,1,1,0,1,'2025-08-17 18:07:14'),(8,'Nail Art ├ëlabor├®','Cr├®ations artistiques complexes','Designs artistiques sur tous les ongles','base',NULL,3,15.00,45,NULL,'Designs personnalis├®s, strass, paillettes',NULL,'├ëviter les chocs, porter des gants pour le m├®nage',NULL,NULL,NULL,1,1,1,2,'2025-08-17 18:07:14'),(9,'Nail Art 3D','D├®corations en relief et bijoux d\'ongles','Cr├®ations 3D avec ├®l├®ments en relief','base',NULL,3,25.00,60,NULL,'Sculptures 3D, bijoux d\'ongles, effets sp├®ciaux',NULL,'Manipulation d├®licate, ├®viter les chocs',NULL,NULL,NULL,1,0,1,3,'2025-08-17 18:07:14'),(10,'Pose Capsules','Extensions avec capsules plastique','Allongement des ongles avec capsules','base',NULL,4,40.00,90,NULL,'Capsules, limage forme, vernis ou gel',NULL,'Retouches n├®cessaires toutes les 3-4 semaines',NULL,NULL,NULL,1,1,0,1,'2025-08-17 18:07:14'),(11,'Extensions Gel','Extensions model├®es au gel','Extensions naturelles model├®es au gel UV','base',NULL,4,55.00,120,NULL,'Modelage gel, forme au choix, finition parfaite',NULL,'Entretien professionnel obligatoire',NULL,NULL,NULL,1,1,0,2,'2025-08-17 18:07:14'),(12,'Remplissage Extensions','Retouche et entretien des extensions','Comblement de la repousse des extensions','base',NULL,4,30.00,75,NULL,'Limage repousse, remplissage, finition',NULL,'├Ç refaire toutes les 3-4 semaines',NULL,NULL,NULL,1,0,0,3,'2025-08-17 18:07:14'),(13,'Soin Fortifiant','Traitement pour ongles fragiles','Soin r├®parateur pour ongles ab├«m├®s','base',NULL,5,20.00,30,NULL,'Soin fortifiant, massage cuticules, vernis traitement',NULL,'Appliquer l\'huile cuticules quotidiennement',NULL,NULL,NULL,1,0,0,1,'2025-08-17 18:07:14'),(14,'R├®paration Ongle Cass├®','R├®paration d\'urgence ongle ab├«m├®','R├®paration professionnelle avec patch','base',NULL,5,10.00,20,NULL,'Patch de r├®paration, limage, finition discr├¿te',NULL,'├ëviter les chocs sur l\'ongle r├®par├®',NULL,NULL,NULL,1,0,0,2,'2025-08-17 18:07:14'),(15,'D├®pose Vernis Gel','Retrait professionnel vernis gel','D├®pose douce sans ab├«mer l\'ongle','base',NULL,5,15.00,30,NULL,'D├®pose professionnelle, soin hydratant',NULL,'Laisser respirer les ongles 24h',NULL,NULL,NULL,1,0,0,3,'2025-08-17 18:07:14'),(16,'Package Beaut├® Mains','Manucure + nail art + soin','Forfait complet pour des mains parfaites','package',NULL,6,45.00,90,NULL,'Manucure gel + nail art simple + soin cuticules',NULL,'Entretenir avec cr├¿me mains quotidiennement',NULL,NULL,NULL,1,1,0,1,'2025-08-17 18:07:14'),(17,'Package Beaut├® Pieds','P├®dicure + nail art + massage','Forfait relaxation pour les pieds','package',NULL,6,55.00,120,NULL,'P├®dicure spa + nail art + massage prolong├®',NULL,'Porter chaussures confortables',NULL,NULL,NULL,1,1,0,2,'2025-08-17 18:07:14'),(18,'Package Complet','Manucure + p├®dicure + nail art','Exp├®rience beaut├® compl├¿te mains et pieds','package',NULL,6,70.00,150,NULL,'Manucure gel + p├®dicure classique + nail art au choix',NULL,'Suivre conseils d\'entretien pour chaque soin',NULL,NULL,NULL,1,1,1,3,'2025-08-17 18:07:14');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services_translations`
--

DROP TABLE IF EXISTS `services_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services_translations` (
  `id` int NOT NULL,
  `service_id` int NOT NULL,
  `language_code` varchar(5) COLLATE utf8mb4_general_ci NOT NULL,
  `nom` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `description_detaillee` text COLLATE utf8mb4_general_ci,
  `inclus` text COLLATE utf8mb4_general_ci,
  `contre_indications` text COLLATE utf8mb4_general_ci,
  `conseils_apres_soin` text COLLATE utf8mb4_general_ci,
  `date_creation` datetime NOT NULL,
  `date_modification` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `services_translations_ibfk_1` (`service_id`),
  CONSTRAINT `services_translations_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services_translations`
--

LOCK TABLES `services_translations` WRITE;
/*!40000 ALTER TABLE `services_translations` DISABLE KEYS */;
INSERT INTO `services_translations` VALUES (1,1,'fr','Manucure Classique','Soin complet des ongles avec pose de vernis','Manucure traditionnelle incluant limage, soin des cuticules et pose de vernis','Limage, soin cuticules, vernis base + couleur + top coat',NULL,'├ëviter l\'eau chaude pendant 2h','2025-08-17 18:07:14','2025-08-17 18:07:14'),(2,2,'fr','Manucure Gel','Manucure avec vernis gel longue tenue','Manucure premium avec vernis gel semi-permanent','Pr├®paration ongles, vernis gel, s├®chage UV/LED',NULL,'Ne pas arracher le vernis, utiliser dissolvant sp├®cial','2025-08-17 18:07:14','2025-08-17 18:07:14'),(3,3,'fr','Manucure Express','Manucure rapide pour retouches','Service rapide de remise en forme des ongles','Limage et pose de vernis classique',NULL,'├ëviter l\'eau chaude pendant 1h','2025-08-17 18:07:14','2025-08-17 18:07:14'),(4,4,'fr','P├®dicure Classique','Soin complet des pieds et ongles','P├®dicure traditionnelle avec bain de pieds relaxant','Bain de pieds, gommage, soin cuticules, limage, vernis',NULL,'Hydrater quotidiennement','2025-08-17 18:07:14','2025-08-17 18:07:14'),(5,5,'fr','P├®dicure Spa','P├®dicure luxe avec massage et masque','P├®dicure premium avec soins relaxants','Bain aromatique, gommage, masque hydratant, massage 15min, vernis',NULL,'Porter des chaussures ouvertes, ├®viter efforts intenses','2025-08-17 18:07:14','2025-08-17 18:07:14'),(6,6,'fr','P├®dicure Gel','P├®dicure avec vernis gel semi-permanent','P├®dicure avec vernis gel longue dur├®e','Soin complet + vernis gel + s├®chage UV',NULL,'Ne pas gratter le vernis, utiliser dissolvant adapt├®','2025-08-17 18:07:14','2025-08-17 18:07:14'),(7,7,'fr','Nail Art Simple','D├®coration simple sur ongles','Motifs simples et ├®l├®gants','D├®coration sur 2-5 ongles, motifs au choix',NULL,'Laisser s├®cher compl├¿tement','2025-08-17 18:07:14','2025-08-17 18:07:14'),(8,8,'fr','Nail Art ├ëlabor├®','Cr├®ations artistiques complexes','Designs artistiques sur tous les ongles','Designs personnalis├®s, strass, paillettes',NULL,'├ëviter les chocs, porter des gants pour le m├®nage','2025-08-17 18:07:14','2025-08-17 18:07:14'),(9,9,'fr','Nail Art 3D','D├®corations en relief et bijoux d\'ongles','Cr├®ations 3D avec ├®l├®ments en relief','Sculptures 3D, bijoux d\'ongles, effets sp├®ciaux',NULL,'Manipulation d├®licate, ├®viter les chocs','2025-08-17 18:07:14','2025-08-17 18:07:14'),(10,10,'fr','Pose Capsules','Extensions avec capsules plastique','Allongement des ongles avec capsules','Capsules, limage forme, vernis ou gel',NULL,'Retouches n├®cessaires toutes les 3-4 semaines','2025-08-17 18:07:14','2025-08-17 18:07:14'),(11,11,'fr','Extensions Gel','Extensions model├®es au gel','Extensions naturelles model├®es au gel UV','Modelage gel, forme au choix, finition parfaite',NULL,'Entretien professionnel obligatoire','2025-08-17 18:07:14','2025-08-17 18:07:14'),(12,12,'fr','Remplissage Extensions','Retouche et entretien des extensions','Comblement de la repousse des extensions','Limage repousse, remplissage, finition',NULL,'├Ç refaire toutes les 3-4 semaines','2025-08-17 18:07:14','2025-08-17 18:07:14'),(13,13,'fr','Soin Fortifiant','Traitement pour ongles fragiles','Soin r├®parateur pour ongles ab├«m├®s','Soin fortifiant, massage cuticules, vernis traitement',NULL,'Appliquer l\'huile cuticules quotidiennement','2025-08-17 18:07:14','2025-08-17 18:07:14'),(14,14,'fr','R├®paration Ongle Cass├®','R├®paration d\'urgence ongle ab├«m├®','R├®paration professionnelle avec patch','Patch de r├®paration, limage, finition discr├¿te',NULL,'├ëviter les chocs sur l\'ongle r├®par├®','2025-08-17 18:07:14','2025-08-17 18:07:14'),(15,15,'fr','D├®pose Vernis Gel','Retrait professionnel vernis gel','D├®pose douce sans ab├«mer l\'ongle','D├®pose professionnelle, soin hydratant',NULL,'Laisser respirer les ongles 24h','2025-08-17 18:07:14','2025-08-17 18:07:14'),(16,16,'fr','Package Beaut├® Mains','Manucure + nail art + soin','Forfait complet pour des mains parfaites','Manucure gel + nail art simple + soin cuticules',NULL,'Entretenir avec cr├¿me mains quotidiennement','2025-08-17 18:07:14','2025-08-17 18:07:14'),(17,17,'fr','Package Beaut├® Pieds','P├®dicure + nail art + massage','Forfait relaxation pour les pieds','P├®dicure spa + nail art + massage prolong├®',NULL,'Porter chaussures confortables','2025-08-17 18:07:14','2025-08-17 18:07:14'),(18,18,'fr','Package Complet','Manucure + p├®dicure + nail art','Exp├®rience beaut├® compl├¿te mains et pieds','Manucure gel + p├®dicure classique + nail art au choix',NULL,'Suivre conseils d\'entretien pour chaque soin','2025-08-17 18:07:14','2025-08-17 18:07:14'),(19,1,'en','Classic Manicure','Complete nail care with polish application','Traditional manicure including filing, cuticle care and polish application','Filing, cuticle care, base + color + top coat',NULL,'Avoid hot water for 2 hours','2025-08-17 18:07:14','2025-08-17 18:07:14'),(20,2,'en','Gel Manicure','Manicure with long-lasting gel polish','Premium manicure with semi-permanent gel polish','Nail preparation, gel polish, UV/LED curing',NULL,'Do not peel off polish, use special remover','2025-08-17 18:07:14','2025-08-17 18:07:14'),(21,3,'en','Express Manicure','Quick manicure for touch-ups','Fast nail shaping service','Filing and classic polish application',NULL,'Avoid hot water for 1 hour','2025-08-17 18:07:14','2025-08-17 18:07:14'),(22,4,'en','Classic Pedicure','Complete foot and nail care','Traditional pedicure with relaxing foot bath','Foot bath, scrub, cuticle care, filing, polish',NULL,'Moisturize daily','2025-08-17 18:07:14','2025-08-17 18:07:14'),(23,5,'en','Spa Pedicure','Luxury pedicure with massage and mask','Premium pedicure with relaxing treatments','Aromatic bath, scrub, moisturizing mask, 15min massage, polish',NULL,'Wear open shoes, avoid intense activity','2025-08-17 18:07:14','2025-08-17 18:07:14'),(24,6,'en','Gel Pedicure','Pedicure with semi-permanent gel polish','Pedicure with long-lasting gel polish','Complete care + gel polish + UV curing',NULL,'Do not scratch polish, use proper remover','2025-08-17 18:07:14','2025-08-17 18:07:14'),(25,7,'en','Simple Nail Art','Simple nail decoration','Simple and elegant patterns','Decoration on 2-5 nails, choice of patterns',NULL,'Let dry completely','2025-08-17 18:07:14','2025-08-17 18:07:14'),(26,8,'en','Elaborate Nail Art','Complex artistic creations','Artistic designs on all nails','Custom designs, rhinestones, glitter',NULL,'Avoid impact, wear gloves for cleaning','2025-08-17 18:07:14','2025-08-17 18:07:14'),(27,9,'en','3D Nail Art','Relief decorations and nail jewelry','3D creations with relief elements','3D sculptures, nail jewelry, special effects',NULL,'Handle delicately, avoid impact','2025-08-17 18:07:14','2025-08-17 18:07:14'),(28,10,'en','Nail Tips Application','Extensions with plastic tips','Nail lengthening with tips','Tips, shape filing, polish or gel',NULL,'Touch-ups needed every 3-4 weeks','2025-08-17 18:07:14','2025-08-17 18:07:14'),(29,11,'en','Gel Extensions','Gel sculpted extensions','Natural extensions sculpted with UV gel','Gel sculpting, choice of shape, perfect finish',NULL,'Professional maintenance required','2025-08-17 18:07:14','2025-08-17 18:07:14'),(30,12,'en','Extension Fill','Extension touch-up and maintenance','Filling nail regrowth on extensions','Regrowth filing, filling, finishing',NULL,'Redo every 3-4 weeks','2025-08-17 18:07:14','2025-08-17 18:07:14'),(31,13,'en','Strengthening Treatment','Treatment for fragile nails','Restorative treatment for damaged nails','Strengthening treatment, cuticle massage, treatment polish',NULL,'Apply cuticle oil daily','2025-08-17 18:07:14','2025-08-17 18:07:14'),(32,14,'en','Broken Nail Repair','Emergency repair for damaged nail','Professional repair with patch','Repair patch, filing, discreet finishing',NULL,'Avoid impact on repaired nail','2025-08-17 18:07:14','2025-08-17 18:07:14'),(33,15,'en','Gel Polish Removal','Professional gel polish removal','Gentle removal without damaging nail','Professional removal, moisturizing treatment',NULL,'Let nails breathe for 24h','2025-08-17 18:07:14','2025-08-17 18:07:14'),(34,16,'en','Hand Beauty Package','Manicure + nail art + treatment','Complete package for perfect hands','Gel manicure + simple nail art + cuticle treatment',NULL,'Maintain with daily hand cream','2025-08-17 18:07:14','2025-08-17 18:07:14'),(35,17,'en','Foot Beauty Package','Pedicure + nail art + massage','Relaxation package for feet','Spa pedicure + nail art + extended massage',NULL,'Wear comfortable shoes','2025-08-17 18:07:14','2025-08-17 18:07:14'),(36,18,'en','Complete Package','Manicure + pedicure + nail art','Complete beauty experience for hands and feet','Gel manicure + classic pedicure + choice of nail art',NULL,'Follow maintenance advice for each treatment','2025-08-17 18:07:14','2025-08-17 18:07:14'),(37,1,'ar','┘àÏº┘å┘è┘â┘èÏ▒ ┘â┘äÏºÏ│┘è┘â┘è','Ïº┘äÏ╣┘åÏº┘èÏ® Ïº┘ä┘âÏº┘à┘äÏ® Ï¿Ïº┘äÏúÏ©Ïº┘üÏ▒ ┘àÏ╣ ┘êÏÂÏ╣ Ïº┘äÏÀ┘äÏºÏí','┘àÏº┘å┘è┘â┘èÏ▒ Ï¬┘é┘ä┘èÏ»┘è ┘èÏ┤┘à┘ä Ïº┘äÏ¿Ï▒Ï» ┘êÏº┘äÏ╣┘åÏº┘èÏ® Ï¿Ïº┘äÏ¼┘ä┘èÏ»Ï® ┘ê┘êÏÂÏ╣ Ïº┘äÏÀ┘äÏºÏí','Ï¿Ï▒Ï»Ïî Ï╣┘åÏº┘èÏ® Ï¿Ïº┘äÏ¼┘ä┘èÏ»Ï®Ïî ÏÀ┘äÏºÏí ÏúÏ│ÏºÏ│ + ┘ä┘ê┘å + ÏÀ┘äÏºÏí Ï╣┘ä┘ê┘è',NULL,'Ï¬Ï¼┘åÏ¿ Ïº┘ä┘àÏºÏí Ïº┘äÏ│ÏºÏ«┘å ┘ä┘àÏ»Ï® Ï│ÏºÏ╣Ï¬┘è┘å','2025-08-17 18:07:14','2025-08-17 18:07:14'),(38,2,'ar','┘àÏº┘å┘è┘â┘èÏ▒ Ï¼┘ä','┘àÏº┘å┘è┘â┘èÏ▒ Ï¿ÏÀ┘äÏºÏí Ï¼┘ä ÏÀ┘ê┘è┘ä Ïº┘ä┘à┘üÏ╣┘ê┘ä','┘àÏº┘å┘è┘â┘èÏ▒ ┘à┘à┘èÏ▓ Ï¿ÏÀ┘äÏºÏí Ï¼┘ä Ï┤Ï¿┘ç Ï»ÏºÏª┘à','Ï¬Ï¡ÏÂ┘èÏ▒ Ïº┘äÏúÏ©Ïº┘üÏ▒Ïî ÏÀ┘äÏºÏí Ï¼┘äÏî Ï¬Ï¼┘ü┘è┘ü Ï¿Ïº┘äÏúÏ┤Ï╣Ï® ┘ü┘ê┘é Ïº┘äÏ¿┘å┘üÏ│Ï¼┘èÏ®',NULL,'┘äÏº Ï¬┘åÏ▓Ï╣┘è Ïº┘äÏÀ┘äÏºÏíÏî ÏºÏ│Ï¬Ï«Ï»┘à┘è ┘àÏ▓┘è┘ä Ï«ÏºÏÁ','2025-08-17 18:07:14','2025-08-17 18:07:14'),(39,3,'ar','┘àÏº┘å┘è┘â┘èÏ▒ Ï│Ï▒┘èÏ╣','┘àÏº┘å┘è┘â┘èÏ▒ Ï│Ï▒┘èÏ╣ ┘ä┘ä┘àÏ│ Ïº┘ä┘å┘çÏºÏª┘è','Ï«Ï»┘àÏ® Ï│Ï▒┘èÏ╣Ï® ┘äÏ¬Ï┤┘â┘è┘ä Ïº┘äÏúÏ©Ïº┘üÏ▒','Ï¿Ï▒Ï» ┘ê┘êÏÂÏ╣ ÏÀ┘äÏºÏí ┘â┘äÏºÏ│┘è┘â┘è',NULL,'Ï¬Ï¼┘åÏ¿ Ïº┘ä┘àÏºÏí Ïº┘äÏ│ÏºÏ«┘å ┘ä┘àÏ»Ï® Ï│ÏºÏ╣Ï®','2025-08-17 18:07:14','2025-08-17 18:07:14'),(40,4,'ar','Ï¿┘èÏ»┘è┘â┘èÏ▒ ┘â┘äÏºÏ│┘è┘â┘è','Ïº┘äÏ╣┘åÏº┘èÏ® Ïº┘ä┘âÏº┘à┘äÏ® Ï¿Ïº┘ä┘éÏ»┘à┘è┘å ┘êÏº┘äÏúÏ©Ïº┘üÏ▒','Ï¿┘èÏ»┘è┘â┘èÏ▒ Ï¬┘é┘ä┘èÏ»┘è ┘àÏ╣ Ï¡┘àÏº┘à ┘éÏ»┘à┘è┘å ┘àÏ▒┘èÏ¡','Ï¡┘àÏº┘à ┘éÏ»┘à┘è┘åÏî Ï¬┘éÏ┤┘èÏ▒Ïî Ï╣┘åÏº┘èÏ® Ï¿Ïº┘äÏ¼┘ä┘èÏ»Ï®Ïî Ï¿Ï▒Ï»Ïî ÏÀ┘äÏºÏí',NULL,'Ï▒ÏÀÏ¿┘è ┘è┘ê┘à┘èÏº┘ï','2025-08-17 18:07:14','2025-08-17 18:07:14'),(41,5,'ar','Ï¿┘èÏ»┘è┘â┘èÏ▒ Ï│Ï¿Ïº','Ï¿┘èÏ»┘è┘â┘èÏ▒ ┘üÏºÏ«Ï▒ ┘àÏ╣ Ï¬Ï»┘ä┘è┘â ┘ê┘é┘åÏºÏ╣','Ï¿┘èÏ»┘è┘â┘èÏ▒ ┘à┘à┘èÏ▓ ┘àÏ╣ Ï╣┘äÏºÏ¼ÏºÏ¬ ┘àÏ▒┘èÏ¡Ï®','Ï¡┘àÏº┘à Ï╣ÏÀÏ▒┘èÏî Ï¬┘éÏ┤┘èÏ▒Ïî ┘é┘åÏºÏ╣ ┘àÏ▒ÏÀÏ¿Ïî Ï¬Ï»┘ä┘è┘â 15 Ï»┘é┘è┘éÏ®Ïî ÏÀ┘äÏºÏí',NULL,'ÏºÏ▒Ï¬Ï»┘è ÏúÏ¡Ï░┘èÏ® ┘à┘üÏ¬┘êÏ¡Ï®Ïî Ï¬Ï¼┘åÏ¿┘è Ïº┘ä┘åÏ┤ÏºÏÀ Ïº┘ä┘à┘âÏ½┘ü','2025-08-17 18:07:14','2025-08-17 18:07:14'),(42,6,'ar','Ï¿┘èÏ»┘è┘â┘èÏ▒ Ï¼┘ä','Ï¿┘èÏ»┘è┘â┘èÏ▒ Ï¿ÏÀ┘äÏºÏí Ï¼┘ä Ï┤Ï¿┘ç Ï»ÏºÏª┘à','Ï¿┘èÏ»┘è┘â┘èÏ▒ Ï¿ÏÀ┘äÏºÏí Ï¼┘ä ÏÀ┘ê┘è┘ä Ïº┘ä┘àÏ»┘ë','Ï╣┘åÏº┘èÏ® ┘âÏº┘à┘äÏ® + ÏÀ┘äÏºÏí Ï¼┘ä + Ï¬Ï¼┘ü┘è┘ü Ï¿Ïº┘äÏúÏ┤Ï╣Ï®',NULL,'┘äÏº Ï¬Ï«Ï»Ï┤┘è Ïº┘äÏÀ┘äÏºÏíÏî ÏºÏ│Ï¬Ï«Ï»┘à┘è ┘àÏ▓┘è┘ä ┘à┘åÏºÏ│Ï¿','2025-08-17 18:07:14','2025-08-17 18:07:14'),(43,7,'ar','┘ü┘å ÏúÏ©Ïº┘üÏ▒ Ï¿Ï│┘èÏÀ','Ï▓Ï«Ï▒┘üÏ® Ï¿Ï│┘èÏÀÏ® Ï╣┘ä┘ë Ïº┘äÏúÏ©Ïº┘üÏ▒','Ïú┘å┘àÏºÏÀ Ï¿Ï│┘èÏÀÏ® ┘êÏú┘å┘è┘éÏ®','Ï▓Ï«Ï▒┘üÏ® Ï╣┘ä┘ë 2-5 ÏúÏ©Ïº┘üÏ▒Ïî ÏºÏ«Ï¬┘èÏºÏ▒ Ïº┘äÏú┘å┘àÏºÏÀ',NULL,'ÏºÏ¬Ï▒┘â┘è┘ç ┘èÏ¼┘ü Ï¬┘àÏº┘àÏº┘ï','2025-08-17 18:07:14','2025-08-17 18:07:14'),(44,8,'ar','┘ü┘å ÏúÏ©Ïº┘üÏ▒ ┘àÏ╣┘éÏ»','ÏÑÏ¿Ï»ÏºÏ╣ÏºÏ¬ ┘ü┘å┘èÏ® ┘àÏ╣┘éÏ»Ï®','Ï¬ÏÁÏº┘à┘è┘à ┘ü┘å┘èÏ® Ï╣┘ä┘ë Ï¼┘à┘èÏ╣ Ïº┘äÏúÏ©Ïº┘üÏ▒','Ï¬ÏÁÏº┘à┘è┘à ┘àÏ«ÏÁÏÁÏ®Ïî ÏúÏ¡Ï¼ÏºÏ▒ Ï▒Ïº┘è┘åÏî Ï¿Ï▒┘è┘é',NULL,'Ï¬Ï¼┘åÏ¿┘è Ïº┘äÏÁÏ»┘àÏºÏ¬Ïî ÏºÏ▒Ï¬Ï»┘è ┘é┘üÏºÏ▓ÏºÏ¬ ┘ä┘äÏ¬┘åÏ©┘è┘ü','2025-08-17 18:07:14','2025-08-17 18:07:14'),(45,9,'ar','┘ü┘å ÏúÏ©Ïº┘üÏ▒ Ï½┘äÏºÏ½┘è Ïº┘äÏúÏ¿Ï╣ÏºÏ»','Ï▓Ï«ÏºÏ▒┘ü Ï¿ÏºÏ▒Ï▓Ï® ┘ê┘àÏ¼┘ê┘çÏ▒ÏºÏ¬ ÏúÏ©Ïº┘üÏ▒','ÏÑÏ¿Ï»ÏºÏ╣ÏºÏ¬ Ï½┘äÏºÏ½┘èÏ® Ïº┘äÏúÏ¿Ï╣ÏºÏ» ┘àÏ╣ Ï╣┘åÏºÏÁÏ▒ Ï¿ÏºÏ▒Ï▓Ï®','┘à┘åÏ¡┘êÏ¬ÏºÏ¬ Ï½┘äÏºÏ½┘èÏ® Ïº┘äÏúÏ¿Ï╣ÏºÏ»Ïî ┘àÏ¼┘ê┘çÏ▒ÏºÏ¬ ÏúÏ©Ïº┘üÏ▒Ïî Ï¬ÏúÏ½┘èÏ▒ÏºÏ¬ Ï«ÏºÏÁÏ®',NULL,'Ï¬Ï╣Ïº┘à┘ä┘è Ï¿Ï¡Ï░Ï▒Ïî Ï¬Ï¼┘åÏ¿┘è Ïº┘äÏÁÏ»┘àÏºÏ¬','2025-08-17 18:07:14','2025-08-17 18:07:14'),(46,10,'ar','Ï¬Ï▒┘â┘èÏ¿ ÏúÏÀÏ▒Ïº┘ü','ÏÑÏÀÏº┘äÏ® Ï¿ÏúÏÀÏ▒Ïº┘ü Ï¿┘äÏºÏ│Ï¬┘è┘â┘èÏ®','ÏÑÏÀÏº┘äÏ® Ïº┘äÏúÏ©Ïº┘üÏ▒ Ï¿Ïº┘äÏúÏÀÏ▒Ïº┘ü','ÏúÏÀÏ▒Ïº┘üÏî Ï¿Ï▒Ï» Ïº┘äÏ┤┘â┘äÏî ÏÀ┘äÏºÏí Ïú┘ê Ï¼┘ä',NULL,'Ï¬Ï¡Ï¬ÏºÏ¼ ┘ä┘àÏ│ ┘â┘ä 3-4 ÏúÏ│ÏºÏ¿┘èÏ╣','2025-08-17 18:07:14','2025-08-17 18:07:14'),(47,11,'ar','ÏÑÏÀÏº┘äÏ® Ï¼┘ä','ÏÑÏÀÏº┘äÏ® ┘àÏ┤┘â┘äÏ® Ï¿Ïº┘äÏ¼┘ä','ÏÑÏÀÏº┘äÏ® ÏÀÏ¿┘èÏ╣┘èÏ® ┘àÏ┤┘â┘äÏ® Ï¿Ï¼┘ä Ïº┘äÏúÏ┤Ï╣Ï® ┘ü┘ê┘é Ïº┘äÏ¿┘å┘üÏ│Ï¼┘èÏ®','┘åÏ¡Ï¬ Ï¿Ïº┘äÏ¼┘äÏî ÏºÏ«Ï¬┘èÏºÏ▒ Ïº┘äÏ┤┘â┘äÏî ┘ä┘àÏ│Ï® ┘å┘çÏºÏª┘èÏ® ┘àÏ½Ïº┘ä┘èÏ®',NULL,'ÏÁ┘èÏº┘åÏ® ÏºÏ¡Ï¬Ï▒Ïº┘ü┘èÏ® ┘àÏÀ┘ä┘êÏ¿Ï®','2025-08-17 18:07:14','2025-08-17 18:07:14'),(48,12,'ar','┘à┘äÏí Ïº┘äÏÑÏÀÏº┘äÏ®','┘ä┘àÏ│Ï® ┘êÏÁ┘èÏº┘åÏ® Ïº┘äÏÑÏÀÏº┘äÏ®','┘à┘äÏí ┘å┘à┘ê Ïº┘äÏúÏ©Ïº┘üÏ▒ ┘ü┘è Ïº┘äÏÑÏÀÏº┘äÏ®','Ï¿Ï▒Ï» Ïº┘ä┘å┘à┘êÏî ┘à┘äÏíÏî ┘ä┘àÏ│Ï® ┘å┘çÏºÏª┘èÏ®',NULL,'┘èÏ╣ÏºÏ» ┘â┘ä 3-4 ÏúÏ│ÏºÏ¿┘èÏ╣','2025-08-17 18:07:14','2025-08-17 18:07:14'),(49,13,'ar','Ï╣┘äÏºÏ¼ ┘à┘é┘ê┘è','Ï╣┘äÏºÏ¼ ┘ä┘äÏúÏ©Ïº┘üÏ▒ Ïº┘ä┘çÏ┤Ï®','Ï╣┘äÏºÏ¼ Ï¬Ï▒┘à┘è┘à┘è ┘ä┘äÏúÏ©Ïº┘üÏ▒ Ïº┘äÏ¬Ïº┘ä┘üÏ®','Ï╣┘äÏºÏ¼ ┘à┘é┘ê┘èÏî Ï¬Ï»┘ä┘è┘â Ïº┘äÏ¼┘ä┘èÏ»Ï®Ïî ÏÀ┘äÏºÏí Ï╣┘äÏºÏ¼┘è',NULL,'ÏÂÏ╣┘è Ï▓┘èÏ¬ Ïº┘äÏ¼┘ä┘èÏ»Ï® ┘è┘ê┘à┘èÏº┘ï','2025-08-17 18:07:14','2025-08-17 18:07:14'),(50,14,'ar','ÏÑÏÁ┘äÏºÏ¡ Ï©┘üÏ▒ ┘à┘âÏ│┘êÏ▒','ÏÑÏÁ┘äÏºÏ¡ ÏÀÏºÏ▒Ïª ┘äÏ©┘üÏ▒ Ï¬Ïº┘ä┘ü','ÏÑÏÁ┘äÏºÏ¡ ÏºÏ¡Ï¬Ï▒Ïº┘ü┘è Ï¿Ï▒┘éÏ╣Ï®','Ï▒┘éÏ╣Ï® ÏÑÏÁ┘äÏºÏ¡Ïî Ï¿Ï▒Ï»Ïî ┘ä┘àÏ│Ï® ┘å┘çÏºÏª┘èÏ® Ï«┘ü┘èÏ®',NULL,'Ï¬Ï¼┘åÏ¿┘è Ïº┘äÏÁÏ»┘àÏºÏ¬ Ï╣┘ä┘ë Ïº┘äÏ©┘üÏ▒ Ïº┘ä┘àÏÁ┘äÏ¡','2025-08-17 18:07:14','2025-08-17 18:07:14'),(51,15,'ar','ÏÑÏ▓Ïº┘äÏ® ÏÀ┘äÏºÏí Ïº┘äÏ¼┘ä','ÏÑÏ▓Ïº┘äÏ® ÏºÏ¡Ï¬Ï▒Ïº┘ü┘èÏ® ┘äÏÀ┘äÏºÏí Ïº┘äÏ¼┘ä','ÏÑÏ▓Ïº┘äÏ® ┘äÏÀ┘è┘üÏ® Ï»┘ê┘å ÏÑÏ¬┘äÏº┘ü Ïº┘äÏ©┘üÏ▒','ÏÑÏ▓Ïº┘äÏ® ÏºÏ¡Ï¬Ï▒Ïº┘ü┘èÏ®Ïî Ï╣┘äÏºÏ¼ ┘àÏ▒ÏÀÏ¿',NULL,'ÏºÏ¬Ï▒┘â┘è Ïº┘äÏúÏ©Ïº┘üÏ▒ Ï¬Ï¬┘å┘üÏ│ ┘ä┘àÏ»Ï® 24 Ï│ÏºÏ╣Ï®','2025-08-17 18:07:14','2025-08-17 18:07:14'),(52,16,'ar','Ï¿Ïº┘éÏ® Ï¼┘àÏº┘ä Ïº┘ä┘èÏ»┘è┘å','┘àÏº┘å┘è┘â┘èÏ▒ + ┘ü┘å ÏúÏ©Ïº┘üÏ▒ + Ï╣┘äÏºÏ¼','Ï¿Ïº┘éÏ® ┘âÏº┘à┘äÏ® ┘äÏú┘èÏ»┘è ┘àÏ½Ïº┘ä┘èÏ®','┘àÏº┘å┘è┘â┘èÏ▒ Ï¼┘ä + ┘ü┘å ÏúÏ©Ïº┘üÏ▒ Ï¿Ï│┘èÏÀ + Ï╣┘äÏºÏ¼ Ïº┘äÏ¼┘ä┘èÏ»Ï®',NULL,'Ï¡Ïº┘üÏ©┘è Ï¿┘âÏ▒┘è┘à Ïº┘ä┘èÏ»┘è┘å ┘è┘ê┘à┘èÏº┘ï','2025-08-17 18:07:14','2025-08-17 18:07:14'),(53,17,'ar','Ï¿Ïº┘éÏ® Ï¼┘àÏº┘ä Ïº┘ä┘éÏ»┘à┘è┘å','Ï¿┘èÏ»┘è┘â┘èÏ▒ + ┘ü┘å ÏúÏ©Ïº┘üÏ▒ + Ï¬Ï»┘ä┘è┘â','Ï¿Ïº┘éÏ® ÏºÏ│Ï¬Ï▒Ï«ÏºÏí ┘ä┘ä┘éÏ»┘à┘è┘å','Ï¿┘èÏ»┘è┘â┘èÏ▒ Ï│Ï¿Ïº + ┘ü┘å ÏúÏ©Ïº┘üÏ▒ + Ï¬Ï»┘ä┘è┘â ┘à┘àÏ¬Ï»',NULL,'ÏºÏ▒Ï¬Ï»┘è ÏúÏ¡Ï░┘èÏ® ┘àÏ▒┘èÏ¡Ï®','2025-08-17 18:07:14','2025-08-17 18:07:14'),(54,18,'ar','Ï¿Ïº┘éÏ® ┘âÏº┘à┘äÏ®','┘àÏº┘å┘è┘â┘èÏ▒ + Ï¿┘èÏ»┘è┘â┘èÏ▒ + ┘ü┘å ÏúÏ©Ïº┘üÏ▒','Ï¬Ï¼Ï▒Ï¿Ï® Ï¼┘àÏº┘ä ┘âÏº┘à┘äÏ® ┘ä┘ä┘èÏ»┘è┘å ┘êÏº┘ä┘éÏ»┘à┘è┘å','┘àÏº┘å┘è┘â┘èÏ▒ Ï¼┘ä + Ï¿┘èÏ»┘è┘â┘èÏ▒ ┘â┘äÏºÏ│┘è┘â┘è + ┘ü┘å ÏúÏ©Ïº┘üÏ▒ Ï¡Ï│Ï¿ Ïº┘äÏºÏ«Ï¬┘èÏºÏ▒',NULL,'ÏºÏ¬Ï¿Ï╣┘è ┘åÏÁÏºÏªÏ¡ Ïº┘äÏÁ┘èÏº┘åÏ® ┘ä┘â┘ä Ï╣┘äÏºÏ¼','2025-08-17 18:07:14','2025-08-17 18:07:14');
/*!40000 ALTER TABLE `services_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
-- /*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs` (
  `id` int NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `mot_de_passe` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('admin','employe','super_admin') COLLATE utf8mb4_general_ci DEFAULT 'employe',
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs`
--

LOCK TABLES `utilisateurs` WRITE;
/*!40000 ALTER TABLE `utilisateurs` DISABLE KEYS */;
INSERT INTO `utilisateurs` VALUES (1,'Admin Chez Waad','admin@chezwaad.ca','$2b$12$rOz8kWKKU5PjU7eGBEtNruQcL4M2FT8Vh5XGjGVOhKQnhK5M4C4sO','super_admin',1,'2025-07-17 13:10:32');
/*!40000 ALTER TABLE `utilisateurs` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-26 15:01:38
