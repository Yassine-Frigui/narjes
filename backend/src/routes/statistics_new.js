const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Main statistics endpoint
router.get('/', authenticateAdmin, async (req, res) => {
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
            `SELECT COUNT(*) as total_reservations FROM reservations WHERE date_reservation >= '${startDateStr}' AND reservation_status != 'draft'`,
            `SELECT SUM(prix_final) as total_revenue FROM reservations WHERE date_reservation >= '${startDateStr}' AND statut = 'terminee'`,
            `SELECT COUNT(*) as total_services FROM services WHERE actif = TRUE`
        ];

        const overviewResults = await Promise.all(
            overviewQueries.map(query => executeQuery(query))
        );

        // === A. CRUCIAL METRICS - ENHANCED FINANCIAL TRACKING ===
        
        // 1. Financial Revenue Analysis - Actual vs Potential vs Lost
        const revenueAnalysisQuery = `
            SELECT 
                -- Actual Revenue (completed)
                SUM(CASE WHEN statut = 'terminee' THEN prix_final ELSE 0 END) as revenue_completed,
                COUNT(CASE WHEN statut = 'terminee' THEN 1 END) as bookings_completed,
                
                -- Potential Revenue (confirmed but not completed yet)
                SUM(CASE WHEN statut IN ('confirmee', 'en_cours') THEN prix_final ELSE 0 END) as revenue_potential,
                COUNT(CASE WHEN statut IN ('confirmee', 'en_cours') THEN 1 END) as bookings_confirmed,
                
                -- Lost Revenue (cancelled or no-show)
                SUM(CASE WHEN statut IN ('annulee', 'no_show') THEN prix_final ELSE 0 END) as revenue_lost,
                COUNT(CASE WHEN statut IN ('annulee', 'no_show') THEN 1 END) as bookings_lost,
                
                -- Manual Conversions (draft to confirmed - admin intervention)
                COUNT(CASE WHEN statut != 'draft' AND reservation_status = 'confirmed' THEN 1 END) as admin_conversions,
                SUM(CASE WHEN statut != 'draft' AND reservation_status = 'confirmed' THEN prix_final ELSE 0 END) as admin_conversion_value,
                
                -- Total Draft Impact (all drafts created)
                (SELECT COUNT(*) FROM reservations 
                 WHERE date_creation >= '${startDateStr}' 
                 AND statut = 'draft') as total_drafts_created,
                
                -- Draft Conversion Rate
                (SELECT COUNT(*) FROM reservations 
                 WHERE date_creation >= '${startDateStr}' 
                 AND statut != 'draft' AND reservation_status IN ('confirmed', 'reserved')) as drafts_converted_to_bookings
                 
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND reservation_status != 'draft'
        `;

        // 2. Admin Intervention Impact Analysis
        const adminInterventionQuery = `
            SELECT 
                -- Reservations manually confirmed by admin
                COUNT(CASE WHEN reservation_status = 'confirmed' AND statut != 'draft' THEN 1 END) as admin_touched_reservations,
                AVG(CASE WHEN reservation_status = 'confirmed' THEN prix_final END) as avg_value_admin_handled,
                
                -- Success rate of confirmed reservations
                COUNT(CASE WHEN reservation_status = 'confirmed' AND statut = 'terminee' THEN 1 END) as admin_successful_completions,
                COUNT(CASE WHEN reservation_status = 'confirmed' AND statut IN ('annulee', 'no_show') THEN 1 END) as admin_failed_conversions,
                
                -- Draft system effectiveness
                (SELECT COUNT(*) FROM reservations 
                 WHERE statut = 'draft' 
                 AND date_creation >= '${startDateStr}') as current_drafts,
                
                (SELECT COUNT(*) FROM reservations r1
                 WHERE r1.date_creation >= '${startDateStr}'
                 AND r1.statut != 'draft' 
                 AND EXISTS (
                     SELECT 1 FROM reservations r2 
                     WHERE r2.client_telephone = r1.client_telephone 
                     AND r2.statut = 'draft' 
                     AND r2.date_creation < r1.date_creation
                 )) as draft_converted_customers,
                
                -- Revenue from confirmed reservations (admin interventions)
                SUM(CASE WHEN reservation_status = 'confirmed' AND statut = 'terminee' THEN prix_final ELSE 0 END) as revenue_rescued_by_admin
                
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
                    AND reservation_status != 'draft'
                )) as percentage_of_total,
                -- Percentage of total potential revenue
                (SUM(prix_final) * 100.0 / (
                    SELECT SUM(prix_final) FROM reservations 
                    WHERE date_reservation >= '${startDateStr}' 
                    AND reservation_status != 'draft'
                )) as percentage_of_revenue
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND reservation_status != 'draft'
            GROUP BY statut
            ORDER BY total_value DESC
        `;

        // 4. Draft System Performance Metrics
        const draftSystemMetricsQuery = `
            SELECT 
                -- Total drafts created (shows lead generation)
                COUNT(*) as total_drafts,
                
                -- Drafts that became confirmed bookings (based on phone number matching)
                SUM(CASE WHEN converted_reservation.id IS NOT NULL THEN 1 ELSE 0 END) as drafts_converted,
                
                -- Average time from draft to conversion
                AVG(CASE WHEN converted_reservation.id IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, draft_res.date_creation, converted_reservation.date_creation) 
                    END) as avg_conversion_time_hours,
                
                -- Total value of converted drafts
                SUM(CASE WHEN converted_reservation.id IS NOT NULL 
                    THEN converted_reservation.prix_final ELSE 0 END) as converted_draft_value,
                
                -- Conversion rate
                (SUM(CASE WHEN converted_reservation.id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as conversion_rate
                
            FROM reservations draft_res
            LEFT JOIN reservations converted_reservation ON (
                draft_res.client_telephone = converted_reservation.client_telephone
                AND converted_reservation.statut != 'draft'
                AND converted_reservation.reservation_status IN ('reserved', 'confirmed')
                AND converted_reservation.date_creation > draft_res.date_creation
                AND converted_reservation.date_creation <= DATE_ADD(draft_res.date_creation, INTERVAL 30 DAY)
            )
            WHERE draft_res.statut = 'draft'
                AND draft_res.date_creation >= '${startDateStr}'
        `;

        // Additional queries for comprehensive analytics
        const peakHoursQuery = `
            SELECT 
                HOUR(STR_TO_DATE(heure_debut, '%H:%i:%s')) as hour,
                COUNT(*) as bookings
            FROM reservations 
            WHERE date_reservation >= '${startDateStr}' 
                AND reservation_status != 'draft'
            GROUP BY HOUR(STR_TO_DATE(heure_debut, '%H:%i:%s'))
            ORDER BY bookings DESC
        `;

        const cancellationStatsQuery = `
            SELECT 
                statut,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations WHERE date_reservation >= '${startDateStr}' AND reservation_status != 'draft')) as percentage
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
                AND statut = 'terminee'
        `;

        const revenueByServiceQuery = `
            SELECT 
                s.nom as service_name,
                cs.nom as category,
                COUNT(r.id) as bookings,
                SUM(r.prix_final) as revenue,
                AVG(r.prix_final) as avg_price
            FROM services s
            LEFT JOIN categories_services cs ON s.categorie_id = cs.id
            LEFT JOIN reservations r ON s.id = r.service_id
            WHERE r.date_reservation >= '${startDateStr}'
                AND r.statut = 'terminee'
            GROUP BY s.id, s.nom, cs.nom
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
                    AND statut = 'terminee'
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
                AND r.reservation_status != 'draft'
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
                AND statut = 'terminee'
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
                AND statut = 'terminee'
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
            revenueAnalysis, adminIntervention, statusBreakdown, draftSystemMetrics,
            peakHours, cancellationStats, avgSpend, revenueByService,
            clientAnalysis, popularServices, revenueTrend, monthlyComparison, clientGrowth
        ] = await Promise.all([
            executeQuery(revenueAnalysisQuery),
            executeQuery(adminInterventionQuery),
            executeQuery(statusBreakdownQuery),
            executeQuery(draftSystemMetricsQuery),
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

                // === ENHANCED FINANCIAL TRACKING ===
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
                    
                    // Admin intervention value
                    adminConversions: revenueAnalysis[0]?.admin_conversions || 0,
                    adminConversionValue: parseFloat(revenueAnalysis[0]?.admin_conversion_value || 0),
                    
                    // Total potential if everything was completed
                    totalPotentialRevenue: parseFloat(
                        (revenueAnalysis[0]?.revenue_completed || 0) + 
                        (revenueAnalysis[0]?.revenue_potential || 0) + 
                        (revenueAnalysis[0]?.revenue_lost || 0)
                    )
                },

                // === ADMIN IMPACT TRACKING ===
                adminImpact: {
                    totalInterventions: adminIntervention[0]?.admin_touched_reservations || 0,
                    avgValueAdminHandled: parseFloat(adminIntervention[0]?.avg_value_admin_handled || 0),
                    successfulCompletions: adminIntervention[0]?.admin_successful_completions || 0,
                    failedConversions: adminIntervention[0]?.admin_failed_conversions || 0,
                    revenueRescuedByAdmin: parseFloat(adminIntervention[0]?.revenue_rescued_by_admin || 0),
                    
                    // Success rate of admin interventions
                    adminSuccessRate: adminIntervention[0]?.admin_touched_reservations > 0 
                        ? ((adminIntervention[0]?.admin_successful_completions || 0) / 
                           adminIntervention[0]?.admin_touched_reservations * 100).toFixed(1)
                        : 0
                },

                // === DRAFT SYSTEM PERFORMANCE ===
                draftSystemPerformance: {
                    totalDraftsCreated: draftSystemMetrics[0]?.total_drafts || 0,
                    draftsConverted: draftSystemMetrics[0]?.drafts_converted || 0,
                    conversionRate: parseFloat(draftSystemMetrics[0]?.conversion_rate || 0),
                    avgConversionTimeHours: parseFloat(draftSystemMetrics[0]?.avg_conversion_time_hours || 0),
                    convertedDraftValue: parseFloat(draftSystemMetrics[0]?.converted_draft_value || 0),
                    currentDrafts: adminIntervention[0]?.current_drafts || 0,
                    
                    // How much revenue was generated from draft leads
                    draftGeneratedRevenue: parseFloat(draftSystemMetrics[0]?.converted_draft_value || 0),
                    
                    // ROI of draft system (assuming minimal cost)
                    draftROI: draftSystemMetrics[0]?.total_drafts > 0 
                        ? (parseFloat(draftSystemMetrics[0]?.converted_draft_value || 0) / draftSystemMetrics[0]?.total_drafts).toFixed(2)
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

// Draft Performance Statistics 
router.get('/draft-performance', authenticateAdmin, async (req, res) => {
    try {
        console.log('🎯 Draft Performance endpoint started');
        
        const draftMetricsQuery = `
            SELECT 
                COUNT(CASE WHEN reservation_status = 'draft' THEN 1 END) as total_drafts_created,
                COUNT(CASE WHEN reservation_status = 'draft' AND statut IN ('confirmee', 'terminee') THEN 1 END) as drafts_converted,
                COUNT(CASE WHEN reservation_status = 'draft' AND statut = 'draft' THEN 1 END) as drafts_pending,
                COUNT(CASE WHEN reservation_status = 'reserved' THEN 1 END) as direct_bookings,
                SUM(CASE WHEN reservation_status = 'draft' AND statut IN ('confirmee', 'terminee') THEN prix_final ELSE 0 END) as revenue_from_conversions,
                SUM(CASE WHEN reservation_status = 'reserved' THEN prix_final ELSE 0 END) as revenue_from_direct
            FROM reservations
        `;
        
        console.log('📊 About to execute query');
        const result = await executeQuery(draftMetricsQuery);
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
        
        console.log('💰 DRAFT METRICS DATA:', data);

        res.json({
            success: true,
            data: {
                overview: {
                    totalDraftsCreated: data.total_drafts_created,
                    draftsConverted: data.drafts_converted,
                    draftsPending: data.drafts_pending,
                    directBookings: data.direct_bookings,
                    conversionRate: conversionRate.toFixed(1),
                    revenueFromConversions: data.revenue_from_conversions || 0,
                    revenueFromDirect: data.revenue_from_direct || 0,
                    avgConvertedValue: data.drafts_converted > 0 ? (data.revenue_from_conversions / data.drafts_converted) : 0,
                    avgDirectValue: data.direct_bookings > 0 ? (data.revenue_from_direct / data.direct_bookings) : 0
                },
                statusBreakdown: [],
                trends: []
            }
        });

    } catch (error) {
        console.error('❌ Draft Performance Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du chargement de la performance des brouillons',
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
                AND reservation_status != 'draft'
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
