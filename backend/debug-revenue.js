const { executeQuery } = require('./config/database');

async function checkRevenue() {
  try {
    console.log('=== CHECKING REVENUE CALCULATION ===');
    
    // Check all terminee reservations
    const termineeReservations = await executeQuery(`
      SELECT id, client_telephone, service_id, prix_final, statut, reservation_status, date_reservation, date_creation
      FROM reservations 
      WHERE statut = 'terminee'
      ORDER BY date_creation DESC
    `);
    console.log('All terminee reservations:', termineeReservations);
    
    // Check confirmee reservations (ones that might need to be terminee)
    const confirmeeReservations = await executeQuery(`
      SELECT id, client_telephone, service_id, prix_final, statut, reservation_status, date_reservation, date_creation
      FROM reservations 
      WHERE statut = 'confirmee'
      ORDER BY date_creation DESC
    `);
    console.log('All confirmee reservations:', confirmeeReservations);
    
    // Check if there's a reservation with actual revenue that should be terminee
    const revenueReservations = await executeQuery(`
      SELECT id, client_telephone, service_id, prix_final, statut, reservation_status, date_reservation, date_creation
      FROM reservations 
      WHERE prix_final > 0
      ORDER BY date_creation DESC
    `);
    console.log('Reservations with actual revenue:', revenueReservations);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkRevenue();
