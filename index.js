/**
 * Basma WhatsApp Bot — Entry Point
 * Auto-starts localtunnel so Meta can reach localhost for webhooks.
 */

require("dotenv").config();

const path = require("path");
const express = require("express");
const config = require("./config");
const { checkConfig } = require("./services/whatsappApi");
const apiRoutes = require("./routes/api");
const webhookRoutes = require("./routes/webhook");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/webhook", webhookRoutes);
app.use("/api", apiRoutes);
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.use((err, req, res, next) => res.status(500).json({ success: false, error: "Internal error." }));

// ── Start server, then open tunnel ───────────────────────────────────────────
async function main() {
    // 1. Start Express
    await new Promise((resolve) => {
        app.listen(config.server.port, resolve);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🤖  ${config.bot.name}`);
    console.log(`🚀  Local:     http://localhost:${config.server.port}`);
    console.log(`🔑  Dashboard: http://localhost:${config.server.port}`);

    if (!checkConfig()) {
        console.warn("\n⚠️  WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing in .env");
    } else {
        console.log("✅  WhatsApp API credentials loaded.");
    }

    // 2. Open localtunnel → public HTTPS URL
    console.log("\n⏳  Opening public tunnel...");
    try {
        const localtunnel = require("localtunnel");
        const tunnel = await localtunnel({ port: config.server.port });

        const webhookUrl = `${tunnel.url}/webhook`;

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🌐  PUBLIC TUNNEL ACTIVE");
        console.log(`📡  Webhook URL: ${webhookUrl}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("\n📋  NEXT STEP — Set this in Meta Developer Console:");
        console.log("    1. Go to: developers.facebook.com → Your App");
        console.log("    2. WhatsApp → Configuration → Webhooks → Edit");
        console.log(`    3. Callback URL: ${webhookUrl}`);
        console.log(`    4. Verify Token: ${config.whatsapp.webhookVerifyToken}`);
        console.log("    5. Click Verify & Save → Subscribe to 'messages'");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // Update dashboard with live tunnel URL
        process.env.TUNNEL_URL = tunnel.url;

        tunnel.on("close", () => {
            console.log("\n⚠️  Tunnel closed. Restart the bot to get a new URL.");
        });

        tunnel.on("error", (err) => {
            console.error("⚠️  Tunnel error:", err.message);
        });

    } catch (err) {
        console.warn("\n⚠️  Could not open tunnel:", err.message);
        console.warn("    Set webhook URL manually in Meta Developer Console.");
        console.warn(`    URL format: https://YOUR_SERVER:${config.server.port}/webhook\n`);
    }
}

main().catch((err) => {
    console.error("💥  Fatal startup error:", err);
    process.exit(1);
});

process.on("SIGINT", () => { console.log("\n👋  Shutting down."); process.exit(0); });
process.on("uncaughtException", (e) => console.error("💥", e));
process.on("unhandledRejection", (r) => console.error("💥", r));
