/**
 * Basma WhatsApp Bot — Entry Point (Baileys WhatsApp Web version)
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
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.use((err, req, res, next) => res.status(500).json({ success: false, error: "Internal error." }));

async function main() {
    await startBot();

    await new Promise((resolve) => {
        app.listen(config.server.port, resolve);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🤖  ${config.bot.name} (Baileys Version)`);
    console.log(`🚀  Local:     http://localhost:${config.server.port}`);
    console.log(`🔑  Dashboard: http://localhost:${config.server.port}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
    console.error("💥  Fatal startup error:", err);
    process.exit(1);
});

process.on("SIGINT", () => { console.log("\n👋  Shutting down."); process.exit(0); });
process.on("uncaughtException", (e) => console.error("💥", e));
process.on("unhandledRejection", (r) => console.error("💥", r));
