const { executeQuery } = require('./config/database');

async function debugReservationUpdate() {
    try {
        console.log('=== DEBUGGING RESERVATION UPDATE ===');
        
        // Check the draft reservation details
        const draftReservations = await executeQuery('SELECT * FROM reservations WHERE statut = "draft"');
        console.log('\n📋 Draft reservations:');
        draftReservations.forEach(res => {
            console.log(`ID: ${res.id}, Service ID: ${res.service_id}, Prix Final: ${res.prix_final}, Prix Service: ${res.prix_service}`);
        });
        
        // Check service prices
        console.log('\n💰 Service prices:');
        const services = await executeQuery('SELECT id, nom, prix FROM services');
        services.forEach(service => {
            console.log(`Service ID: ${service.id}, Name: ${service.nom}, Price: ${service.prix}`);
        });
        
        // Check a specific reservation if exists
        if (draftReservations.length > 0) {
            const testReservation = draftReservations[0];
            console.log(`\n🔍 Testing with reservation ID: ${testReservation.id}`);
            
            // Get service details for this reservation
            const serviceDetails = await executeQuery('SELECT * FROM services WHERE id = ?', [testReservation.service_id]);
            console.log('Service details:', serviceDetails[0]);
            
            // Test the update logic manually
            if (serviceDetails.length > 0) {
                const servicePrice = serviceDetails[0].prix;
                console.log(`\n📝 Would update prix_service to: ${servicePrice} and prix_final to: ${servicePrice}`);
                
                // Let's simulate the update without actually doing it
                console.log('SQL that would be executed:');
                console.log(`UPDATE reservations SET statut = 'confirmee', prix_service = ${servicePrice}, prix_final = ${servicePrice} WHERE id = ${testReservation.id}`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

debugReservationUpdate();
