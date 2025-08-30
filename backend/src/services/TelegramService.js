const axios = require('axios');

class TelegramService {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        // Allow comma-separated chat IDs in env
        this.chatIds = (process.env.TELEGRAM_CHAT_ID || '').split(',').map(id => id.trim()).filter(Boolean);
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
        
        // Debug logging
        console.log('🤖 TelegramService initialized:');
        console.log('Bot Token:', this.botToken ? '✅ Configured' : '❌ Missing');
        console.log('Chat IDs:', this.chatIds);
        console.log('Number of chats:', this.chatIds.length);
    }

    /**
     * Send a message to one or more Telegram chats
     * @param {string} message - The message to send
     * @param {object} options - Additional options (parse_mode, etc.)
     * @param {string|string[]} chatIdsOverride - Optional chat ID(s) to override default
     */
    async sendMessage(message, options = {}, chatIdsOverride = null) {
        try {
            console.log('📤 Sending Telegram message...');
            
            if (!this.botToken || (!this.chatIds.length && !chatIdsOverride)) {
                console.warn('❌ Telegram bot token or chat ID(s) not configured');
                console.log('Bot token exists:', !!this.botToken);
                console.log('Default chat IDs:', this.chatIds);
                console.log('Override chat IDs:', chatIdsOverride);
                return false;
            }

            // Accept a single chat ID, array, or use default
            let chatIds = chatIdsOverride;
            if (!chatIds) {
                chatIds = this.chatIds;
            } else if (typeof chatIds === 'string') {
                chatIds = chatIds.split(',').map(id => id.trim()).filter(Boolean);
            }
            if (!Array.isArray(chatIds)) chatIds = [chatIds];
            if (!chatIds.length) {
                console.warn('❌ No valid chat IDs provided');
                return false;
            }

            console.log(`📨 Sending to ${chatIds.length} chat(s):`, chatIds);

            let allOk = true;
            for (const chatId of chatIds) {
                console.log(`📤 Sending to chat ${chatId}...`);
                const payload = {
                    chat_id: chatId,
                    text: message,
                    parse_mode: options.parse_mode || 'HTML',
                    disable_web_page_preview: options.disable_preview || true,
                    ...options
                };
                try {
                    const response = await axios.post(`${this.apiUrl}/sendMessage`, payload);
                    if (response.data.ok) {
                        console.log(`✅ Telegram message sent successfully to chat ${chatId}`);
                    } else {
                        console.error(`❌ Telegram API error for chat ${chatId}:`, response.data);
                        allOk = false;
                    }
                } catch (error) {
                    console.error(`❌ Error sending Telegram message to chat ${chatId}:`, error.message);
                    allOk = false;
                }
            }
            console.log(`📊 Message sending result: ${allOk ? 'All successful' : 'Some failed'}`);
            return allOk;
        } catch (error) {
            console.error('❌ Error in sendMessage:', error.message);
            return false;
        }
    }

    /**
     * Format reservation details for Telegram notification
     * @param {object} reservation - Reservation details
     * @param {object} client - Client details
     * @param {object} service - Service details
     */
    formatReservationMessage(reservation, client, service) {
        const emoji = {
            new: '✨',
            confirmed: '✅',
            cancelled: '❌',
            completed: '🎉'
        };

        const statusEmoji = emoji[reservation.statut] || '📅';
        
        // Format date and time
        const dateFormatted = new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const message = `
${statusEmoji} <b>NOUVELLE RÉSERVATION - Chez Waad</b>

👤 <b>Cliente:</b>
• Nom: ${client.prenom} ${client.nom}
• Téléphone: ${client.telephone}
• Email: ${client.email || 'Non renseigné'}

💅 <b>Service:</b>
• Service: ${service.nom}
• Prix: ${reservation.prix_final} DT
• Durée: ${service.duree} minutes

📅 <b>Rendez-vous:</b>
• Date: ${dateFormatted}
• Heure: ${reservation.heure_debut} - ${reservation.heure_fin}
• Statut: ${this.getStatusText(reservation.statut)}

💬 <b>Notes cliente:</b>
${reservation.notes_client || 'Aucune note'}

🆔 <b>Réservation #${reservation.id}</b>

⏰ <i>Notification envoyée le ${new Date().toLocaleString('fr-FR')}</i>
        `.trim();

        return message;
    }

    /**
     * Format reservation update message
     * @param {object} reservation - Updated reservation details
     * @param {string} action - Action performed (confirmed, cancelled, etc.)
     */
    formatReservationUpdateMessage(reservation, action) {
        const emoji = {
            confirmed: '✅',
            cancelled: '❌',
            modified: '✏️',
            completed: '🎉'
        };

        const actionEmoji = emoji[action] || '📝';
        const actionText = this.getActionText(action);

        const message = `
${actionEmoji} <b>MISE À JOUR RÉSERVATION</b>

🆔 <b>Réservation #${reservation.id}</b>
👤 <b>Cliente:</b> ${reservation.client_prenom} ${reservation.client_nom}
📞 <b>Téléphone:</b> ${reservation.client_telephone}

📝 <b>Action:</b> ${actionText}
📅 <b>Date:</b> ${new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}
⏰ <b>Heure:</b> ${reservation.heure_debut}
💅 <b>Service:</b> ${reservation.service_nom}

⏰ <i>Mis à jour le ${new Date().toLocaleString('fr-FR')}</i>
        `.trim();

        return message;
    }

    /**
     * Send new reservation notification
     * @param {object} reservationData - Complete reservation data
     */
    async sendNewReservationNotification(reservationData) {
        try {
            const { reservation, client, service } = reservationData;
            const message = this.formatReservationMessage(reservation, client, service);
            
            return await this.sendMessage(message);
        } catch (error) {
            console.error('Error sending new reservation notification:', error);
            return false;
        }
    }

    /**
     * Send reservation confirmation notification
     * @param {object} reservationData - Object containing reservation, client, and service
     */
    async sendReservationConfirmationNotification(reservationData) {
        try {
            const { reservation, client, service } = reservationData;
            
            const reservationDate = new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            const message = `✅ <b>RÉSERVATION CONFIRMÉE</b> ✅

👤 <b>Cliente:</b> ${client.prenom} ${client.nom}
📱 <b>Téléphone:</b> ${client.telephone}
✉️ <b>Email:</b> ${client.email}

🎯 <b>Service:</b> ${service.nom}
📅 <b>Date:</b> ${reservationDate}
⏰ <b>Heure:</b> ${reservation.heure_debut}
⌛ <b>Durée:</b> ${service.duree} min
💰 <b>Prix:</b> ${reservation.prix_final || service.prix} DT

🔍 <b>ID Réservation:</b> #${reservation.id}
📝 <b>Statut:</b> Confirmée

${reservation.notes_client ? `💭 <b>Notes:</b> ${reservation.notes_client}` : ''}

━━━━━━━━━━━━━━━━━━━━━
🎉 <i>Le client a confirmé sa réservation!</i>`;

            return await this.sendMessage(message);
        } catch (error) {
            console.error('Error sending reservation confirmation notification:', error);
            return false;
        }
    }

    /**
     * Send reservation update notification
     * @param {object} reservation - Updated reservation
     * @param {string} action - Action performed
     */
    async sendReservationUpdateNotification(reservation, action) {
        try {
            const message = this.formatReservationUpdateMessage(reservation, action);
            
            return await this.sendMessage(message);
        } catch (error) {
            console.error('Error sending reservation update notification:', error);
            return false;
        }
    }

    /**
     * Send daily reservations summary
     * @param {array} reservations - Today's reservations
     */
    async sendDailyReservationsSummary(reservations) {
        try {
            const today = new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            let message = `📊 <b>RÉSUMÉ JOURNALIER - ${today}</b>\n\n`;
            
            if (reservations.length === 0) {
                message += '🚫 Aucune réservation pour aujourd\'hui\n';
            } else {
                message += `📅 <b>${reservations.length} réservation(s) aujourd'hui:</b>\n\n`;
                
                reservations.forEach((res, index) => {
                    message += `${index + 1}. <b>${res.heure_debut}</b> - ${res.client_prenom} ${res.client_nom}\n`;
                    message += `   💅 ${res.service_nom} (${res.prix_final} DT)\n`;
                    message += `   📞 ${res.client_telephone}\n\n`;
                });

                const totalCA = reservations.reduce((sum, res) => sum + parseFloat(res.prix_final), 0);
                message += `💰 <b>CA prévu:</b> ${totalCA} DT`;
            }

            return await this.sendMessage(message);
        } catch (error) {
            console.error('Error sending daily summary:', error);
            return false;
        }
    }

    /**
     * Get status text in French
     */
    getStatusText(status) {
        const statusMap = {
            'en_attente': 'En attente',
            'confirmé': 'Confirmé',
            'annulé': 'Annulé',
            'terminé': 'Terminé'
        };
        return statusMap[status] || status;
    }

    /**
     * Get action text in French
     */
    getActionText(action) {
        const actionMap = {
            'confirmed': 'Réservation confirmée',
            'cancelled': 'Réservation annulée',
            'modified': 'Réservation modifiée',
            'completed': 'Réservation terminée'
        };
        return actionMap[action] || action;
    }

    /**
     * Test the Telegram connection
     */
    async testConnection() {
        try {
            const testMessage = `🔧 <b>Test de connexion Beauty Nails Chez Waad</b>\n\n✅ Le bot Telegram est correctement configuré!\n\n⏰ ${new Date().toLocaleString('fr-FR')}`;
            return await this.sendMessage(testMessage);
        } catch (error) {
            console.error('Telegram connection test failed:', error);
            return false;
        }
    }
}

module.exports = TelegramService;
