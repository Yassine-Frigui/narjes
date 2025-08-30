const express = require('express');
const { authenticateAdmin } = require('../middleware/auth');
const { executeQuery } = require('../../config/database');
const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Main Statistics Dashboard
router.get('/', async (req, res) => {
    try {
        console.log('📊 Main Statistics endpoint called with query:', req.query);
        const { range = 'month' } = req.query;
        
        // Determine date range
        let startDate;
        const endDate = new Date();
        
        switch (range) {
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            default:
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
        }
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Overview Statistics
        const overviewQuery = `
            SELECT 
                COUNT(CASE WHEN reservation_status != 'draft' THEN 1 END) as totalReservations,
                COUNT(DISTINCT CASE WHEN reservation_status != 'draft' THEN client_id END) as totalClients,
                SUM(CASE WHEN reservation_status != 'draft' AND statut = 'terminee' THEN prix_final ELSE 0 END) as totalRevenue,
                COUNT(CASE WHEN reservation_status != 'draft' AND statut = 'terminee' THEN 1 END) as completedReservations,
                AVG(CASE WHEN reservation_status != 'draft' AND statut = 'terminee' THEN prix_final END) as avgSpendPerClient
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' AND date_reservation <= '${endDateStr}'
        `;

        // Services Performance
        const servicesQuery = `
            SELECT 
                s.nom as service_name,
                COUNT(r.id) as booking_count,
                SUM(r.prix_final) as total_revenue,
                AVG(r.prix_final) as avg_price
            FROM reservations r
            JOIN services s ON r.service_id = s.id
            WHERE r.date_reservation >= '${startDateStr}' 
                AND r.date_reservation <= '${endDateStr}'
                AND r.reservation_status != 'draft'
                AND r.statut = 'terminee'
            GROUP BY s.id, s.nom
            ORDER BY total_revenue DESC
            LIMIT 10
        `;

        // Status Distribution
        const statusQuery = `
            SELECT 
                statut,
                COUNT(*) as count,
                SUM(prix_final) as revenue
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND date_reservation <= '${endDateStr}'
                AND reservation_status != 'draft'
            GROUP BY statut
        `;

        // Execute all queries
        const [overview] = await executeQuery(overviewQuery);
        const services = await executeQuery(servicesQuery);
        const statusBreakdown = await executeQuery(statusQuery);

        console.log('📊 Overview data:', overview[0]);
        console.log('📊 Services data:', services?.length || 0);
        console.log('📊 Status breakdown:', statusBreakdown?.length || 0);

        const responseData = {
            success: true,
            data: {
                overview: {
                    totalReservations: overview[0]?.totalReservations || 0,
                    totalClients: overview[0]?.totalClients || 0,
                    totalRevenue: overview[0]?.totalRevenue || 0,
                    completedReservations: overview[0]?.completedReservations || 0,
                    avgSpendPerClient: overview[0]?.avgSpendPerClient || 0
                },
                services: {
                    mostPopular: services || [],
                    revenue: services || []
                },
                statusBreakdown: statusBreakdown || [],
                trends: {
                    reservationsGrowth: 0,
                    revenueGrowth: 0,
                    clientsGrowth: 0
                }
            }
        };

        console.log('📊 Sending main statistics response:', JSON.stringify(responseData, null, 2));
        res.json(responseData);

    } catch (error) {
        console.error('❌ Statistics Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du chargement des statistiques',
            error: error.message 
        });
    }
});

// Draft Performance Statistics
router.get('/draft-performance', async (req, res) => {
    try {
        console.log('🎯 Draft Performance endpoint started with query:', req.query);
        const { period = '30' } = req.query;
        
        const query = `
            SELECT 
                COUNT(CASE WHEN reservation_status = 'draft' THEN 1 END) as total_drafts_created,
                COUNT(CASE WHEN reservation_status = 'draft' AND statut IN ('confirmee', 'terminee') THEN 1 END) as drafts_converted,
                COUNT(CASE WHEN reservation_status = 'draft' AND statut = 'draft' THEN 1 END) as drafts_pending,
                COUNT(CASE WHEN reservation_status = 'reserved' THEN 1 END) as direct_bookings,
                COALESCE(SUM(CASE WHEN reservation_status = 'draft' AND statut IN ('confirmee', 'terminee') THEN prix_final ELSE 0 END), 0) as revenue_from_conversions,
                COALESCE(SUM(CASE WHEN reservation_status = 'reserved' THEN prix_final ELSE 0 END), 0) as revenue_from_direct
            FROM reservations
        `;
        
        console.log('📊 Executing draft performance query');
        const result = await executeQuery(query);
        console.log('📈 Query result:', result);
        
        const data = result[0] || {
            total_drafts_created: 0,
            drafts_converted: 0,
            drafts_pending: 0,
            direct_bookings: 0,
            revenue_from_conversions: 0,
            revenue_from_direct: 0
        };
        
        const conversionRate = data.total_drafts_created > 0 ? 
            (data.drafts_converted / data.total_drafts_created * 100) : 0;

        const response = {
            success: true,
            data: {
                overview: {
                    totalDraftsCreated: data.total_drafts_created,
                    draftsConverted: data.drafts_converted,
                    draftsPending: data.drafts_pending,
                    directBookings: data.direct_bookings,
                    conversionRate: conversionRate.toFixed(1),
                    revenueFromConversions: data.revenue_from_conversions,
                    revenueFromDirect: data.revenue_from_direct,
                    avgConvertedValue: data.drafts_converted > 0 ? (data.revenue_from_conversions / data.drafts_converted) : 0,
                    avgDirectValue: data.direct_bookings > 0 ? (data.revenue_from_direct / data.direct_bookings) : 0
                },
                statusBreakdown: [],
                dailyPerformance: [],
                insights: {
                    conversionEffectiveness: conversionRate > 20 ? 'excellent' : conversionRate > 10 ? 'good' : 'needs_improvement',
                    revenueComparison: 'converted_higher'
                }
            }
        };
        
        console.log('✅ Sending draft performance response');
        res.json(response);

    } catch (error) {
        console.error('❌ Draft Performance Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du chargement des statistiques de draft',
            error: error.message 
        });
    }
});

// Financial Statistics
router.get('/financial', async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        const startDateStr = startDate.toISOString().split('T')[0];

        const financialQuery = `
            SELECT 
                SUM(CASE WHEN statut = 'terminee' THEN prix_final ELSE 0 END) as total_revenue,
                SUM(CASE WHEN statut IN ('annulee', 'no_show') THEN prix_final ELSE 0 END) as lost_revenue,
                COUNT(CASE WHEN statut = 'terminee' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN statut IN ('annulee', 'no_show') THEN 1 END) as lost_bookings,
                AVG(CASE WHEN statut = 'terminee' THEN prix_final END) as avg_transaction_value
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'
                AND reservation_status != 'draft'
        `;

        const [financial] = await executeQuery(financialQuery);

        res.json({
            success: true,
            data: {
                totalRevenue: financial[0]?.total_revenue || 0,
                lostRevenue: financial[0]?.lost_revenue || 0,
                completedBookings: financial[0]?.completed_bookings || 0,
                lostBookings: financial[0]?.lost_bookings || 0,
                avgTransactionValue: financial[0]?.avg_transaction_value || 0
            }
        });

    } catch (error) {
        console.error('❌ Financial Statistics Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du chargement des statistiques financières',
            error: error.message 
        });
    }
});

module.exports = router;
