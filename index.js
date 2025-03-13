const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");
const fs = require("fs");

const ownerNumber = "6285183067309@s.whatsapp.net";
const adminNumber = "6281266848453@s.whatsapp.net";

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // ✅ QR muncul di terminal
  });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      console.log("❌ Koneksi terputus, mencoba ulang...");
      start();
    } else if (connection === "open") {
      console.log("✅ Bot berhasil terkoneksi!");
    }
  });

  function isProtectedUser(sender) {
    return sender === ownerNumber || sender === adminNumber;
  }

  // ✅ Welcome Message (Intro Otomatis) - FIXED
  sock.ev.on("group-participants.update", async (update) => {
    if (update.action === "add") {
      for (const participant of update.participants) {
        try {
          const welcomeMessage = `
┏━━━━━━━━━━━━ ✦❘༻༺❘✦ ━━━━━━━━━━━━┓
           𓆩⟡𓆪  ＮＷＳＮＤＡ  𓆩⟡𓆪
           ✨ 𝙊𝙛𝙛𝙞𝙘𝙞𝙖𝙡 𝙂𝙧𝙤𝙪𝙥 ✨
┗━━━━━━━━━━━━ ✦❘༻༺❘✦ ━━━━━━━━━━━━┛

📢 𝙎𝙀𝙇𝘼𝙈𝘼𝙏 𝘿𝘼𝙏𝘼𝙉𝙂! 📢
✨ Perkenalan dulu dong, bro/sis! ✨

┏━━〔 🚀 FORMAT INTRO 〕━━┓
┣ 🎉 Nama   :
┣ 🎂 Umur   :
┣ 📍 Askot  :
┣ 🎨 Hobi   :
┣ 💌 Status :
┗━━━━━━━━━━━━━━━━━━━━┛

🔥 Sebelum mulai chat, baca dulu aturan grup! 🔥

┏━━━ 〔 𝙉𝙊𝙏𝙀 📝 〕━━━┓
💠 Dilarang spam & toxic
💠 Baca deskripsi sebelum chat
💠 Hormati sesama member & admin
┗━━━━━━━━━━━━━━━━━━━━┛

✨ Selamat bergabung di grup ini! ✨
🚀 Enjoy & Have Fun! 🚀`;
          await sock.sendMessage(update.id, { text: welcomeMessage });
        } catch (err) {
          console.error("❌ Gagal kirim pesan welcome:", err);
        }
      }
    }
  });

  const userMessages = {};
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const chat = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!text) return;

    if (/https?:\/\//.test(text) && !isProtectedUser(sender)) {
      await sock.sendMessage(chat, {
        text: "🚫 Link terdeteksi! Pesan akan dihapus.",
      });
      await sock.deleteMessage(chat, msg.key);
    }

    if (!userMessages[sender]) userMessages[sender] = { count: 0, timer: null };
    userMessages[sender].count++;

    if (userMessages[sender].count > 5) {
      await sock.sendMessage(chat, {
        text: "⚠️ Kamu mengirim pesan terlalu cepat!",
      });
      return;
    }

    if (!userMessages[sender].timer) {
      userMessages[sender].timer = setTimeout(() => {
        userMessages[sender].count = 0;
        userMessages[sender].timer = null;
      }, 5000);
    }

    if (text.length > 5000) {
      await sock.sendMessage(chat, {
        text: "🚨 Pesan terlalu panjang! Pesan akan dihapus.",
      });
      await sock.deleteMessage(chat, msg.key);
    }

    if (!text.startsWith(".")) return;

    const command = text.slice(1).split(" ")[0];
    const args = text.trim().split(" ").slice(1);

    if (command === "menu") {
      const menu = `📜 *MENU UTAMA* 📜

🔹 .download - Menu Download
🔹 .grup - Menu Grup
🔹 .info - Informasi & Berita
🔹 .owner - Owner Commands`;
      await sock.sendMessage(chat, { text: menu });
    }

    if (command === "owner") {
      await sock.sendMessage(chat, {
        text: `👑 Owner: @${ownerNumber.split("@")[0]}`,
        mentions: [ownerNumber],
      });
    }

    if (command === "kick" && sender === ownerNumber) {
      const mentioned =
        msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (!mentioned) {
        return await sock.sendMessage(chat, {
          text: "Tag user yang mau di-kick!",
        });
      }
      await sock.groupParticipantsUpdate(chat, mentioned, "remove");
      await sock.sendMessage(chat, { text: "User berhasil di-kick!" });
    }

    if (command === "add" && sender === ownerNumber) {
      const addNumber = args[0] + "@s.whatsapp.net";
      await sock.groupParticipantsUpdate(chat, [addNumber], "add");
      await sock.sendMessage(chat, { text: "User berhasil ditambahkan!" });
    }

    if (command === "ping") {
      await sock.sendMessage(chat, { text: "Pong! Bot aktif." });
    }

    if (command === "h" && sender === ownerNumber) {
      const message = args.join(" ");
      const groups = await sock.groupFetchAllParticipating();
      for (const group of Object.values(groups)) {
        await sock.sendMessage(group.id, { text: message });
      }
      await sock.sendMessage(chat, { text: "Broadcast selesai dikirim!" });
    }

    if (command === "restart" && sender === ownerNumber) {
      await sock.sendMessage(chat, { text: "Bot sedang di-restart..." });
      process.exit(0);
    }
  });
}

start();
