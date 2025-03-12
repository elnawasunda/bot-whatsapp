const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')  
const qrcode = require('qrcode-terminal')  
const { Boom } = require('@hapi/boom')  
async function startBot() {  
const { state, saveCreds } = await useMultiFileAuthState('auth_info')  
const sock = makeWASocket({  
auth: state,  
printQRInTerminal: true  
})  
sock.ev.on('creds.update', saveCreds)  
sock.ev.on('connection.update', (update) = 
const { connection, lastDisconnect } = update  
if (connection === 'close') {  
const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut  
console.log('Koneksi terputus, nyoba nyambung lagi:', shouldReconnect)  
if (shouldReconnect) startBot()  
} else if (connection === 'open') {  
console.log('Bot lu udah nyambung, cuy!')  
}  
})  
sock.ev.on('messages.upsert', async (m) = 
const msg = m.messages[0]  
if (!msg.message) return  
const from = msg.key.remoteJid  
