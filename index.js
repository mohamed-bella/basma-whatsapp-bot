/**
 * WhatsApp Bot — Entry Point (Baileys WhatsApp Web version)
 * Dynamically loads the use case configured in .env
 */

require("dotenv").config();

const path = require("path");
const express = require("express");
const config = require("./config");
const { startBot } = require("./services/whatsapp");
const apiRoutes = require("./routes/api");

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
app.use("/api", apiRoutes);

// Simple status page
app.get("/", (req, res) => {
    res.json({
        bot: config.bot.name,
        useCase: config.useCase.name,
        status: "running",
        api: "/api/health",
    });
});

app.use((err, req, res, next) => res.status(500).json({ success: false, error: "Internal error." }));

async function main() {
    await startBot();

    await new Promise((resolve) => {
        app.listen(config.server.port, resolve);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🤖  ${config.bot.name}`);
    console.log(`📦  Use Case: ${config.useCase.name}`);
    console.log(`🚀  Local:    http://localhost:${config.server.port}`);
    console.log(`📡  API:      http://localhost:${config.server.port}/api/health`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
    console.error("💥  Fatal startup error:", err);
    process.exit(1);
});

process.on("SIGINT", () => { console.log("\n👋  Shutting down."); process.exit(0); });
process.on("uncaughtException", (e) => console.error("💥", e));
process.on("unhandledRejection", (r) => console.error("💥", r));
