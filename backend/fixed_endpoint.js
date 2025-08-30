// FIXED Draft Performance Endpoint
router.get('/draft-performance', authenticateAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(CASE WHEN reservation_status = 'draft' THEN 1 END) as total_drafts_created,
                COUNT(CASE WHEN reservation_status = 'draft' AND statut IN ('confirmee', 'terminee') THEN 1 END) as drafts_converted,
                COUNT(CASE WHEN reservation_status = 'draft' AND statut = 'draft' THEN 1 END) as drafts_pending,
                COUNT(CASE WHEN reservation_status = 'reserved' THEN 1 END) as direct_bookings,
                SUM(CASE WHEN reservation_status = 'draft' AND statut IN ('confirmee', 'terminee') THEN prix_final ELSE 0 END) as revenue_from_conversions,
                SUM(CASE WHEN reservation_status = 'reserved' THEN prix_final ELSE 0 END) as revenue_from_direct
            FROM reservations
        `;

        const [result] = await executeQuery(query);
        const conversionRate = result[0].total_drafts_created > 0 ? 
            (result[0].drafts_converted / result[0].total_drafts_created * 100) : 0;

        res.json({
            success: true,
            data: {
                overview: {
                    totalDraftsCreated: result[0].total_drafts_created,
                    draftsConverted: result[0].drafts_converted,
                    draftsPending: result[0].drafts_pending,
                    directBookings: result[0].direct_bookings,
                    conversionRate: conversionRate.toFixed(1),
                    revenueFromConversions: result[0].revenue_from_conversions || 0,
                    revenueFromDirect: result[0].revenue_from_direct || 0,
                    avgConvertedValue: result[0].drafts_converted > 0 ? (result[0].revenue_from_conversions / result[0].drafts_converted) : 0,
                    avgDirectValue: result[0].direct_bookings > 0 ? (result[0].revenue_from_direct / result[0].direct_bookings) : 0
                }
            }
        });
    } catch (error) {
        console.error('Draft Performance Error:', error);
        res.status(500).json({ success: false, message: 'Error loading draft statistics' });
    }
});
