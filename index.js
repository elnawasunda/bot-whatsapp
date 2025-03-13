 
// index.js
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log('Koneksi terputus, keluar dari sesi.');
            }
        } else if (connection === 'open') {
            console.log('Bot nyala cuy!');
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;

        if (action === 'add') {
            for (const participant of participants) {
                const introMessage = `
┏━━━━━━━━━━━━ ✦❘༻༺❘✦ ━━━━━━━━━━━━┓  
         𓆩⟡𓆪  ＮＷＳＮＤＡ  𓆩⟡𓆪  
          ✨ 𝙊𝙛𝙛𝙞𝙘𝙞𝙖𝙡 𝙂𝙧𝙤𝙪𝙥 ✨  
┗━━━━━━━━━━━━ ✦❘༻༺❘✦ ━━━━━━━━━━━━┛  

📢 *𝙎𝙀𝙇𝘼𝙈𝘼𝙏 𝘿𝘼𝙏𝘼𝙉𝙂!* 📢  
✨ *Perkenalan dulu dong, bro/sis!* ✨  

┏━━〔 🚀 *FORMAT INTRO* 〕━━┓  
┣ 🎉 *Nama*   :  
┣ 🎂 *Umur*   :  
┣ 📍 *Askot*  :  
┣ 🎨 *Hobi*   :  
┣ 💌 *Status* :  
┗━━━━━━━━━━━━━━━━━━━━┛  

🔥 *Sebelum mulai chat, baca dulu aturan grup!* 🔥    

┏━━━ 〔 𝙉𝙊𝙏𝙀 📝 〕━━━┓    
💠 *Dilarang spam & toxic*    
💠 *Baca deskripsi sebelum chat*    
💠 *Hormat sesama member & admin*    
┗━━━━━━━━━━━━━━━━┛    

✨ *Selamat bergabung di ℂ𝔸ℝ𝕀 𝕂𝔸𝕎𝔸ℕ 𝔸𝕁𝔸 𝕀ℕ𝕀 𝕄𝔸ℍ🙆ᕙ⁠(⁠⇀⁠‸⁠↼⁠‶⁠)⁠ᕗ!* ✨    
🚀 *Enjoy & Have Fun!* 🚀`;

                await sock.sendMessage(id, { text: introMessage });
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.fromMe && msg.message) {
            const sender = msg.key.remoteJid;
            console.log(`Pesan masuk dari: ${sender}`);
            await sock.sendMessage(sender, { text: 'Halo! Ini bot intro cuy.' });
        }
    });
};

startBot();
