const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery } = require('../../config/database');
const { authenticateClient, validateClientRegistration } = require('../middleware/auth');
const router = express.Router();

// Rate limiting for login attempts (in-memory for simplicity)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Helper function to generate JWT token
const generateToken = (clientId, email) => {
    return jwt.sign(
        { 
            clientId, 
            email,
            type: 'client',
            iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Helper function to generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Helper function to validate password strength
const isPasswordStrong = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
};

// Helper function to log login attempts
const logLoginAttempt = async (clientId, email, ipAddress, success, userAgent = null) => {
    try {
        await executeQuery(
            `INSERT INTO client_login_attempts 
             (client_id, ip_address, success, attempted_at, user_agent) 
             VALUES (?, ?, ?, ?, ?)`,
            [clientId, ipAddress, success ? 1 : 0, new Date(), userAgent]
        );
    } catch (error) {
        console.error('Error logging login attempt:', error);
    }
};

// Client registration with enhanced security
router.post('/register', validateClientRegistration, async (req, res) => {
    try {
        const { nom, prenom, email, telephone, mot_de_passe, langue_preferee = 'fr' } = req.body;

        // Validate password strength
        if (!isPasswordStrong(mot_de_passe)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
            });
        }

        // Check if client already exists
        const existingClient = await executeQuery(
            'SELECT id FROM clients WHERE email = ?',
            [email]
        );

        if (existingClient.length > 0) {
            return res.status(400).json({
                message: 'Un compte avec cette adresse email existe déjà'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create client with simplified structure
        const result = await executeQuery(
            `INSERT INTO clients 
             (nom, prenom, email, telephone, mot_de_passe, email_verifie, statut, langue_preferee, date_creation) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nom, prenom, email, telephone, hashedPassword, false, 'inactif', langue_preferee, new Date()]
        );

        const clientId = result.insertId;

        // Store verification token in separate table
        await executeQuery(
            'INSERT INTO client_verification_tokens (client_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
            [clientId, verificationToken, 'email', new Date(Date.now() + 24 * 60 * 60 * 1000)] // 24 hours
        );

        // Log the registration attempt
        await logLoginAttempt(clientId, email, req.ip, true, req.get('User-Agent'));

        // In a real app, you would send verification email here
        console.log(`Verification token for ${email}: ${verificationToken}`);

        res.status(201).json({
            message: 'Compte créé avec succès. Veuillez vérifier votre email.',
            clientId,
            // In development, return the token for testing
            ...(process.env.NODE_ENV === 'development' && { verificationToken })
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        res.status(500).json({
            message: 'Erreur lors de la création du compte',
            error: error.message
        });
    }
});

// Enhanced client login with rate limiting
router.post('/login', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        if (!email || !mot_de_passe) {
            return res.status(400).json({
                message: 'Email et mot de passe requis'
            });
        }

        // Check login attempts (in-memory rate limiting)
        const clientKey = email.toLowerCase();
        const attempts = loginAttempts.get(clientKey);
        
        if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS && Date.now() < attempts.lockoutUntil) {
            return res.status(429).json({
                message: 'Trop de tentatives de connexion. Réessayez plus tard.',
                lockoutUntil: attempts.lockoutUntil
            });
        }

        // Find client with simplified query
        const clients = await executeQuery(
            'SELECT id, nom, prenom, email, mot_de_passe, email_verifie, statut FROM clients WHERE email = ?',
            [email]
        );

        if (clients.length === 0) {
            // Increment login attempts for non-existent emails too
            const currentAttempts = attempts ? attempts.count + 1 : 1;
            loginAttempts.set(clientKey, {
                count: currentAttempts,
                lockoutUntil: currentAttempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_TIME : null
            });

            await logLoginAttempt(null, email, req.ip, false, req.get('User-Agent'));

            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        const client = clients[0];

        // Check if account is active
        if (client.statut !== 'actif') {
            await logLoginAttempt(client.id, email, req.ip, false, req.get('User-Agent'));
            return res.status(401).json({
                message: 'Compte désactivé ou non vérifié. Contactez le support.'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(mot_de_passe, client.mot_de_passe);

        if (!isValidPassword) {
            // Increment login attempts
            const currentAttempts = attempts ? attempts.count + 1 : 1;
            loginAttempts.set(clientKey, {
                count: currentAttempts,
                lockoutUntil: currentAttempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_TIME : null
            });

            await logLoginAttempt(client.id, email, req.ip, false, req.get('User-Agent'));

            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Reset login attempts on successful login
        loginAttempts.delete(clientKey);

        // Generate JWT token
        const token = generateToken(client.id, client.email);

        // Create session with simplified structure
        const sessionId = crypto.randomUUID();
        await executeQuery(
            'INSERT INTO client_sessions (id, client_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
            [sessionId, client.id, token, req.ip, req.get('User-Agent'), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        );

        // Log successful attempt
        await logLoginAttempt(client.id, email, req.ip, true, req.get('User-Agent'));

        // Set httpOnly cookie
        res.cookie('clientToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Connexion réussie',
            client: {
                id: client.id,
                nom: client.nom,
                prenom: client.prenom,
                email: client.email,
                email_verifie: client.email_verifie
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            message: 'Erreur lors de la connexion',
            error: error.message
        });
    }
});

// Verify email using the correct table structure
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: 'Token de vérification requis'
            });
        }

        // Find verification token in the correct table
        const tokens = await executeQuery(
            'SELECT client_id FROM client_verification_tokens WHERE token = ? AND type = ? AND expires_at > ? AND used_at IS NULL',
            [token, 'email', new Date()]
        );

        if (tokens.length === 0) {
            return res.status(400).json({
                message: 'Token de vérification invalide ou expiré'
            });
        }

        const clientId = tokens[0].client_id;

        // Mark email as verified and activate account
        await executeQuery(
            'UPDATE clients SET email_verifie = true, statut = ? WHERE id = ?',
            ['actif', clientId]
        );

        // Mark token as used
        await executeQuery(
            'UPDATE client_verification_tokens SET used_at = ? WHERE token = ?',
            [new Date(), token]
        );

        res.json({
            message: 'Email vérifié avec succès. Votre compte est maintenant actif.'
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        res.status(500).json({
            message: 'Erreur lors de la vérification de l\'email',
            error: error.message
        });
    }
});

// Get current client profile
router.get('/profile', authenticateClient, async (req, res) => {
    try {
        const clients = await executeQuery(
            'SELECT id, nom, prenom, email, telephone, date_naissance, adresse, notes, email_verifie, statut, langue_preferee, actif, date_creation FROM clients WHERE id = ?',
            [req.clientId]
        );
        
        if (clients.length === 0) {
            return res.status(404).json({
                message: 'Client non trouvé'
            });
        }

        res.json(clients[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération du profil',
            error: error.message
        });
    }
});

// Update client profile
router.put('/profile', authenticateClient, async (req, res) => {
    try {
        const { nom, prenom, telephone, adresse, langue_preferee } = req.body;
        const clientId = req.clientId;

        const updateData = {};
        const updateFields = [];
        const updateValues = [];

        if (nom) {
            updateFields.push('nom = ?');
            updateValues.push(nom);
        }
        if (prenom) {
            updateFields.push('prenom = ?');
            updateValues.push(prenom);
        }
        if (telephone) {
            updateFields.push('telephone = ?');
            updateValues.push(telephone);
        }
        if (adresse) {
            updateFields.push('adresse = ?');
            updateValues.push(adresse);
        }
        if (langue_preferee) {
            updateFields.push('langue_preferee = ?');
            updateValues.push(langue_preferee);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                message: 'Aucune donnée à mettre à jour'
            });
        }

        updateValues.push(clientId);

        await executeQuery(
            `UPDATE clients SET ${updateFields.join(', ')}, date_modification = NOW() WHERE id = ?`,
            updateValues
        );

        res.json({
            message: 'Profil mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({
            message: 'Erreur lors de la mise à jour du profil',
            error: error.message
        });
    }
});

// Change password with enhanced security
router.put('/change-password', authenticateClient, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const clientId = req.clientId;

        if (!current_password || !new_password) {
            return res.status(400).json({
                message: 'Mot de passe actuel et nouveau mot de passe requis'
            });
        }

        // Validate new password strength
        if (!isPasswordStrong(new_password)) {
            return res.status(400).json({
                message: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
            });
        }

        // Get current password
        const clients = await executeQuery(
            'SELECT mot_de_passe, email FROM clients WHERE id = ?',
            [clientId]
        );

        if (clients.length === 0) {
            return res.status(404).json({
                message: 'Client non trouvé'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(current_password, clients[0].mot_de_passe);

        if (!isValidPassword) {
            await logLoginAttempt(clientId, clients[0].email, req.ip, false, req.get('User-Agent'));
            return res.status(400).json({
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(new_password, 12);

        // Update password
        await executeQuery(
            'UPDATE clients SET mot_de_passe = ?, date_modification = NOW() WHERE id = ?',
            [hashedNewPassword, clientId]
        );

        // Invalidate all existing sessions for security
        await executeQuery(
            'DELETE FROM client_sessions WHERE client_id = ?',
            [clientId]
        );

        // Clear the current session cookie
        res.clearCookie('clientToken');

        res.json({
            message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.'
        });
    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        res.status(500).json({
            message: 'Erreur lors du changement de mot de passe',
            error: error.message
        });
    }
});

// Client logout
router.post('/logout', authenticateClient, async (req, res) => {
    try {
        const token = req.cookies.clientToken;

        // Invalidate session
        if (token) {
            await executeQuery(
                'DELETE FROM client_sessions WHERE token = ?',
                [token]
            );
        }

        // Clear cookie
        res.clearCookie('clientToken');

        res.json({
            message: 'Déconnexion réussie'
        });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({
            message: 'Erreur lors de la déconnexion',
            error: error.message
        });
    }
});

// Check authentication status
router.get('/check', authenticateClient, async (req, res) => {
    try {
        const clients = await executeQuery(
            'SELECT id, nom, prenom, email, email_verifie, statut, langue_preferee FROM clients WHERE id = ? AND statut = ?',
            [req.clientId, 'actif']
        );
        
        if (clients.length === 0) {
            return res.status(401).json({
                authenticated: false,
                message: 'Client non trouvé ou compte désactivé'
            });
        }

        res.json({
            authenticated: true,
            client: clients[0]
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        res.status(401).json({
            authenticated: false,
            message: 'Non authentifié'
        });
    }
});

module.exports = router;
