const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true, // QR Code muncul di terminal
    });

    // Simpan ulang kredensial setiap ada update
    sock.ev.on("creds.update", saveCreds);

    // Cek koneksi bot
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("Koneksi terputus, mencoba menghubungkan ulang...");
                startBot();
            } else {
                console.log("Bot logout, scan ulang QR Code.");
            }
        } else if (connection === "open") {
            console.log("✅ Nawasunda Bot nyala cuy!");
        }
    });

    // Respon ketika ada member baru masuk grup
    sock.ev.on("group-participants.update", async (update) => {
        const { id, participants, action } = update;
        if (action === "add") {
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
🚀 *Enjoy & Have Fun!* 🚀
`;
                await sock.sendMessage(id, { text: introMessage });
            }
        }
    });

    // Respon otomatis untuk pesan masuk
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.fromMe && msg.message) {
            const sender = msg.key.remoteJid;
            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text;

            console.log(`📩 Pesan masuk dari ${sender}: ${text}`);

            if (text === "!menu") {
                await sock.sendMessage(sender, {
                    text: `👋 *Welcome to Nawasunda Bot!*

📌 *Menu Nawasunda Bot:*
1. !sunda - Quotes Bahasa Sunda
2. !info - Info Bot
3. !ping - Cek Respon Bot

🚀 *Coba salah satu perintah di atas!*`,
                });
            } else if (text === "!sunda") {
                await sock.sendMessage(sender, {
                    text: `"Tong hilap ka lembur!" - Jangan lupa asal usulmu.`,
                });
            } else if (text === "!ping") {
                await sock.sendMessage(sender, {
                    text: "🏓 Pong! Bot aktif cuy.",
                });
            } else if (text === "!info") {
                await sock.sendMessage(sender, {
                    text: `📊 *Nawasunda Bot Info:*
- Dibuat pake Baileys Library
- Bisa kirim pesan otomatis
- Support grup & chat pribadi

🌐 Dibuat dengan cinta di Sunda`,
                });
            }
        }
    });
};

startBot();
