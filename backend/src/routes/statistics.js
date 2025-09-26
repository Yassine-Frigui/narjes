const express = require('express');
const router = express.Router();
const { executeQuery } = require('../../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const dbCacheMiddleware = require('../middleware/dbCache');
const cacheService = require('../services/CacheService');

// Main statistics endpoint with caching
router.get('/', authenticateAdmin, dbCacheMiddleware.cacheStats(cacheService.TTL.MEDIUM), async (req, res) => {
    try {
        const { dateRange = '30' } = req.query;
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);

        // Overview statistics
        const overviewQueries = [
            `SELECT COUNT(*) as total_clients FROM clients WHERE actif = TRUE`,
            `SELECT COUNT(*) as total_reservations FROM reservations WHERE date_reservation >= '${startDateStr}'`,
            `SELECT SUM(prix_final) as total_revenue FROM reservations WHERE date_reservation >= '${startDateStr}' AND statut IN ('terminee', 'confirmee')`,
            `SELECT COUNT(*) as total_services FROM services WHERE actif = TRUE`
        ];

        const overviewResults = await Promise.all(
            overviewQueries.map(query => executeQuery(query))
        );

        // === A. CRUCIAL METRICS - ENHANCED FINANCIAL TRACKING ===
        
        // 1. Financial Revenue Analysis - Actual vs Potential vs Lost
        const revenueAnalysisQuery = `
            SELECT 
                -- Actual Revenue (completed + confirmed)
                SUM(CASE WHEN statut IN ('terminee', 'confirmee') THEN prix_final ELSE 0 END) as revenue_completed,
                COUNT(CASE WHEN statut IN ('terminee', 'confirmee') THEN 1 END) as bookings_completed,
                
                -- Potential Revenue (confirmed but not completed yet)
                SUM(CASE WHEN statut = 'en_cours' THEN prix_final ELSE 0 END) as revenue_potential,
                COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as bookings_confirmed,
                
                -- Lost Revenue (cancelled or no-show)
                SUM(CASE WHEN statut IN ('annulee', 'no_show') THEN prix_final ELSE 0 END) as revenue_lost,
                COUNT(CASE WHEN statut IN ('annulee', 'no_show') THEN 1 END) as bookings_lost
                 
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'
        `;

        // 2. Reservation Success Analysis
        const adminInterventionQuery = `
            SELECT 
                -- Total reservations
                COUNT(*) as total_reservations,
                AVG(prix_final) as avg_reservation_value,
                
                -- Success rate of reservations
                COUNT(CASE WHEN statut IN ('terminee', 'confirmee') THEN 1 END) as successful_completions,
                COUNT(CASE WHEN statut IN ('annulee', 'no_show') THEN 1 END) as failed_reservations,
                
                -- Revenue from completed reservations
                SUM(CASE WHEN statut IN ('terminee', 'confirmee') THEN prix_final ELSE 0 END) as total_revenue
                
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'
        `;

        // 3. Status Breakdown with Financial Impact
        const statusBreakdownQuery = `
            SELECT 
                statut,
                COUNT(*) as count,
                SUM(prix_final) as total_value,
                AVG(prix_final) as avg_value,
                -- Percentage of total bookings
                (COUNT(*) * 100.0 / (
                    SELECT COUNT(*) FROM reservations 
                    WHERE date_reservation >= '${startDateStr}'
                )) as percentage_of_total,
                -- Percentage of total potential revenue
                (SUM(prix_final) * 100.0 / (
                    SELECT SUM(prix_final) FROM reservations 
                    WHERE date_reservation >= '${startDateStr}'
                )) as percentage_of_revenue
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'
            GROUP BY statut
            ORDER BY total_value DESC
        `;



        // Additional queries for comprehensive analytics
        const peakHoursQuery = `
            SELECT 
                HOUR(STR_TO_DATE(heure_debut, '%H:%i:%s')) as hour,
                COUNT(*) as bookings
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'
            GROUP BY HOUR(STR_TO_DATE(heure_debut, '%H:%i:%s'))
            ORDER BY bookings DESC
        `;

        const cancellationStatsQuery = `
            SELECT 
                statut,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE date_reservation >= '${startDateStr}')) as percentage
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND statut IN ('annulee', 'no_show')
            GROUP BY statut
        `;

        const avgSpendQuery = `
            SELECT 
                AVG(prix_final) as avg_spend,
                COUNT(DISTINCT client_id) as unique_clients
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND statut IN ('terminee', 'confirmee')
        `;

        const revenueByServiceQuery = `
            SELECT 
                s.nom as service_name,
                'Sourcils' as category,
                COUNT(r.id) as bookings,
                SUM(r.prix_final) as revenue,
                AVG(r.prix_final) as avg_price
            FROM services s
            LEFT JOIN reservations r ON s.id = r.service_id
            WHERE r.date_reservation >= '${startDateStr}'
                AND r.statut IN ('terminee', 'confirmee')
            GROUP BY s.id, s.nom
            ORDER BY revenue DESC
        `;

        const clientAnalysisQuery = `
            SELECT 
                SUM(CASE WHEN client_reservations.reservation_count = 1 THEN 1 ELSE 0 END) as new_clients,
                SUM(CASE WHEN client_reservations.reservation_count > 1 THEN 1 ELSE 0 END) as returning_clients
            FROM (
                SELECT 
                    client_id,
                    COUNT(*) as reservation_count
                FROM reservations 
                WHERE date_reservation >= '${startDateStr}' 
                    AND statut IN ('terminee', 'confirmee')
                GROUP BY client_id
            ) as client_reservations
        `;

        const popularServicesQuery = `
            SELECT 
                s.nom as name,
                COUNT(r.id) as bookings,
                SUM(r.prix_final) as revenue
            FROM services s
            LEFT JOIN reservations r ON s.id = r.service_id
            WHERE r.date_reservation >= '${startDateStr}'

            GROUP BY s.id, s.nom
            ORDER BY bookings DESC
            LIMIT 5
        `;

        const revenueTrendQuery = `
            SELECT 
                date_reservation as date,
                SUM(prix_final) as revenue,
                COUNT(*) as bookings
            FROM reservations 
            WHERE date_reservation >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                AND statut IN ('terminee', 'confirmee')
            GROUP BY date_reservation
            ORDER BY date_reservation ASC
        `;

        const monthlyComparisonQuery = `
            SELECT 
                DATE_FORMAT(date_reservation, '%Y-%m') as month,
                COUNT(*) as bookings,
                SUM(prix_final) as revenue
            FROM reservations 
            WHERE DATE_FORMAT(date_reservation, '%Y-%m') IN ('${thisMonth}', '${new Date().toISOString().slice(0, 7)}')
                AND statut IN ('terminee', 'confirmee')
            GROUP BY DATE_FORMAT(date_reservation, '%Y-%m')
            ORDER BY month DESC
        `;

        const clientGrowthQuery = `
            SELECT 
                DATE(date_creation) as date,
                COUNT(*) as new_clients
            FROM clients 
            WHERE date_creation >= '${startDateStr}'
            GROUP BY DATE(date_creation)
            ORDER BY date ASC
        `;

        // Execute all queries
        const [
            revenueAnalysis, adminIntervention, statusBreakdown,
            peakHours, cancellationStats, avgSpend, revenueByService,
            clientAnalysis, popularServices, revenueTrend, monthlyComparison, clientGrowth
        ] = await Promise.all([
            executeQuery(revenueAnalysisQuery),
            executeQuery(adminInterventionQuery),
            executeQuery(statusBreakdownQuery),
            executeQuery(peakHoursQuery),
            executeQuery(cancellationStatsQuery),
            executeQuery(avgSpendQuery),
            executeQuery(revenueByServiceQuery),
            executeQuery(clientAnalysisQuery),
            executeQuery(popularServicesQuery),
            executeQuery(revenueTrendQuery),
            executeQuery(monthlyComparisonQuery),
            executeQuery(clientGrowthQuery)
        ]);

        // Calculate growth percentages
        const currentMonth = monthlyComparison.find(m => m.month === thisMonth) || { bookings: 0, revenue: 0 };
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().slice(0, 7);
        const previousMonth = monthlyComparison.find(m => m.month === lastMonthStr) || { bookings: 0, revenue: 0 };
        
        const bookingGrowth = previousMonth.bookings > 0 
            ? ((currentMonth.bookings - previousMonth.bookings) / previousMonth.bookings * 100).toFixed(1)
            : 0;
            
        const revenueGrowth = previousMonth.revenue > 0 
            ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)
            : 0;

        const response = {
            success: true,
            data: {
                // Basic Overview
                overview: {
                    totalClients: overviewResults[0][0]?.total_clients || 0,
                    totalReservations: overviewResults[1][0]?.total_reservations || 0,
                    totalRevenue: overviewResults[2][0]?.total_revenue || 0,
                    totalServices: overviewResults[3][0]?.total_services || 0,
                    bookingGrowth: parseFloat(bookingGrowth),
                    revenueGrowth: parseFloat(revenueGrowth),
                    completedReservations: revenueAnalysis[0]?.bookings_completed || 0,
                    avgSpendPerClient: avgSpend[0]?.avg_spend || 0
                },

                // === FINANCIAL TRACKING ===
                financialOverview: {
                    // Actual money earned
                    revenueCompleted: parseFloat(revenueAnalysis[0]?.revenue_completed || 0),
                    bookingsCompleted: revenueAnalysis[0]?.bookings_completed || 0,
                    
                    // Money expected from confirmed bookings
                    revenuePotential: parseFloat(revenueAnalysis[0]?.revenue_potential || 0),
                    bookingsConfirmed: revenueAnalysis[0]?.bookings_confirmed || 0,
                    
                    // Money lost from cancellations/no-shows
                    revenueLost: parseFloat(revenueAnalysis[0]?.revenue_lost || 0),
                    bookingsLost: revenueAnalysis[0]?.bookings_lost || 0,
                    
                    // Total potential if everything was completed
                    totalPotentialRevenue: parseFloat(
                        (revenueAnalysis[0]?.revenue_completed || 0) + 
                        (revenueAnalysis[0]?.revenue_potential || 0) + 
                        (revenueAnalysis[0]?.revenue_lost || 0)
                    )
                },

                // === RESERVATION SUCCESS TRACKING ===
                reservationSuccess: {
                    totalReservations: adminIntervention[0]?.total_reservations || 0,
                    avgReservationValue: parseFloat(adminIntervention[0]?.avg_reservation_value || 0),
                    successfulCompletions: adminIntervention[0]?.successful_completions || 0,
                    failedReservations: adminIntervention[0]?.failed_reservations || 0,
                    totalRevenue: parseFloat(adminIntervention[0]?.total_revenue || 0),
                    
                    // Success rate of reservations
                    successRate: adminIntervention[0]?.total_reservations > 0 
                        ? ((adminIntervention[0]?.successful_completions || 0) / 
                           adminIntervention[0]?.total_reservations * 100).toFixed(1)
                        : 0
                },



                // === STATUS BREAKDOWN WITH FINANCIAL IMPACT ===
                statusBreakdown: statusBreakdown.map(status => ({
                    status: status.statut,
                    count: status.count,
                    totalValue: parseFloat(status.total_value || 0),
                    avgValue: parseFloat(status.avg_value || 0),
                    percentageOfTotal: parseFloat(status.percentage_of_total || 0),
                    percentageOfRevenue: parseFloat(status.percentage_of_revenue || 0)
                })),

                // A. CRUCIAL METRICS
                reservationMetrics: {
                    peakHours: peakHours.map(h => ({
                        hour: h.hour,
                        bookings: h.bookings
                    })),
                    cancellationStats: cancellationStats.map(c => ({
                        status: c.statut,
                        count: c.count,
                        percentage: parseFloat(c.percentage || 0)
                    }))
                },

                revenueMetrics: {
                    totalRevenue: overviewResults[2][0]?.total_revenue || 0,
                    avgSpendPerClient: avgSpend[0]?.avg_spend || 0,
                    revenueByService: revenueByService.map(s => ({
                        serviceName: s.service_name,
                        category: s.category,
                        bookings: s.bookings || 0,
                        revenue: parseFloat(s.revenue || 0),
                        avgPrice: parseFloat(s.avg_price || 0)
                    }))
                },

                clientManagement: {
                    newVsReturning: {
                        newClients: clientAnalysis[0]?.new_clients || 0,
                        returningClients: clientAnalysis[0]?.returning_clients || 0
                    },
                    retentionRates: [], // Would need additional query for proper retention
                    vipClients: [] // Would need additional query for VIP clients
                },

                // B. INTERESTING METRICS
                serviceInsights: {
                    popularServices: popularServices.map(service => ({
                        name: service.name,
                        bookings: service.bookings || 0,
                        revenue: parseFloat(service.revenue || 0)
                    })),
                    seasonalTrends: [], // Would need additional query
                    serviceCombinations: [] // Would need additional query
                },

                clientInsights: {
                    bookingBehavior: {
                        avgLeadTime: 0, // Would need additional query
                        sameDayBookings: 0,
                        weekAdvanceBookings: 0,
                        longAdvanceBookings: 0
                    }
                },

                spaUtilization: {
                    utilizationHeatmap: [] // Would need additional query
                },

                financialInsights: {
                    clientLifetimeValue: {
                        avgCLV: 0, // Would need additional query
                        avgVisitsPerClient: 0,
                        avgClientLifespan: 0
                    }
                },

                // Existing data for compatibility
                revenueTrend: revenueTrend.map(item => ({
                    date: item.date,
                    revenue: parseFloat(item.revenue || 0),
                    bookings: item.bookings || 0
                })),
                clientGrowth: clientGrowth.map(item => ({
                    date: item.date,
                    newClients: item.new_clients || 0
                })),
                monthlyComparison: {
                    current: {
                        month: thisMonth,
                        bookings: currentMonth.bookings || 0,
                        revenue: parseFloat(currentMonth.revenue || 0)
                    },
                    previous: {
                        month: lastMonthStr,
                        bookings: previousMonth.bookings || 0,
                        revenue: parseFloat(previousMonth.revenue || 0)
                    }
                },

                // Basic trend data
                trends: {
                    reservationsGrowth: parseFloat(bookingGrowth),
                    revenueGrowth: parseFloat(revenueGrowth),
                    clientsGrowth: 0 // Would need additional query
                },

                // Services data
                services: {
                    mostPopular: popularServices.map(service => ({
                        name: service.name,
                        bookings: service.bookings || 0,
                        revenue: parseFloat(service.revenue || 0)
                    })),
                    revenue: popularServices.map(service => ({
                        name: service.name,
                        revenue: parseFloat(service.revenue || 0)
                    }))
                }
            }
        };

        console.log('📈 Sending comprehensive statistics response');
        res.json(response);

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});



// Financial statistics endpoint
router.get('/financial', authenticateAdmin, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const financialQuery = `
            SELECT 
                SUM(CASE WHEN statut = 'terminee' THEN prix_final ELSE 0 END) as total_revenue,
                COUNT(CASE WHEN statut = 'terminee' THEN 1 END) as completed_bookings,
                SUM(CASE WHEN statut IN ('confirmee', 'en_cours') THEN prix_final ELSE 0 END) as pending_revenue,
                COUNT(CASE WHEN statut IN ('confirmee', 'en_cours') THEN 1 END) as pending_bookings,
                SUM(CASE WHEN statut IN ('annulee', 'no_show') THEN prix_final ELSE 0 END) as lost_revenue,
                COUNT(CASE WHEN statut IN ('annulee', 'no_show') THEN 1 END) as lost_bookings
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}'

        `;

        const result = await executeQuery(financialQuery);
        const data = result[0] || {};

        res.json({
            success: true,
            data: {
                totalRevenue: parseFloat(data.total_revenue || 0),
                completedBookings: data.completed_bookings || 0,
                pendingRevenue: parseFloat(data.pending_revenue || 0),
                pendingBookings: data.pending_bookings || 0,
                lostRevenue: parseFloat(data.lost_revenue || 0),
                lostBookings: data.lost_bookings || 0,
                totalPotential: parseFloat((data.total_revenue || 0) + (data.pending_revenue || 0) + (data.lost_revenue || 0))
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
