const mysql = require('mysql2');
require('dotenv').config();

// Use the same configuration logic as the main app
const primaryDbConfig = {
    host: process.env.DB_HOST || 'fdb1032.awardspace.net',
    user: process.env.DB_USER || '4675996_waadnails',
    password: process.env.DB_PASSWORD || 'yf5040y12',
    database: process.env.DB_NAME || '4675996_waadnails',
    port: parseInt(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    connectTimeout: 30000,
    ssl: false
};

const fallbackDbConfig = {
    host: process.env.DB_HOST_LOCAL || 'localhost',
    user: process.env.DB_USER_LOCAL || 'root',
    password: process.env.DB_PASSWORD_LOCAL || '',
    database: process.env.DB_NAME_LOCAL || 'nails_waad',
    port: parseInt(process.env.DB_PORT_LOCAL) || 4306,
    charset: 'utf8mb4',
    connectTimeout: 10000,
};

// NBrow Studio services (5 French services as specified) with explicit IDs
const nbrownServices = [
    {
        id: 1,
        nom: 'Microblading',
        description: 'Technique de maquillage semi-permanent pour redessiner et densifier les sourcils de façon naturelle.',
        description_detaillee: 'Le microblading est une technique de dermopigmentation qui consiste à implanter des pigments dans le derme à l\'aide de micro-aiguilles pour créer un effet poil par poil ultra-réaliste.',
        prix: 200.00,
        duree: 120,
        image_url: 'microblading.jpg',
        service_type: 'base',
        populaire: 1,
        ordre_affichage: 1,
        inclus: 'Consultation, désinfection, anesthésie locale, microblading, conseils post-soin',
        conseils_apres_soin: 'Éviter l\'eau et les cosmétiques pendant 7 jours. Appliquer la crème cicatrisante fournie.'
    },
    {
        id: 2,
        nom: 'Microshading',
        description: 'Technique de maquillage semi-permanent créant un effet ombré et poudrée pour des sourcils parfaits.',
        description_detaillee: 'Le microshading, aussi appelé powder brows, crée un effet ombré et poudrée grâce à une technique de pointillisme qui donne un rendu maquillé très naturel.',
        prix: 220.00,
        duree: 120,
        image_url: 'microshading.jpg',
        service_type: 'base',
        populaire: 1,
        ordre_affichage: 2,
        inclus: 'Consultation, désinfection, anesthésie locale, microshading, conseils post-soin',
        conseils_apres_soin: 'Éviter l\'eau et les cosmétiques pendant 7 jours. Appliquer la crème cicatrisante fournie.'
    },
    {
        id: 3,
        nom: 'Restructuration Sourcils',
        description: 'Épilation et restructuration complète de la forme de vos sourcils pour sublimer votre regard.',
        description_detaillee: 'Service d\'épilation et de restructuration des sourcils avec étude morphologique du visage pour déterminer la forme parfaite qui sublimera votre regard.',
        prix: 35.00,
        duree: 45,
        image_url: 'eyebrows.jpg',
        service_type: 'base',
        ordre_affichage: 3,
        inclus: 'Analyse morphologique, épilation, restructuration, finition'
    },
    {
        id: 4,
        nom: 'Retouche Beauté',
        description: 'Entretien et retouches des sourcils pour maintenir la forme parfaite entre les séances.',
        description_detaillee: 'Service d\'entretien pour maintenir la forme et l\'épaisseur de vos sourcils entre les séances principales.',
        prix: 25.00,
        duree: 30,
        image_url: 'beauty_touch.jpg',
        service_type: 'base',
        ordre_affichage: 4,
        inclus: 'Épilation, restructuration légère, finition'
    },
    {
        id: 5,
        nom: 'Soin Semi-permanent Complet',
        description: 'Service complet incluant microblading/microshading avec retouche et soin post-traitement.',
        description_detaillee: 'Formule complète comprenant la première séance de microblading ou microshading, la retouche à 4-6 semaines et tous les soins post-traitement.',
        prix: 350.00,
        duree: 180,
        image_url: 'semi_permanent.jpg',
        service_type: 'package',
        populaire: 1,
        nouveau: 1,
        ordre_affichage: 5,
        nombre_sessions: 2,
        prix_par_session: 175.00,
        validite_jours: 90,
        inclus: 'Première séance + retouche, tous les soins, suivi personnalisé',
        conseils_apres_soin: 'Suivi détaillé fourni avec calendrier de cicatrisation et rendez-vous de contrôle.'
    }
];

async function tryConnection(config, configName) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(config);
        
        connection.connect((err) => {
            if (err) {
                console.log(`❌ ${configName} connection failed:`, err.message);
                connection.end();
                reject(err);
            } else {
                console.log(`✅ ${configName} connection successful`);
                resolve(connection);
            }
        });
    });
}

async function updateServices() {
    let connection = null;
    
    try {
        // Try primary config first, then fallback
        try {
            connection = await tryConnection(primaryDbConfig, 'Primary');
        } catch (err) {
            console.log('Trying fallback configuration...');
            connection = await tryConnection(fallbackDbConfig, 'Fallback');
        }

        console.log('\n🔄 Updating services to NBrow Studio eyebrow services...');
        
        // Clear existing reservations first (to handle foreign key constraint)
        await new Promise((resolve, reject) => {
            connection.query('DELETE FROM reservations', (err, result) => {
                if (err) reject(err);
                else {
                    console.log(`🗑️  Cleared ${result.affectedRows} existing reservations`);
                    resolve();
                }
            });
        });
        
        // Clear existing services
        await new Promise((resolve, reject) => {
            connection.query('DELETE FROM services', (err, result) => {
                if (err) reject(err);
                else {
                    console.log(`🗑️  Cleared ${result.affectedRows} existing services`);
                    resolve();
                }
            });
        });

        // Insert new NBrow Studio services with explicit IDs
        for (const service of nbrownServices) {
            await new Promise((resolve, reject) => {
                connection.query(
                    `INSERT INTO services (
                        id, nom, description, description_detaillee, prix, duree, image_url, 
                        service_type, populaire, nouveau, ordre_affichage, nombre_sessions, 
                        prix_par_session, validite_jours, inclus, conseils_apres_soin, 
                        actif, date_creation
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
                    [
                        service.id,
                        service.nom, 
                        service.description, 
                        service.description_detaillee || null,
                        service.prix, 
                        service.duree, 
                        service.image_url,
                        service.service_type || 'base',
                        service.populaire || 0,
                        service.nouveau || 0,
                        service.ordre_affichage || 0,
                        service.nombre_sessions || null,
                        service.prix_par_session || null,
                        service.validite_jours || null,
                        service.inclus || null,
                        service.conseils_apres_soin || null
                    ],
                    (err, result) => {
                        if (err) reject(err);
                        else {
                            console.log(`➕ Added service: ${service.nom} (${service.prix}€)`);
                            resolve();
                        }
                    }
                );
            });
        }

        console.log('\n✅ Successfully updated services to NBrow Studio eyebrow services!');
        console.log('📊 Service Summary:');
        console.log('   • 2 Semi-permanent services (Microblading, Microshading)');
        console.log('   • 2 Regular eyebrow services (Restructuration, Retouche)');
        console.log('   • 1 Complete package service');
        
    } catch (error) {
        console.error('❌ Error updating services:', error);
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

updateServices();