/**
 * Webhook Routes — Official WhatsApp Business Cloud API
 *
 * GET  /webhook  → Verification handshake (Meta calls this once when you configure webhooks)
 * POST /webhook  → Incoming messages (Meta calls this for every message your bot receives)
 */

const express = require("express");
const config = require("../config");
const { handleIncomingMessage } = require("../handlers/messages");

const router = express.Router();

// ── GET /webhook — Meta verification handshake ────────────────────────────────
// When you configure webhooks in Meta Developer Dashboard,
// Meta sends a GET request to verify your endpoint.
router.get("/", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === config.whatsapp.webhookVerifyToken) {
        console.log("✅  Webhook verified by Meta.");
        return res.status(200).send(challenge); // MUST return the challenge string
    }

    console.warn("⚠️  Webhook verification failed. Check WEBHOOK_VERIFY_TOKEN in .env");
    res.sendStatus(403);
});

// ── POST /webhook — Incoming messages from Meta ───────────────────────────────
// IMPORTANT: Always respond with 200 immediately, then process asynchronously.
// If Meta doesn't receive 200 within 20s, it retries — causing duplicate messages.
router.post("/", (req, res) => {
    const body = req.body;

    // Verify it's a WhatsApp Business Account event
    if (body?.object !== "whatsapp_business_account") {
        return res.sendStatus(404);
    }

    // ✅ Respond 200 immediately
    res.sendStatus(200);

    // Process asynchronously
    setImmediate(async () => {
        try {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            // Extract messages array
            const messages = value?.messages;
            if (!messages?.length) return;

            // Extract sender contact info
            const contacts = value?.contacts;

            for (const message of messages) {
                const contact = contacts?.find((c) => c.wa_id === message.from);
                await handleIncomingMessage(message, contact);
            }
        } catch (err) {
            console.error("❌  Webhook processing error:", err.message);
        }
    });
});

module.exports = router;
