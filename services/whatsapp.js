/**
 * WhatsApp Connection Service (atexovi-baileys)
 * Upgraded from @whiskeysockets/baileys to atexovi-baileys for interactive button support.
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("atexovi-baileys");
const fs = require("fs");
const path = require("path");
const qrcode_terminal = require("qrcode-terminal");
const qrcode = require("qrcode");

const { handleIncomingMessage } = require("../handlers/messages");
const { getSession, resetSession } = require("../services/session");

let sockStatus = "disconnected";
let activeSocket = null;
let currentQRData = null;

async function startBot() {
    console.log("🤖 Starting Basma Bot (atexovi-baileys)...");

    const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL;
    const SESSION_DIR = isVercel
        ? path.join(require("os").tmpdir(), "basma-session")
        : path.join(__dirname, "..", "sessions");

    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📦 atexovi-baileys version: ${version.join(".")} (Latest: ${isLatest})`);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS("Desktop"),
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    activeSocket = sock;

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📱 Scan the QR code below with your WhatsApp app:");
            qrcode_terminal.generate(qr, { small: true });
            qrcode.toDataURL(qr).then((url) => {
                currentQRData = url;
            }).catch(console.error);
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            console.log(`\n🔄 Connection closed (code: ${reason})`);
            if (shouldReconnect) {
                setTimeout(startBot, 3000);
            } else {
                console.log("❌ Logged out. Clear sessions/ folder to re-scan.");
                fs.rmSync(SESSION_DIR, { recursive: true, force: true });
                process.exit(0);
            }
        } else if (connection === "open") {
            sockStatus = "connected";
            currentQRData = null;
            console.log("\n✅ Basma Bot is online and ready!");
            console.log(`📱 Number connected: ${sock.user.id.split(":")[0]}\n`);
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe || msg.key.remoteJid === "status@broadcast") continue;

            try {
                await handleIncomingMessage(sock, msg);
            } catch (err) {
                console.error("❌ Message handling error:", err);
            }
        }
    });

    return sock;
}

function getSocket() { return activeSocket; }
function getSockStatus() { return sockStatus; }

module.exports = { startBot, getSocket, getSockStatus, getQRData: () => currentQRData };
