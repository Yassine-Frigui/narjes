const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../../config/database');

// Middleware d'authentification pour les administrateurs
const authenticateAdmin = async (req, res, next) => {
    try {
        // BYPASS MODE (demo) - enabled when BYPASS_AUTH=1
        // WARNING: enable only for local/staging demos. Do NOT enable in public production.
        if (process.env.BYPASS_AUTH === '1') {
            console.log('🚨 AUTH BYPASS MODE ACTIVE - demo bypass enabled');
            req.admin = {
                id: 999,
                nom: 'Demo Admin (BYPASS)',
                email: 'dev@admin.local',
                role: 'super_admin'
            };
            return next();
        }

        const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.adminToken;
        
        if (!token) {
            return res.status(401).json({ message: 'Token d\'authentification requis' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await executeQuery(
            'SELECT id, nom, email, role FROM utilisateurs WHERE id = ? AND actif = TRUE',
            [decoded.id]
        );

        if (!admin.length) {
            return res.status(401).json({ message: 'Administrateur non trouvé ou inactif' });
        }

        req.admin = admin[0];
        next();
    } catch (error) {
        console.error('Erreur d\'authentification admin:', error);
        res.status(401).json({ message: 'Token invalide' });
    }
};

// Middleware pour vérifier les rôles
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ message: 'Authentification requise' });
        }

        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({ message: 'Permissions insuffisantes' });
        }

        next();
    };
};

// Middleware d'authentification pour les clients (optionnel)
const authenticateClient = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.clientToken;
        
        if (!token) {
            return res.status(401).json({ message: 'Token d\'authentification requis' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if this is a client token
        if (decoded.type !== 'client') {
            return res.status(401).json({ message: 'Token client requis' });
        }

        const client = await executeQuery(
            'SELECT id, nom, prenom, email, email_verifie, statut FROM clients WHERE id = ? AND statut = ?',
            [decoded.clientId, 'actif']
        );

        if (!client.length) {
            return res.status(401).json({ message: 'Client non trouvé ou inactif' });
        }

        req.client = client[0];
        req.clientId = client[0].id;
        next();
    } catch (error) {
        console.error('Erreur d\'authentification client:', error);
        res.status(401).json({ message: 'Token invalide' });
    }
};

// Fonction pour hasher les mots de passe
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Fonction pour vérifier les mots de passe
const verifyPassword = async (password, hashedPassword) => {
    try {
        // Standard bcrypt verification
        const isValid = await bcrypt.compare(password, hashedPassword);
        return isValid;
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
};

// Fonction pour générer un token JWT
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Fonction pour valider le format email
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Fonction pour valider le numéro de téléphone (format plus flexible)
const validatePhoneNumber = (phone) => {
    // Remove all spaces and special characters
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Check if it's a valid format (8-15 digits)
    const phoneRegex = /^[0-9]{8,15}$/;
    return phoneRegex.test(cleanPhone);
};

// Fonction pour sanitizer les entrées utilisateur
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    // Remove HTML tags, normalize whitespace, and trim
    return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
};

// Middleware de validation des données
const validateReservationData = (req, res, next) => {
    const { client_id, service_id, date_reservation, heure_debut, email } = req.body;

    // For public reservations, we need service_id, date_reservation, heure_debut, and email
    // For admin reservations, we need client_id instead of email
    if (!service_id || !date_reservation || !heure_debut || (!client_id && !email)) {
        return res.status(400).json({ 
            message: 'Données manquantes: service_id, date_reservation, heure_debut et (client_id ou email) sont requis' 
        });
    }

    // Vérifier que la date n'est pas dans le passé
    const reservationDate = new Date(date_reservation);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
        return res.status(400).json({ 
            message: 'La date de réservation ne peut pas être dans le passé' 
        });
    }

    next();
};

// Middleware de validation des données client
const validateClientData = (req, res, next) => {
    const { nom, prenom, email, telephone } = req.body;

    if (!nom || !prenom || !email || !telephone) {
        return res.status(400).json({ 
            message: 'Données manquantes: nom, prénom, email et téléphone sont requis' 
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    if (!validatePhoneNumber(telephone)) {
        return res.status(400).json({ message: 'Format de téléphone invalide' });
    }

    // Sanitizer les données
    req.body.nom = sanitizeInput(nom);
    req.body.prenom = sanitizeInput(prenom);
    req.body.email = sanitizeInput(email);

    next();
};

// Middleware de validation des données d'inscription client
const validateClientRegistration = (req, res, next) => {
    const { nom, prenom, email, telephone, mot_de_passe } = req.body;

    if (!nom || !prenom || !email || !telephone || !mot_de_passe) {
        return res.status(400).json({ 
            message: 'Données manquantes: nom, prénom, email, téléphone et mot de passe sont requis' 
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    if (!validatePhoneNumber(telephone)) {
        return res.status(400).json({ message: 'Format de téléphone invalide' });
    }

    if (mot_de_passe.length < 8) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Check password strength (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(mot_de_passe)) {
        return res.status(400).json({ 
            message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre' 
        });
    }

    // Sanitizer les données
    req.body.nom = sanitizeInput(nom);
    req.body.prenom = sanitizeInput(prenom);
    req.body.email = sanitizeInput(email);

    next();
};

module.exports = {
    authenticateAdmin,
    authenticateClient,
    requireRole,
    hashPassword,
    verifyPassword,
    generateToken,
    validateEmail,
    validatePhoneNumber,
    sanitizeInput,
    validateReservationData,
    validateClientData,
    validateClientRegistration
};
