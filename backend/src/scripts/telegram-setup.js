#!/usr/bin/env node

/**
 * ZenShe Spa - Telegram Bot Setup Helper
 * This script helps you configure your Telegram bot integration
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('🤖 Waad - Configuration du Bot Telegram\n');

const envPath = path.join(__dirname, '../../.env');

// Read current .env file
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
    console.error('❌ Erreur: Impossible de lire le fichier .env');
    process.exit(1);
}

// Function to update .env file
function updateEnvFile(botToken, chatId) {
    const lines = envContent.split('\n');
    let updated = false;
    
    // Update existing lines or add new ones
    const newLines = lines.map(line => {
        if (line.startsWith('TELEGRAM_BOT_TOKEN=')) {
            updated = true;
            return `TELEGRAM_BOT_TOKEN=${botToken}`;
        } else if (line.startsWith('TELEGRAM_CHAT_ID=')) {
            return `TELEGRAM_CHAT_ID=${chatId}`;
        }
        return line;
    });
    
    // If TELEGRAM_BOT_TOKEN wasn't found, add it
    if (!updated) {
        newLines.push('');
        newLines.push('# Configuration Telegram Bot');
        newLines.push(`TELEGRAM_BOT_TOKEN=${botToken}`);
        newLines.push(`TELEGRAM_CHAT_ID=${chatId}`);
    }
    
    fs.writeFileSync(envPath, newLines.join('\n'));
}

// Function to test bot token
async function testBotToken(token) {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        return response.data.ok ? response.data.result : null;
    } catch (error) {
        return null;
    }
}

// Function to get chat info
async function getChatInfo(token, chatId) {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${token}/getChat`, {
            params: { chat_id: chatId }
        });
        return response.data.ok ? response.data.result : null;
    } catch (error) {
        return null;
    }
}

// Main setup function
async function setup() {
    console.log('📋 Instructions de configuration:\n');
    
    console.log('1. Créez un bot Telegram:');
    console.log('   - Ouvrez Telegram et cherchez @BotFather');
    console.log('   - Envoyez /newbot et suivez les instructions');
    console.log('   - Copiez le token que BotFather vous donne\n');
    
    console.log('2. Obtenez votre Chat ID:');
    console.log('   - Ajoutez votre bot à un groupe ou démarrez une conversation');
    console.log('   - Envoyez un message au bot');
    console.log('   - Visitez: https://api.telegram.org/botVOTRE_TOKEN/getUpdates');
    console.log('   - Trouvez "chat":{"id": VOTRE_CHAT_ID}\n');
    
    console.log('3. Configurez votre .env:\n');
    
    if (process.argv.length >= 4) {
        const botToken = process.argv[2];
        const chatId = process.argv[3];
        
        console.log('🔍 Test du token du bot...');
        const botInfo = await testBotToken(botToken);
        
        if (botInfo) {
            console.log(`✅ Bot trouvé: ${botInfo.first_name} (@${botInfo.username})`);
            
            console.log('🔍 Test du Chat ID...');
            const chatInfo = await getChatInfo(botToken, chatId);
            
            if (chatInfo) {
                console.log(`✅ Chat trouvé: ${chatInfo.title || chatInfo.first_name || 'Chat privé'}`);
                
                // Update .env file
                updateEnvFile(botToken, chatId);
                console.log('✅ Fichier .env mis à jour avec succès!\n');
                
                console.log('🚀 Configuration terminée! Redémarrez votre serveur backend.\n');
                console.log('💡 Pour tester la connexion, utilisez:');
                console.log('   POST /api/admin/telegram/test\n');
                
            } else {
                console.log('❌ Chat ID invalide ou bot non autorisé dans ce chat');
            }
        } else {
            console.log('❌ Token de bot invalide');
        }
    } else {
        console.log('Usage: node telegram-setup.js VOTRE_BOT_TOKEN VOTRE_CHAT_ID\n');
        console.log('Exemple:');
        console.log('node telegram-setup.js "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ" "-1001234567890"\n');
    }
}

setup().catch(console.error);
