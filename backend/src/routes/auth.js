const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateAdmin } = require('../middleware/auth');
const { hashPassword, verifyPassword, generateToken } = require('../middleware/auth');
const { executeQuery } = require('../../config/database');
const router = express.Router();

// Connexion administrateur
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // BYPASS MODE (demo) - enabled when BYPASS_AUTH=1
        // WARNING: enable only for local demos. Do NOT enable in public production environments.
        if (process.env.BYPASS_AUTH === '1') {
            console.log('🚨 AUTH BYPASS MODE - AUTO LOGIN AS SUPER ADMIN (demo)');

            // Use the submitted email if present so any email can be used to bypass
            const mockEmail = email || 'dev@admin.local';

            const mockAdmin = {
                id: 999,
                nom: 'Demo Admin (BYPASS)',
                email: mockEmail,
                role: 'super_admin'
            };

            const token = generateToken({
                id: mockAdmin.id,
                email: mockAdmin.email,
                role: mockAdmin.role
            });

            // Determine whether cookie should be marked secure
            const cookieSecure = (process.env.FORCE_SECURE_COOKIES === '1') || 
                                (req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production');
            res.cookie('adminToken', token, {
                httpOnly: true,
                secure: cookieSecure,
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 heures
            });

            return res.json({
                message: 'Connexion réussie (BYPASS MODE)',
                admin: mockAdmin,
                token
            });
        }

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        // Rechercher l'utilisateur administrateur
        const admin = await executeQuery(
            'SELECT id, nom, email, mot_de_passe, role, actif FROM utilisateurs WHERE email = ? AND actif = TRUE',
            [email]
        );

        if (!admin.length) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        // Vérifier le mot de passe
        const isValidPassword = await verifyPassword(password, admin[0].mot_de_passe);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }

        // Générer le token
        const token = generateToken({
            id: admin[0].id,
            email: admin[0].email,
            role: admin[0].role
        });

        // Supprimer le mot de passe de la réponse
        const { mot_de_passe, ...adminData } = admin[0];

        const cookieSecure = (process.env.FORCE_SECURE_COOKIES === '1') ? true : (req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production');
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });

        res.json({
            message: 'Connexion réussie',
            admin: adminData,
            token
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Déconnexion
router.post('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.json({ message: 'Déconnexion réussie' });
});

// Rafraîchir le token
router.post('/refresh', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.adminToken;
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Token d\'authentification requis pour le rafraîchissement',
                needsLogin: true 
            });
        }

        // Try to decode the token, even if expired
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                // Token is expired, try to decode without verification to get the payload
                try {
                    decoded = jwt.decode(token);
                    if (!decoded || !decoded.id) {
                        return res.status(401).json({ 
                            message: 'Token invalide',
                            needsLogin: true 
                        });
                    }
                } catch (decodeError) {
                    return res.status(401).json({ 
                        message: 'Token corrompu',
                        needsLogin: true 
                    });
                }
            } else {
                return res.status(401).json({ 
                    message: 'Token invalide',
                    needsLogin: true 
                });
            }
        }

        // Verify the admin still exists and is active
        const admin = await executeQuery(
            'SELECT id, nom, email, role FROM utilisateurs WHERE id = ? AND actif = TRUE',
            [decoded.id]
        );

        if (!admin.length) {
            return res.status(401).json({ 
                message: 'Administrateur non trouvé ou inactif',
                needsLogin: true 
            });
        }

        // Generate a new token
        const newToken = generateToken({
            id: admin[0].id,
            email: admin[0].email,
            role: admin[0].role
        });

        // Update the cookie
        const cookieSecure2 = (process.env.FORCE_SECURE_COOKIES === '1') ? true : (req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production');
        res.cookie('adminToken', newToken, {
            httpOnly: true,
            secure: cookieSecure2,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            message: 'Token rafraîchi avec succès',
            token: newToken,
            admin: admin[0]
        });

    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        res.status(401).json({ 
            message: 'Erreur lors du rafraîchissement, reconnexion requise',
            needsLogin: true 
        });
    }
});

// Vérifier le token et récupérer les informations de l'admin connecté
router.get('/me', authenticateAdmin, async (req, res) => {
    try {
        res.json({
            admin: req.admin
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Créer un nouvel administrateur (réservé aux super_admin)
router.post('/register', authenticateAdmin, async (req, res) => {
    try {
        // Vérifier que l'utilisateur connecté est un super_admin
        if (req.admin.role !== 'super_admin') {
            return res.status(403).json({ message: 'Permissions insuffisantes' });
        }

        const { nom, email, password, role = 'admin' } = req.body;

        if (!nom || !email || !password) {
            return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
        }

        // Vérifier si l'email existe déjà
        const existingAdmin = await executeQuery(
            'SELECT id FROM utilisateurs WHERE email = ?',
            [email]
        );

        if (existingAdmin.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await hashPassword(password);

        // Créer l'administrateur
        const result = await executeQuery(
            'INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
            [nom, email, hashedPassword, role]
        );

        res.status(201).json({
            message: 'Administrateur créé avec succès',
            adminId: result.insertId
        });

    } catch (error) {
        console.error('Erreur lors de la création de l\'administrateur:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Changer le mot de passe
router.put('/change-password', authenticateAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
        }

        // Récupérer le mot de passe actuel
        const admin = await executeQuery(
            'SELECT mot_de_passe FROM utilisateurs WHERE id = ?',
            [req.admin.id]
        );

        // Vérifier le mot de passe actuel
        const isValidPassword = await verifyPassword(currentPassword, admin[0].mot_de_passe);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
        }

        // Hasher le nouveau mot de passe
        const hashedNewPassword = await hashPassword(newPassword);

        // Mettre à jour le mot de passe
        await executeQuery(
            'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
            [hashedNewPassword, req.admin.id]
        );

        res.json({ message: 'Mot de passe modifié avec succès' });

    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

module.exports = router;
