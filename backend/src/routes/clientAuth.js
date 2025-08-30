const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ClientModel = require('../models/Client');
const EmailService = require('../services/EmailService');
const { executeQuery } = require('../../config/database');
const { authenticateClient, validateClientRegistration } = require('../middleware/auth');
const router = express.Router();

// Rate limiting for login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Helper function to generate JWT token
const generateToken = (clientId) => {
    return jwt.sign(
        { clientId, type: 'client' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Client registration
router.post('/register', validateClientRegistration, async (req, res) => {
    try {
        const { nom, prenom, email, telephone, mot_de_passe } = req.body;

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

        // Format phone number for Tunisia (add +216 prefix if not present)
        let formattedPhone = telephone;
        if (telephone && !telephone.startsWith('+216')) {
            // If it's exactly 8 digits, add +216 prefix
            if (/^[0-9]{8}$/.test(telephone)) {
                formattedPhone = `+216${telephone}`;
            }
        }

        // Create client with auto-verification (no email service available)
        const clientData = {
            nom,
            prenom,
            email,
            telephone: formattedPhone,
            mot_de_passe: hashedPassword,
            email_verifie: true, // Auto-verify since no email service
            statut: 'actif',
            date_creation: new Date()
        };

        const clientId = await ClientModel.createClient(clientData);

        // No need for verification token since we auto-verify
        console.log(`Client créé et auto-vérifié: ${email}`);

        res.status(201).json({
            message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
            clientId
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        res.status(500).json({
            message: 'Erreur lors de la création du compte',
            error: error.message
        });
    }
});

// Client login
router.post('/login', async (req, res) => {
    try {
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Request body:', req.body);
        
        const { email, mot_de_passe } = req.body;

        console.log('Email:', email);
        console.log('Password provided:', mot_de_passe ? 'YES' : 'NO');
        console.log('Password length:', mot_de_passe ? mot_de_passe.length : 0);

        if (!email || !mot_de_passe) {
            console.log('Missing email or password');
            return res.status(400).json({
                message: 'Email et mot de passe requis'
            });
        }

        // Check login attempts
        const clientKey = email.toLowerCase();
        const attempts = loginAttempts.get(clientKey);
        
        console.log('Client key:', clientKey);
        console.log('Previous attempts:', attempts);
        
        if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS && Date.now() < attempts.lockoutUntil) {
            console.log('Account locked due to too many attempts');
            return res.status(429).json({
                message: 'Trop de tentatives de connexion. Réessayez plus tard.',
                lockoutUntil: attempts.lockoutUntil
            });
        }

        // Find client
        console.log('Searching for client with email:', email);
        const clients = await executeQuery(
            'SELECT id, nom, prenom, email, mot_de_passe, email_verifie, statut FROM clients WHERE email = ?',
            [email]
        );
        
        console.log('Database query result:', clients.length > 0 ? 'USER FOUND' : 'NO USER FOUND');
        if (clients.length > 0) {
            console.log('Found client:', { id: clients[0].id, email: clients[0].email, statut: clients[0].statut });
        }

        if (clients.length === 0) {
            console.log('No client found with this email');
            // Increment login attempts for non-existent emails too
            const currentAttempts = attempts ? attempts.count + 1 : 1;
            loginAttempts.set(clientKey, {
                count: currentAttempts,
                lockoutUntil: currentAttempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_TIME : null
            });

            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        const client = clients[0];
        console.log('Client found, checking status...');

        // Check if account is active
        if (client.statut !== 'actif') {
            console.log('Account is not active. Status:', client.statut);
            return res.status(401).json({
                message: 'Compte désactivé. Contactez le support.'
            });
        }

        console.log('Account is active, verifying password...');
        // Verify password
        const isValidPassword = await bcrypt.compare(mot_de_passe, client.mot_de_passe);
        console.log('Password verification result:', isValidPassword);

        if (!isValidPassword) {
            console.log('Password verification failed');
            // Increment login attempts
            const currentAttempts = attempts ? attempts.count + 1 : 1;
            loginAttempts.set(clientKey, {
                count: currentAttempts,
                lockoutUntil: currentAttempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_TIME : null
            });

            return res.status(401).json({
                message: 'Email ou mot de passe incorrect'
            });
        }

        console.log('Password verified successfully');
        // Reset login attempts on successful login
        loginAttempts.delete(clientKey);

        console.log('Generating JWT token...');
        // Generate JWT token
        const token = generateToken(client.id);
        console.log('Token generated successfully');

        console.log('Setting cookie and sending response...');
        // Set httpOnly cookie
        res.cookie('clientToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log('Login successful for client:', client.email);
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
        console.error('=== LOGIN ERROR ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Erreur lors de la connexion',
            error: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get current client profile
router.get('/profile', authenticateClient, async (req, res) => {
    try {
        const client = await ClientModel.getById(req.clientId);
        
        if (!client) {
            return res.status(404).json({
                message: 'Client non trouvé'
            });
        }

        // Remove sensitive information
        delete client.mot_de_passe;

        res.json(client);
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
        const { nom, prenom, telephone, adresse } = req.body;
        const clientId = req.clientId;

        const updateData = {};
        if (nom) updateData.nom = nom;
        if (prenom) updateData.prenom = prenom;
        if (telephone) updateData.telephone = telephone;
        if (adresse) updateData.adresse = adresse;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: 'Aucune donnée à mettre à jour'
            });
        }

        await ClientModel.update(clientId, updateData);

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

// Change password
router.put('/change-password', authenticateClient, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const clientId = req.clientId;

        if (!current_password || !new_password) {
            return res.status(400).json({
                message: 'Mot de passe actuel et nouveau mot de passe requis'
            });
        }

        // Get current password
        const clients = await executeQuery(
            'SELECT mot_de_passe FROM clients WHERE id = ?',
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
            return res.status(400).json({
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(new_password, 12);

        // Update password
        await executeQuery(
            'UPDATE clients SET mot_de_passe = ? WHERE id = ?',
            [hashedNewPassword, clientId]
        );

        res.json({
            message: 'Mot de passe modifié avec succès'
        });
    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        res.status(500).json({
            message: 'Erreur lors du changement de mot de passe',
            error: error.message
        });
    }
});

// Verify email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: 'Token de vérification requis'
            });
        }

        // Find verification token
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

        // Mark email as verified
        await executeQuery(
            'UPDATE clients SET email_verifie = true WHERE id = ?',
            [clientId]
        );

        // Mark token as used
        await executeQuery(
            'UPDATE client_verification_tokens SET used_at = ? WHERE token = ?',
            [new Date(), token]
        );

        res.json({
            message: 'Email vérifié avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        res.status(500).json({
            message: 'Erreur lors de la vérification de l\'email',
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
        const client = await ClientModel.getClientById(req.clientId);
        
        if (!client) {
            return res.status(401).json({
                message: 'Client non trouvé'
            });
        }

        // Remove sensitive information
        delete client.mot_de_passe;

        res.json({
            authenticated: true,
            client
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        res.status(401).json({
            authenticated: false,
            message: 'Non authentifié'
        });
    }
});

// Route: Request Password Reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Adresse email requise'
            });
        }

        // Always return success message to prevent email enumeration
        const successMessage = 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.';

        // Check if client exists
        const client = await ClientModel.findByEmail(email.trim().toLowerCase());
        
        if (client) {
            // Generate secure reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            
            // Generate 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

            // Store token and verification code in database
            await executeQuery(
                `INSERT INTO password_reset_tokens (client_id, token_hash, verification_code, expires_at) 
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 token_hash = VALUES(token_hash),
                 verification_code = VALUES(verification_code), 
                 expires_at = VALUES(expires_at), 
                 used_at = NULL`,
                [client.id, tokenHash, verificationCode, expiresAt]
            );

            // Send email with reset link and verification code
            try {
                await EmailService.sendPasswordResetEmail(
                    client.email,
                    resetToken,
                    verificationCode,
                    client.nom ? `${client.prenom} ${client.nom}` : client.prenom
                );
                console.log(`Password reset email sent to: ${client.email}`);
            } catch (emailError) {
                console.error('Failed to send password reset email:', emailError);
                // Don't reveal email sending failure to user
            }
        }

        // Always return success to prevent email enumeration
        res.json({
            success: true,
            message: successMessage
        });

    } catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la demande de réinitialisation'
        });
    }
});

// Route: Verify Password Reset Code
router.post('/verify-reset-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email et code de vérification requis'
            });
        }

        // Find client
        const client = await ClientModel.findByEmail(email.trim().toLowerCase());
        if (!client) {
            return res.status(400).json({
                success: false,
                message: 'Code de vérification invalide'
            });
        }

        // Check for valid, non-expired token with the verification code
        const tokenResult = await executeQuery(
            `SELECT * FROM password_reset_tokens 
             WHERE client_id = ? AND verification_code = ? AND expires_at > NOW() AND used_at IS NULL
             ORDER BY created_at DESC LIMIT 1`,
            [client.id, code.trim()]
        );

        if (!tokenResult || tokenResult.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Code de vérification invalide ou expiré'
            });
        }

        // Generate a new secure token for the password reset form
        const newResetToken = crypto.randomBytes(32).toString('hex');
        const newTokenHash = crypto.createHash('sha256').update(newResetToken).digest('hex');
        
        // Update the database record with the new token hash
        await executeQuery(
            `UPDATE password_reset_tokens 
             SET token_hash = ?
             WHERE id = ?`,
            [newTokenHash, tokenResult[0].id]
        );

        res.json({
            success: true,
            message: 'Code vérifié avec succès',
            token: newResetToken // Return the new raw token for password reset
        });

    } catch (error) {
        console.error('Error in verify-reset-code:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Route: Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token et nouveau mot de passe requis'
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Hash the token to find it in database
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid token
        const resetToken = await executeQuery(
            `SELECT rt.*, c.id as client_id, c.email 
             FROM password_reset_tokens rt
             JOIN clients c ON rt.client_id = c.id
             WHERE rt.token_hash = ? 
             AND rt.expires_at > NOW() 
             AND rt.used_at IS NULL`,
            [tokenHash]
        );

        if (!resetToken || resetToken.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }

        const tokenData = resetToken[0];

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and mark token as used
        await executeQuery('START TRANSACTION');
        
        try {
            // Update client password
            await executeQuery(
                'UPDATE clients SET mot_de_passe = ? WHERE id = ?',
                [hashedPassword, tokenData.client_id]
            );

            // Mark token as used
            await executeQuery(
                'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
                [tokenData.id]
            );

            await executeQuery('COMMIT');

            console.log(`Password reset successful for client ID: ${tokenData.client_id}`);

            res.json({
                success: true,
                message: 'Mot de passe réinitialisé avec succès'
            });

        } catch (dbError) {
            await executeQuery('ROLLBACK');
            throw dbError;
        }

    } catch (error) {
        console.error('Error in reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la réinitialisation'
        });
    }
});

// Route: Verify Reset Token
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                valid: false,
                message: 'Token requis'
            });
        }

        // Hash the token to find it in database
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Check if token is valid
        const resetToken = await executeQuery(
            `SELECT id FROM password_reset_tokens 
             WHERE token_hash = ? 
             AND expires_at > NOW() 
             AND used_at IS NULL`,
            [tokenHash]
        );

        const isValid = resetToken && resetToken.length > 0;

        res.json({
            valid: isValid,
            message: isValid ? 'Token valide' : 'Token invalide ou expiré'
        });

    } catch (error) {
        console.error('Error in verify-reset-token:', error);
        res.status(500).json({
            valid: false,
            message: 'Erreur serveur lors de la vérification'
        });
    }
});

// Route: Get Client Reservations
router.get('/reservations', authenticateClient, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const clientId = req.client.id;

        console.log(`Getting reservations for client ID: ${clientId}`);

        // Get reservations with service details
        const reservations = await executeQuery(
            `SELECT 
                r.*,
                s.nom as service_nom,
                s.duree as service_duree,
                s.prix as service_prix
             FROM reservations r
             LEFT JOIN services s ON r.service_id = s.id
             WHERE r.client_id = ?
             ORDER BY r.date_reservation DESC, r.heure_debut DESC
             LIMIT ? OFFSET ?`,
            [clientId, parseInt(limit), parseInt(offset)]
        );

        // Get total count
        const countResult = await executeQuery(
            'SELECT COUNT(*) as total FROM reservations WHERE client_id = ?',
            [clientId]
        );

        const total = countResult[0].total;

        res.json({
            success: true,
            reservations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error getting client reservations:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des réservations'
        });
    }
});

// Route: Get Single Client Reservation
router.get('/reservations/:id', authenticateClient, async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.client.id;

        console.log(`Getting reservation ${id} for client ID: ${clientId}`);

        const reservation = await executeQuery(
            `SELECT 
                r.*,
                s.nom as service_nom,
                s.duree as service_duree,
                s.prix as service_prix,
                s.description as service_description
             FROM reservations r
             LEFT JOIN services s ON r.service_id = s.id
             WHERE r.id = ? AND r.client_id = ?`,
            [id, clientId]
        );

        if (reservation.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        res.json({
            success: true,
            reservation: reservation[0]
        });

    } catch (error) {
        console.error('Error getting client reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la réservation'
        });
    }
});

// Route: Cancel Client Reservation
router.put('/reservations/:id/cancel', authenticateClient, async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.client.id;

        console.log(`Cancelling reservation ${id} for client ID: ${clientId}`);

        // Check if reservation exists and belongs to client
        const reservation = await executeQuery(
            'SELECT * FROM reservations WHERE id = ? AND client_id = ?',
            [id, clientId]
        );

        if (reservation.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        const currentReservation = reservation[0];

        // Check if reservation can be cancelled
        if (currentReservation.statut === 'annule') {
            return res.status(400).json({
                success: false,
                message: 'Cette réservation est déjà annulée'
            });
        }

        // Check if reservation is in the future (allow cancellation up to 2 hours before)
        const reservationDateTime = new Date(`${currentReservation.date_reservation} ${currentReservation.heure_debut}`);
        const now = new Date();
        const timeDifference = reservationDateTime.getTime() - now.getTime();
        const hoursDifference = timeDifference / (1000 * 3600);

        if (hoursDifference < 2) {
            return res.status(400).json({
                success: false,
                message: 'Les annulations doivent être effectuées au moins 2 heures avant le rendez-vous'
            });
        }

        // Update reservation status
        await executeQuery(
            'UPDATE reservations SET statut = ?, date_modification = NOW() WHERE id = ?',
            ['annule', id]
        );

        res.json({
            success: true,
            message: 'Réservation annulée avec succès'
        });

    } catch (error) {
        console.error('Error cancelling client reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'annulation de la réservation'
        });
    }
});

module.exports = router;
