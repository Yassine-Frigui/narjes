const mysql = require('mysql2');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const { hashPassword } = require('../src/middleware/auth');

async function initializeDatabase() {
    let connection;
    
    try {
        console.log('🌸 Initialisation de la base de données du salon d\'ongles...\n');
        
        // Connexion à MySQL sans spécifier de base de données
        connection = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 4306
        });
        
        console.log('✅ Connexion à MySQL réussie');
        
        // Créer la base de données si elle n'existe pas
        await new Promise((resolve, reject) => {
            connection.query(`CREATE DATABASE IF NOT EXISTS zenshe_spa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });
        console.log('✅ Base de données zenshe_spa créée ou vérifiée');
        
        // Se connecter à la base de données
        await new Promise((resolve, reject) => {
            connection.query('USE zenshe_spa', (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });
        
        // Lire et exécuter le fichier SQL
        const schemaPath = path.join(__dirname, 'new_consolidated_database.sql');
        let schema;
        
        try {
            schema = await fs.readFile(schemaPath, 'utf8');
        } catch (error) {
            console.error('❌ Erreur lors de la lecture du fichier SQL:', error.message);
            console.log('📄 Utilisation du schéma de base...');
            
            // Fallback to complete_schema.sql if new file doesn't exist
            const fallbackSchemaPath = path.join(__dirname, 'complete_schema.sql');
            schema = await fs.readFile(fallbackSchemaPath, 'utf8');
        }
        
        console.log('📄 Exécution du script de création de la base de données...');
        
        // Nettoyer le script SQL - enlever les lignes CREATE DATABASE et USE
        const cleanedSchema = schema
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return !trimmed.startsWith('CREATE DATABASE') && 
                       !trimmed.startsWith('USE zenshe_spa') &&
                       trimmed.length > 0;
            })
            .join('\n');
        
        // Diviser en statements individuels pour éviter le problème de prepared statements
        const statements = cleanedSchema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        // Exécuter chaque statement individuellement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                try {
                    await new Promise((resolve, reject) => {
                        connection.query(statement, (error, results) => {
                            if (error) {
                                // Ignorer les erreurs de tables déjà existantes
                                if (error.message.includes('already exists')) {
                                    console.log(`⚠️  Table déjà existante (ignoré)`);
                                    resolve(results);
                                } else {
                                    reject(error);
                                }
                            } else {
                                resolve(results);
                            }
                        });
                    });
                    
                    // Afficher le progrès pour les tables importantes
                    if (statement.toLowerCase().includes('create table')) {
                        const tableName = statement.match(/CREATE TABLE\s+(\w+)/i);
                        if (tableName) {
                            console.log(`   ✓ Table ${tableName[1]} créée`);
                        }
                    }
                } catch (error) {
                    console.log(`❌ Erreur avec statement: ${statement.substring(0, 50)}...`);
                    throw error;
                }
            }
        }
        console.log('✅ Tables créées avec succès');
        
        // Créer un administrateur par défaut avec un mot de passe hashé
        console.log('👤 Création de l\'administrateur par défaut...');
        
        const defaultPassword = 'admin123456';
        const hashedPassword = await hashPassword(defaultPassword);
        
        // Supprimer l'ancien admin s'il existe et en créer un nouveau
        await new Promise((resolve, reject) => {
            connection.query('DELETE FROM administrateurs WHERE email = ?', ['admin@salon-ongles.fr'], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });
        
        await new Promise((resolve, reject) => {
            connection.query(`
                INSERT INTO administrateurs (nom, prenom, email, mot_de_passe, role, telephone) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['Admin', 'Super', 'admin@salon-ongles.fr', hashedPassword, 'super_admin', '+33 1 23 45 67 89'], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });
        
        console.log('✅ Administrateur créé:');
        console.log('   📧 Email: admin@salon-ongles.fr');
        console.log('   🔑 Mot de passe: admin123456');
        console.log('   ⚠️  Changez ce mot de passe dès la première connexion!\n');
        
        // Vérification finale
        await new Promise((resolve, reject) => {
            connection.query('SHOW TABLES', (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`✅ ${results.length} tables créées avec succès:`);
                    results.forEach(table => {
                        console.log(`   - ${Object.values(table)[0]}`);
                    });
                    resolve(results);
                }
            });
        });
        
        console.log('\n🎉 Initialisation terminée avec succès!');
        console.log('🚀 Vous pouvez maintenant démarrer le serveur avec: npm run dev');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Vérifiez vos identifiants MySQL dans le fichier .env');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Vérifiez que MySQL est démarré sur votre machine');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

// Exécuter l'initialisation si ce fichier est appelé directement
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
