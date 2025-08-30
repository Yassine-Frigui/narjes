const { executeQuery, executeTransaction } = require('../../config/database');

class ReservationModel {
    // ============================================================================
    // RESERVATION CRUD OPERATIONS
    // ============================================================================

    // Create a new reservation with items
    static async createReservation(reservationData) {
        const {
            client_id,
            service_id,
            date_reservation,
            heure_debut,
            heure_fin,
            notes_client,
            prix_service,
            prix_final,
            statut = 'en_attente',
            reservation_status = 'reserved',
            reservation_items = [],
            // Client data for draft conversions or new clients
            client_nom,
            client_prenom,
            client_telephone,
            client_email,
            session_id
        } = reservationData;

        // Prepare queries for transaction
        const queries = [];
        
        // Main reservation query
        const reservationQuery = `
            INSERT INTO reservations 
            (client_id, service_id, date_reservation, heure_debut, heure_fin, 
             statut, reservation_status, prix_service, prix_final, notes_client,
             client_nom, client_prenom, client_telephone, client_email, session_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        queries.push({
            query: reservationQuery,
            params: [
                client_id, 
                service_id, 
                date_reservation, 
                heure_debut, 
                heure_fin,
                statut || 'en_attente', 
                reservation_status || 'reserved', 
                prix_service || 0, 
                prix_final || prix_service || 0, 
                notes_client || null,
                client_nom || null,
                client_prenom || null,
                client_telephone || null,
                client_email || null,
                session_id || null
            ]
        });

        // Execute transaction
        const results = await executeTransaction(queries);
        const reservationId = results[0].insertId;

        return reservationId;
    }

    // Convert draft to confirmed reservation and create client if needed
    static async convertDraftToReservation(draftId) {
        return await executeTransaction(async (transaction) => {
            // Get draft data
            const draftQuery = `
                SELECT * FROM reservations 
                WHERE id = ? AND statut = 'draft'
            `;
            const draftResult = await transaction.query(draftQuery, [draftId]);
            
            if (!draftResult.length) {
                throw new Error('Draft reservation not found');
            }
            
            const draft = draftResult[0];
            let clientId = null;
            
            // Check if client exists by phone + name combination
            if (draft.client_telephone && draft.client_nom && draft.client_prenom) {
                const clientQuery = `
                    SELECT id FROM clients 
                    WHERE telephone = ? AND nom = ? AND prenom = ?
                `;
                const clientResult = await transaction.query(clientQuery, [
                    draft.client_telephone, draft.client_nom, draft.client_prenom
                ]);
                
                if (clientResult.length > 0) {
                    clientId = clientResult[0].id;
                } else {
                    // Create new client
                    const createClientQuery = `
                        INSERT INTO clients (nom, prenom, telephone, email, actif)
                        VALUES (?, ?, ?, ?, 1)
                    `;
                    const clientCreateResult = await transaction.query(createClientQuery, [
                        draft.client_nom, draft.client_prenom, draft.client_telephone, draft.client_email
                    ]);
                    clientId = clientCreateResult.insertId;
                }
            }
            
            // Get service price for pricing
            const serviceQuery = `SELECT prix FROM services WHERE id = ?`;
            const serviceResult = await transaction.query(serviceQuery, [draft.service_id]);
            const servicePrice = serviceResult[0]?.prix || 0;
            
            // Update draft to confirmed reservation
            const updateQuery = `
                UPDATE reservations 
                SET client_id = ?, 
                    statut = 'confirmee',
                    reservation_status = 'confirmed',
                    prix_service = ?,
                    prix_final = ?,
                    client_nom = NULL,
                    client_prenom = NULL,
                    client_telephone = NULL,
                    client_email = NULL,
                    session_id = NULL
                WHERE id = ?
            `;
            
            await transaction.query(updateQuery, [
                clientId, servicePrice, servicePrice, draftId
            ]);
            
            return draftId;
        });
    }

    // Get reservation by ID with all related data
    static async getReservationById(id) {
        const query = `
            SELECT 
                r.*,
                CONCAT(c.prenom, ' ', c.nom) as client_nom,
                c.email as client_email,
                c.telephone as client_telephone,
                s.nom as service_nom,
                s.description as service_description,
                s.duree as service_duree,
                s.prix as service_prix
            FROM reservations r
            JOIN clients c ON r.client_id = c.id
            JOIN services s ON r.service_id = s.id
            WHERE r.id = ?
        `;
        const result = await executeQuery(query, [id]);
        const reservation = result[0];

        if (!reservation) return null;

        // Get reservation items
        const itemsQuery = `
            SELECT 
                ri.*,
                s.nom as service_nom,
                s.description as service_description,
                s.service_type,
                s.duree as service_duree
            FROM reservation_items ri
            JOIN services s ON ri.service_id = s.id
            WHERE ri.reservation_id = ?
            ORDER BY ri.item_type, ri.id
        `;
        const items = await executeQuery(itemsQuery, [id]);

        return {
            ...reservation,
            items
        };
    }

    // Get reservations with filters
    static async getReservations(filters = {}) {
        let whereConditions = [];
        let params = [];
        
        // Date filters
        if (filters.date_debut && filters.date_fin) {
            whereConditions.push('r.date_reservation BETWEEN ? AND ?');
            params.push(filters.date_debut, filters.date_fin);
        } else if (filters.date) {
            whereConditions.push('r.date_reservation = ?');
            params.push(filters.date);
        }
        
        // Status filters
        if (filters.statut) {
            whereConditions.push('r.statut = ?');
            params.push(filters.statut);
        }
        
        if (filters.reservation_status) {
            whereConditions.push('r.reservation_status = ?');
            params.push(filters.reservation_status);
        }
        
        // Client filter
        if (filters.client_id) {
            whereConditions.push('r.client_id = ?');
            params.push(filters.client_id);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const query = `
            SELECT 
                r.id,
                r.date_reservation,
                r.heure_debut,
                r.heure_fin,
                r.statut,
                r.reservation_status,
                r.prix_service,
                r.prix_final,
                r.notes_client,
                r.date_creation,
                r.session_id,
                r.couleurs_choisies,
                -- For regular reservations, use client table data
                CASE 
                    WHEN r.client_id IS NOT NULL THEN CONCAT(c.prenom, ' ', c.nom)
                    ELSE CONCAT(COALESCE(r.client_prenom, ''), ' ', COALESCE(r.client_nom, ''))
                END as client_nom,
                CASE 
                    WHEN r.client_id IS NOT NULL THEN c.telephone
                    ELSE r.client_telephone
                END as client_telephone,
                CASE 
                    WHEN r.client_id IS NOT NULL THEN c.email
                    ELSE r.client_email
                END as client_email,
                s.nom as service_nom,
                s.duree as service_duree,
                s.service_type,
                s.prix as service_prix,
                r.client_id
            FROM reservations r
            LEFT JOIN clients c ON r.client_id = c.id
            JOIN services s ON r.service_id = s.id
            ${whereClause}
            ORDER BY r.date_reservation DESC, r.heure_debut ASC
        `;
        
        const results = await executeQuery(query, params);
        
        // Add is_draft flag based on statut
        return results.map(reservation => ({
            ...reservation,
            is_draft: reservation.statut === 'draft'
        }));
    }

    // Get today's reservations
    static async getTodayReservations() {
        const today = new Date().toISOString().split('T')[0];
        return await this.getReservations({ date: today });
    }

    // Get week's reservations
    static async getWeekReservations() {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));
        
        return await this.getReservations({
            date_debut: startOfWeek.toISOString().split('T')[0],
            date_fin: endOfWeek.toISOString().split('T')[0]
        });
    }

    // Update reservation status
    static async updateReservationStatus(id, statut, notes_admin = null) {
        console.log(`🔄 Updating reservation ${id} from status to ${statut}`);
        
        // Get current reservation details first
        const reservationQuery = 'SELECT * FROM reservations WHERE id = ?';
        const reservationResult = await executeQuery(reservationQuery, [id]);
        
        if (!reservationResult.length) {
            throw new Error('Reservation not found');
        }
        
        const reservation = reservationResult[0];
        console.log(`📋 Current reservation:`, {
            id: reservation.id,
            current_statut: reservation.statut,
            service_id: reservation.service_id,
            prix_final: reservation.prix_final,
            prix_service: reservation.prix_service
        });
        
        let updateFields = ['statut = ?'];
        let params = [statut];
        
        // If changing from draft/en_attente to confirmee/terminee, recalculate price
        const shouldRecalculatePrice = (reservation.statut === 'draft' || reservation.statut === 'en_attente') && 
            (statut === 'confirmee' || statut === 'terminee') && 
            (reservation.prix_final === 0 || reservation.prix_final === null || parseFloat(reservation.prix_final) === 0);
            
        console.log(`💰 Should recalculate price? ${shouldRecalculatePrice}`);
        console.log(`   - Current status: ${reservation.statut}, New status: ${statut}`);
        console.log(`   - Current prix_final: ${reservation.prix_final} (type: ${typeof reservation.prix_final})`);
        
        if (shouldRecalculatePrice) {
            // Get service price
            const serviceQuery = 'SELECT prix FROM services WHERE id = ?';
            const serviceResult = await executeQuery(serviceQuery, [reservation.service_id]);
            
            console.log(`🔍 Service query result:`, serviceResult);
            
            if (serviceResult.length > 0) {
                const servicePrice = serviceResult[0].prix;
                console.log(`💵 Service price found: ${servicePrice} (type: ${typeof servicePrice})`);
                updateFields.push('prix_service = ?', 'prix_final = ?');
                params.push(servicePrice, servicePrice);
                console.log(`📝 Will update with fields: ${updateFields.join(', ')}`);
                console.log(`📝 Parameters: ${JSON.stringify(params)}`);
            }
        }
        
        if (notes_admin) {
            updateFields.push('notes_admin = ?');
            params.push(notes_admin);
        }
        
        params.push(id);
        
        const query = `UPDATE reservations SET ${updateFields.join(', ')} WHERE id = ?`;
        console.log(`🚀 Executing query: ${query}`);
        console.log(`🚀 With params: ${JSON.stringify(params)}`);
        
        const result = await executeQuery(query, params);
        console.log(`✅ Update result:`, result);
        
        return result;
    }

    // Update full reservation
    static async updateReservation(id, reservationData) {
        const {
            date_reservation,
            heure_debut,
            heure_fin,
            statut,
            notes_admin,
            couleurs_choisies,
            temps_reel,
            satisfaction_client,
            commentaire_client,
            reservation_items
        } = reservationData;

        return await executeTransaction(async (transaction) => {
            // Update main reservation
            const reservationQuery = `
                UPDATE reservations 
                SET date_reservation = ?, heure_debut = ?, heure_fin = ?, statut = ?,
                    notes_admin = ?, couleurs_choisies = ?, temps_reel = ?,
                    satisfaction_client = ?, commentaire_client = ?
                WHERE id = ?
            `;
            
            await transaction.query(reservationQuery, [
                date_reservation, heure_debut, heure_fin, statut,
                notes_admin, couleurs_choisies, temps_reel,
                satisfaction_client, commentaire_client, id
            ]);

            // Update reservation items if provided
            if (reservation_items) {
                // Delete existing items
                await transaction.query('DELETE FROM reservation_items WHERE reservation_id = ?', [id]);
                
                // Insert new items
                const itemsQuery = `
                    INSERT INTO reservation_items 
                    (reservation_id, service_id, item_type, quantite, prix_unitaire, prix_total)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                for (const item of reservation_items) {
                    await transaction.query(itemsQuery, [
                        id,
                        item.service_id,
                        item.item_type || 'main',
                        item.quantite || 1,
                        item.prix_unitaire,
                        item.prix_total
                    ]);
                }
            }

            return true;
        });
    }

    // Delete reservation
    static async deleteReservation(id) {
        return await executeTransaction(async (transaction) => {
            // Delete reservation items first
            await transaction.query('DELETE FROM reservation_items WHERE reservation_id = ?', [id]);
            
            // Delete reservation
            await transaction.query('DELETE FROM reservations WHERE id = ?', [id]);
            
            return true;
        });
    }

    // ============================================================================
    // AVAILABILITY AND SCHEDULING
    // ============================================================================

    // Check time slot availability
    static async checkAvailability(date, heure_debut, heure_fin, excludeReservationId = null) {
        // First, let's check what reservations exist for this date
        const existingQuery = `
            SELECT id, heure_debut, heure_fin, statut, reservation_status, notes_client
            FROM reservations 
            WHERE date_reservation = ?
        `;
        const existingReservations = await executeQuery(existingQuery, [date]);
        console.log('🔍 All reservations for', date, ':', existingReservations);
        
        // Check specifically for conflicts
        let query = `
            SELECT id, heure_debut, heure_fin, statut, reservation_status
            FROM reservations 
            WHERE date_reservation = ? 
            AND statut NOT IN ('annulee', 'no_show', 'draft')
            AND reservation_status NOT IN ('draft', 'cancelled')
            AND (
                (heure_debut <= ? AND heure_fin > ?) OR
                (heure_debut < ? AND heure_fin >= ?) OR
                (heure_debut >= ? AND heure_fin <= ?)
            )
        `;
        let params = [date, heure_debut, heure_debut, heure_fin, heure_fin, heure_debut, heure_fin];
        
        if (excludeReservationId) {
            query += ' AND id != ?';
            params.push(excludeReservationId);
        }
        
        console.log('🕒 Checking availability for:', { date, heure_debut, heure_fin });
        console.log('📋 Conflict check query:', query);
        console.log('📋 Params:', params);
        
        const conflicts = await executeQuery(query, params);
        console.log('⚠️ Found conflicts:', conflicts);
        
        if (conflicts.length > 0) {
            console.log('❌ Time slot NOT available due to conflicts:', conflicts);
            return false;
        }
        
        console.log('✅ Time slot is available');
        return true;
    }

    // Get available time slots for a date
    static async getAvailableSlots(date, serviceDuration) {
        // Get opening hours for the day
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const dayOfWeek = dayNames[new Date(date).getDay()];
        
        const openingHoursQuery = `
            SELECT heure_debut, heure_fin 
            FROM creneaux_horaires 
            WHERE jour_semaine = ? AND actif = TRUE
        `;
        const openingHours = await executeQuery(openingHoursQuery, [dayOfWeek]);
        
        if (!openingHours.length) {
            return []; // Closed on this day
        }
        
        // Get existing reservations for this date
        const reservationsQuery = `
            SELECT heure_debut, heure_fin 
            FROM reservations 
            WHERE date_reservation = ? AND statut NOT IN ('annulee', 'no_show')
            ORDER BY heure_debut
        `;
        const existingReservations = await executeQuery(reservationsQuery, [date]);
        
        // Calculate available slots
        const availableSlots = [];
        const { heure_debut: openTime, heure_fin: closeTime } = openingHours[0];
        
        // This would need more complex implementation for complete functionality
        // For now, return basic structure
        return availableSlots;
    }

    // ============================================================================
    // STATISTICS AND REPORTING
    // ============================================================================

    // Get reservation statistics
    static async getReservationStats(dateDebut, dateFin) {
        const queries = [
            // Total reservations
            `SELECT COUNT(*) as total FROM reservations WHERE date_reservation BETWEEN ? AND ?`,
            
            // Reservations by status
            `SELECT statut, COUNT(*) as nombre FROM reservations 
             WHERE date_reservation BETWEEN ? AND ? 
             GROUP BY statut`,
            
            // Revenue
            `SELECT SUM(prix_final) as chiffre_affaires FROM reservations 
             WHERE date_reservation BETWEEN ? AND ? AND statut = 'terminee'`,
            
            // Average satisfaction
            `SELECT AVG(satisfaction_client) as satisfaction_moyenne FROM reservations 
             WHERE date_reservation BETWEEN ? AND ? AND satisfaction_client IS NOT NULL`,
            
            // Most popular services
            `SELECT s.nom, COUNT(*) as nombre FROM reservations r
             JOIN services s ON r.service_id = s.id
             WHERE r.date_reservation BETWEEN ? AND ?
             GROUP BY s.id, s.nom
             ORDER BY nombre DESC LIMIT 5`
        ];
        
        const results = await Promise.all(
            queries.map(query => executeQuery(query, [dateDebut, dateFin]))
        );
        
        return {
            total_reservations: results[0][0].total,
            reservations_par_statut: results[1],
            chiffre_affaires: results[2][0].chiffre_affaires || 0,
            satisfaction_moyenne: results[3][0].satisfaction_moyenne || 0,
            services_populaires: results[4]
        };
    }

    // Get reservation statistics by service type
    static async getServiceTypeStats(dateDebut, dateFin) {
        const query = `
            SELECT 
                s.service_type,
                COUNT(*) as nombre_reservations,
                SUM(r.prix_final) as chiffre_affaires,
                AVG(r.satisfaction_client) as satisfaction_moyenne
            FROM reservations r
            JOIN services s ON r.service_id = s.id
            WHERE r.date_reservation BETWEEN ? AND ?
            GROUP BY s.service_type
            ORDER BY nombre_reservations DESC
        `;
        
        return await executeQuery(query, [dateDebut, dateFin]);
    }

    // ============================================================================
    // ADDON MANAGEMENT
    // ============================================================================

    // Add addon to reservation
    static async addAddonToReservation(reservationId, serviceId, quantite = 1) {
        // Get addon service info
        const addonQuery = `
            SELECT nom, prix, service_type 
            FROM services 
            WHERE id = ? AND service_type = 'addon' AND actif = TRUE
        `;
        const addonResult = await executeQuery(addonQuery, [serviceId]);
        
        if (!addonResult.length) {
            throw new Error('Service addon non trouvé ou inactif');
        }
        
        const addon = addonResult[0];
        const prixTotal = addon.prix * quantite;

        return await executeTransaction(async (transaction) => {
            // Add reservation item
            const itemQuery = `
                INSERT INTO reservation_items 
                (reservation_id, service_id, item_type, prix, notes)
                VALUES (?, ?, 'addon', ?, ?)
            `;
            
            await transaction.query(itemQuery, [
                reservationId, serviceId, prixTotal, `Quantité: ${quantite}`
            ]);

            // Update reservation totals - calculate total from all items
            const totalQuery = `
                SELECT SUM(prix) as total_addons 
                FROM reservation_items 
                WHERE reservation_id = ? AND item_type = 'addon'
            `;
            
            const totalResult = await transaction.query(totalQuery, [reservationId]);
            const totalAddons = totalResult[0].total_addons || 0;
            
            // Get the base service price
            const baseQuery = `
                SELECT prix_service 
                FROM reservations 
                WHERE id = ?
            `;
            
            const baseResult = await transaction.query(baseQuery, [reservationId]);
            const prixService = baseResult[0].prix_service;
            
            // Update reservation final price
            const updateQuery = `
                UPDATE reservations 
                SET prix_final = ?
                WHERE id = ?
            `;
            
            await transaction.query(updateQuery, [prixService + totalAddons, reservationId]);

            return true;
        });
    }

    // Remove addon from reservation
    static async removeAddonFromReservation(reservationId, serviceId) {
        return await executeTransaction(async (transaction) => {
            // Get addon price
            const addonQuery = `
                SELECT prix 
                FROM reservation_items 
                WHERE reservation_id = ? AND service_id = ? AND item_type = 'addon'
            `;
            const addonResult = await transaction.query(addonQuery, [reservationId, serviceId]);
            
            if (!addonResult.length) {
                throw new Error('Addon non trouvé dans cette réservation');
            }

            // Remove reservation item
            await transaction.query(`
                DELETE FROM reservation_items 
                WHERE reservation_id = ? AND service_id = ? AND item_type = 'addon'
            `, [reservationId, serviceId]);

            // Recalculate totals from remaining items
            const totalQuery = `
                SELECT SUM(prix) as total_addons 
                FROM reservation_items 
                WHERE reservation_id = ? AND item_type = 'addon'
            `;
            
            const totalResult = await transaction.query(totalQuery, [reservationId]);
            const totalAddons = totalResult[0].total_addons || 0;
            
            // Get the base service price
            const baseQuery = `
                SELECT prix_service 
                FROM reservations 
                WHERE id = ?
            `;
            
            const baseResult = await transaction.query(baseQuery, [reservationId]);
            const prixService = baseResult[0].prix_service;
            
            // Update reservation final price
            await transaction.query(`
                UPDATE reservations 
                SET prix_final = ?
                WHERE id = ?
            `, [prixService + totalAddons, reservationId]);

            return true;
        });
    }

    // Get all addons for a reservation
    static async getReservationAddons(reservationId) {
        const query = `
            SELECT 
                ri.*,
                s.nom as service_nom,
                s.description as service_description
            FROM reservation_items ri
            JOIN services s ON ri.service_id = s.id
            WHERE ri.reservation_id = ? AND ri.item_type = 'addon'
            ORDER BY ri.id
        `;
        
        return await executeQuery(query, [reservationId]);
    }
}

module.exports = ReservationModel;
