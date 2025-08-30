const SibApiV3Sdk = require('sib-api-v3-sdk');

// Setup API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Check if API key is available
if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not found in environment variables');
    throw new Error('BREVO_API_KEY is required for email service');
}

defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

class EmailService {
    static async sendPasswordResetEmail(email, resetToken, verificationCode, clientName = '') {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/reset-password?token=${resetToken}`;
            
            const emailData = {
                sender: { 
                    email: process.env.BREVO_SENDER_EMAIL || "noreply@zenshespa.com", 
                    name: "Chez Waad Beauty" 
                },
                to: [{ email: email, name: clientName }],
                subject: "Code de réinitialisation - Chez Waad Beauty",
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #e91e63; margin: 0;">Chez Waad Beauty</h1>
                        </div>
                        
                        <h2 style="color: #333; margin-bottom: 20px;">Code de réinitialisation de mot de passe</h2>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                            Bonjour${clientName ? ' ' + clientName : ''},
                        </p>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                            Voici votre code de vérification pour réinitialiser votre mot de passe :
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background-color: #f8f9fa; border: 2px dashed #e91e63; padding: 20px; border-radius: 10px; display: inline-block;">
                                <span style="font-size: 32px; font-weight: bold; color: #e91e63; letter-spacing: 5px;">${verificationCode}</span>
                            </div>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 20px; text-align: center;">
                            Entrez ce code sur la page de réinitialisation pour continuer.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #e91e63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                Réinitialiser mon mot de passe
                            </a>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                            Ce code expire dans 30 minutes pour votre sécurité.
                        </p>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                            Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
                        </p>
                        
                        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #999; font-size: 12px;">
                            <p>Votre code de vérification : <strong>${verificationCode}</strong></p>
                            <p>Lien alternatif : <a href="${resetUrl}">${resetUrl}</a></p>
                        </div>
                    </div>
                `,
                textContent: `
                    Code de réinitialisation de mot de passe - Chez Waad Beauty
                    
                    Bonjour${clientName ? ' ' + clientName : ''},
                    
                    Voici votre code de vérification pour réinitialiser votre mot de passe :
                    
                    CODE: ${verificationCode}
                    
                    Entrez ce code sur la page de réinitialisation : ${resetUrl}
                    
                    Ce code expire dans 30 minutes pour votre sécurité.
                    
                    Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
                `
            };

            const result = await tranEmailApi.sendTransacEmail(emailData);
            
            // Log detailed response for debugging
            console.log('📧 Brevo API Response:', {
                statusCode: result.response?.statusCode,
                messageId: result.messageId,
                headers: result.response?.headers
            });
            
            // Check if the email was actually sent - messageId indicates success
            if (!result.messageId) {
                throw new Error(`Email sending failed - no messageId received`);
            }
            
            console.log('✅ Password reset email sent successfully to:', email);
            console.log('📧 Message ID:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Password reset email sending failed:', {
                message: error.message,
                response: error.response?.text || error.response?.data,
                status: error.response?.status,
                stack: error.stack
            });
            throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
        }
    }

    /**
     * Send reservation confirmation email
     * @param {string} email - Client email
     * @param {Object} reservation - Reservation details
     * @param {Object} client - Client details  
     * @param {Object} service - Service details
     * @param {string} verificationCode - 6-digit verification code
     */
    static async sendReservationConfirmation(email, reservation, client, service, verificationCode) {
        try {
            console.log('📧 Sending reservation confirmation email to:', email);

            // Use separate API key for reservations if available
            const apiKey = process.env.BREVO_RESERVATION_API_KEY || process.env.BREVO_API_KEY;
            const senderEmail = process.env.BREVO_RESERVATION_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || "noreply@zenshespa.com";
            
            // Configure API key for this instance
            const reservationClient = SibApiV3Sdk.ApiClient.instance;
            const apiKeyAuth = reservationClient.authentications['api-key'];
            apiKeyAuth.apiKey = apiKey;
            
            const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

            // Format date and time for display
            const reservationDate = new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const reservationTime = reservation.heure_debut;
            const clientName = client.prenom + (client.nom ? ' ' + client.nom : '');
            const serviceName = service.nom;
            const servicePrice = service.prix;

            const emailData = {
                sender: {
                    name: process.env.SALON_NAME || 'Chez Waad Beauty',
                    email: senderEmail
                },
                to: [{
                    email: email,
                    name: clientName
                }],
                subject: `Confirmation de réservation - ${serviceName}`,
                htmlContent: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
                        <div style="background: linear-gradient(135deg, #e91e63, #ad1457); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">
                                ✨ Réservation Confirmée ✨
                            </h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                                ${process.env.SALON_NAME || 'Chez Waad Beauty'}
                            </p>
                        </div>
                        
                        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <p style="color: #333; font-size: 18px; margin-bottom: 25px;">
                                Bonjour <strong>${clientName}</strong>,
                            </p>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                                Votre réservation a été confirmée avec succès ! Nous avons hâte de vous accueillir dans notre spa.
                            </p>
                            
                            <div style="background: #f8f9fa; border-left: 4px solid #e91e63; padding: 20px; margin: 25px 0; border-radius: 5px;">
                                <h3 style="color: #e91e63; margin-top: 0; font-size: 18px;">📋 Détails de votre réservation</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-weight: 500;">🎯 Service :</td>
                                        <td style="padding: 8px 0; color: #333; font-weight: bold;">${serviceName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-weight: 500;">📅 Date :</td>
                                        <td style="padding: 8px 0; color: #333; font-weight: bold;">${reservationDate}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-weight: 500;">⏰ Heure :</td>
                                        <td style="padding: 8px 0; color: #333; font-weight: bold;">${reservationTime}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-weight: 500;">💰 Prix :</td>
                                        <td style="padding: 8px 0; color: #333; font-weight: bold;">${servicePrice} DT</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, #4caf50, #2e7d32); padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
                                <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px;">🔐 Code de vérification</h3>
                                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; border: 2px dashed rgba(255,255,255,0.5);">
                                    <span style="color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                        ${verificationCode}
                                    </span>
                                </div>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                                    Présentez ce code lors de votre visite
                                </p>
                            </div>
                            
                            <div style="background: #fff3e0; border: 1px solid #ffcc02; padding: 15px; border-radius: 8px; margin: 25px 0;">
                                <p style="margin: 0; color: #ef6c00; font-weight: 500;">
                                    ⚠️ <strong>Important :</strong> Veuillez arriver 10 minutes avant votre rendez-vous.
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="color: #666; margin-bottom: 15px;">Besoin d'aide ? Contactez-nous :</p>
                                <p style="color: #e91e63; font-weight: bold; margin: 5px 0;">
                                    📞 ${process.env.SALON_PHONE || '+216 24 157 715'}
                                </p>
                                <p style="color: #e91e63; font-weight: bold; margin: 5px 0;">
                                    ✉️ ${process.env.SALON_EMAIL || 'contact@chezwaad.tn'}
                                </p>
                            </div>
                            
                            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                                <p style="color: #999; font-size: 14px; margin: 0;">
                                    Merci de nous faire confiance pour votre bien-être ✨
                                </p>
                                <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                                    ${process.env.SALON_NAME || 'Chez Waad Beauty'} - Votre havre de paix et de beauté
                                </p>
                            </div>
                        </div>
                    </div>
                `,
                textContent: `
                    Confirmation de réservation - ${serviceName}
                    
                    Bonjour ${clientName},
                    
                    Votre réservation a été confirmée avec succès !
                    
                    DÉTAILS DE VOTRE RÉSERVATION :
                    - Service : ${serviceName}
                    - Date : ${reservationDate}
                    - Heure : ${reservationTime}
                    - Prix : ${servicePrice} DT
                    
                    CODE DE VÉRIFICATION : ${verificationCode}
                    (Présentez ce code lors de votre visite)
                    
                    IMPORTANT : Veuillez arriver 10 minutes avant votre rendez-vous.
                    
                    Contact :
                    Téléphone : ${process.env.SALON_PHONE || '+216 24 157 715'}
                    Email : ${process.env.SALON_EMAIL || 'contact@chezwaad.tn'}
                    
                    Merci de nous faire confiance pour votre bien-être !
                    
                    ${process.env.SALON_NAME || 'Chez Waad Beauty'}
                `
            };

            const result = await tranEmailApi.sendTransacEmail(emailData);
            
            console.log('📧 Brevo API Response for reservation confirmation:', {
                statusCode: result.response?.statusCode,
                messageId: result.messageId
            });
            
            if (!result.messageId) {
                throw new Error(`Reservation confirmation email failed - no messageId received`);
            }
            
            console.log('✅ Reservation confirmation email sent successfully to:', email);
            console.log('📧 Message ID:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Reservation confirmation email sending failed:', {
                message: error.message,
                response: error.response?.text || error.response?.data,
                status: error.response?.status
            });
            throw new Error('Erreur lors de l\'envoi de l\'email de confirmation');
        }
    }

    /**
     * Send reservation verification email (with code and link)
     * @param {string} email - Client email
     * @param {Object} reservation - Reservation details
     * @param {Object} client - Client details  
     * @param {Object} service - Service details
     * @param {string} verificationCode - 6-digit verification code
     * @param {string} verificationToken - Verification token for link
     */
    static async sendReservationVerification(email, reservation, client, service, verificationCode, verificationToken) {
        try {
            console.log('📧 Sending reservation verification email to:', email);

            // Use separate API key for reservations if available
            const apiKey = process.env.BREVO_RESERVATION_API_KEY || process.env.BREVO_API_KEY;
            const senderEmail = process.env.BREVO_RESERVATION_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || "noreply@zenshespa.com";
            
            // Configure API key for this instance
            const reservationClient = SibApiV3Sdk.ApiClient.instance;
            const apiKeyAuth = reservationClient.authentications['api-key'];
            apiKeyAuth.apiKey = apiKey;
            
            const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

            // Format date and time for display
            const reservationDate = new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const reservationTime = reservation.heure_debut;
            const clientName = client.prenom + (client.nom ? ' ' + client.nom : '');
            const serviceName = service.nom;
            const servicePrice = service.prix;
            const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/reservations/verify-link/${verificationToken}`;

            const emailData = {
                sender: {
                    name: process.env.SALON_NAME || 'Chez Waad Beauty',
                    email: senderEmail
                },
                to: [{
                    email: email,
                    name: clientName
                }],
                subject: `Confirmez votre réservation - ${serviceName}`,
                htmlContent: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
                        <div style="background: linear-gradient(135deg, #e91e63, #ad1457); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">
                                🔐 Confirmez votre réservation
                            </h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                                ${process.env.SALON_NAME || 'Chez Waad Beauty'}
                            </p>
                        </div>
                        
                        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <p style="color: #333; font-size: 18px; margin-bottom: 25px;">
                                Bonjour <strong>${clientName}</strong>,
                            </p>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                                Votre réservation est presque finalisée ! Pour la confirmer, vous avez 3 options :
                            </p>
                            
                            <div style="background: #f8f9fa; border-left: 4px solid #e91e63; padding: 20px; margin: 25px 0; border-radius: 5px;">
                                <h3 style="color: #e91e63; margin-top: 0; font-size: 18px;">📋 Détails de votre réservation</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-weight: 500;">🎯 Service :</td>
                                        <td style="padding: 8px 0; color: #333; font-weight: bold;">${serviceName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-weight: 500;">📅 Date :</td>
                                        <td style="padding: 8px 0; color: #333; font-weight: bold;">${reservationDate}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-weight: 500;">⏰ Heure :</td>
                                        <td style="padding: 8px 0; color: #333; font-weight: bold;">${reservationTime}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666; font-weight: 500;">💰 Prix :</td>
                                        <td style="padding: 8px 0; color: #333; font-weight: bold;">${servicePrice} DT</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, #4caf50, #2e7d32); padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
                                <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">🔢 Option 1: Code de vérification</h3>
                                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; border: 2px dashed rgba(255,255,255,0.5);">
                                    <span style="color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                        ${verificationCode}
                                    </span>
                                </div>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                                    Saisissez ce code sur la page de confirmation
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 25px 0;">
                                <h3 style="color: #007bff; margin-bottom: 15px;">🔗 Option 2: Cliquer sur le lien</h3>
                                <a href="${verificationUrl}" 
                                   style="display: inline-block; background: linear-gradient(135deg, #007bff, #0056b3); 
                                          color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                                          font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(0,123,255,0.3);">
                                    ✅ Confirmer ma réservation
                                </a>
                            </div>
                            
                            <div style="background: #fff3e0; border: 1px solid #ffcc02; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center;">
                                <h4 style="color: #ef6c00; margin: 0 0 10px 0;">📞 Option 3: Pas d'accès à l'email ?</h4>
                                <p style="margin: 0; color: #ef6c00; font-weight: 500;">
                                    Ne vous inquiétez pas ! Cliquez sur "Pas d'accès à l'email" sur la page de confirmation.<br>
                                    Nous vous contacterons directement pour finaliser votre réservation.
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="color: #666; margin-bottom: 15px;">Besoin d'aide ? Contactez-nous :</p>
                                <p style="color: #e91e63; font-weight: bold; margin: 5px 0;">
                                    📞 ${process.env.SALON_PHONE || '+216 24 157 715'}
                                </p>
                                <p style="color: #e91e63; font-weight: bold; margin: 5px 0;">
                                    ✉️ ${process.env.SALON_EMAIL || 'contact@chezwaad.tn'}
                                </p>
                            </div>
                            
                            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                                <p style="color: #999; font-size: 14px; margin: 0;">
                                    Merci de nous faire confiance pour votre bien-être ✨
                                </p>
                                <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                                    ${process.env.SALON_NAME || 'Chez Waad Beauty'} - Votre havre de paix et de beauté
                                </p>
                            </div>
                        </div>
                    </div>
                `,
                textContent: `
                    Confirmez votre réservation - ${serviceName}
                    
                    Bonjour ${clientName},
                    
                    Votre réservation est presque finalisée ! Pour la confirmer, vous avez 3 options :
                    
                    DÉTAILS DE VOTRE RÉSERVATION :
                    - Service : ${serviceName}
                    - Date : ${reservationDate}
                    - Heure : ${reservationTime}
                    - Prix : ${servicePrice} DT
                    
                    OPTION 1 - CODE DE VÉRIFICATION : ${verificationCode}
                    (Saisissez ce code sur la page de confirmation)
                    
                    OPTION 2 - LIEN DE CONFIRMATION :
                    Cliquez sur ce lien : ${verificationUrl}
                    
                    OPTION 3 - PAS D'ACCÈS À L'EMAIL :
                    Cliquez sur "Pas d'accès à l'email" sur la page de confirmation.
                    Nous vous contacterons directement.
                    
                    Contact :
                    Téléphone : ${process.env.SALON_PHONE || '+216 24 157 715'}
                    Email : ${process.env.SALON_EMAIL || 'contact@chezwaad.tn'}
                    
                    Merci de nous faire confiance pour votre bien-être !
                    
                    ${process.env.SALON_NAME || 'Chez Waad Beauty'}
                `
            };

            const result = await tranEmailApi.sendTransacEmail(emailData);
            
            console.log('📧 Brevo API Response for verification email:', {
                statusCode: result.response?.statusCode,
                messageId: result.messageId
            });
            
            if (!result.messageId) {
                throw new Error(`Verification email failed - no messageId received`);
            }
            
            console.log('✅ Verification email sent successfully to:', email);
            console.log('📧 Message ID:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Verification email sending failed:', {
                message: error.message,
                response: error.response?.text || error.response?.data,
                status: error.response?.status
            });
            throw new Error('Erreur lors de l\'envoi de l\'email de vérification');
        }
    }
}

module.exports = EmailService;
