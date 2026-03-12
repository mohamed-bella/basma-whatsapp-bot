/**
 * REST API Routes — Protected endpoints for website integration
 * Works with any use case — sends messages using use case templates.
 */

const express = require("express");
const config = require("../config");
const { getSocket, getSockStatus, getQRData } = require("../services/whatsapp");
const { saveOrder, getOrder, getAllOrders, getAllUsers, saveUser, updateOrderStatus } = require("../services/storage");
const { sendStatusNotification } = require("../handlers/orders");

const router = express.Router();

function requireApiKey(req, res, next) {
    const key = req.headers["x-api-key"] || req.query.api_key;
    if (!key || key !== config.server.apiSecret) return res.status(401).json({ success: false, error: "Unauthorized." });
    next();
}

// ── Health Check ────────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
    res.json({
        success: true,
        bot: config.bot.name,
        useCase: config.useCase.name,
        status: getSockStatus(),
        timestamp: new Date().toISOString(),
    });
});

// ── QR Code ─────────────────────────────────────────────────────────────────
router.get("/qr", (req, res) => {
    res.json({ success: true, status: getSockStatus(), qr: getQRData() });
});

// ── Send Order Confirmation ─────────────────────────────────────────────────
router.post("/send-order-message", requireApiKey, async (req, res) => {
    const { phone, name, order_id, product, price, date } = req.body;
    const sock = getSocket();
    if (!sock) return res.status(503).json({ success: false, error: "WhatsApp socket not connected." });

    const cleanPhone = phone.replace(/\D/g, "");
    const jid = `${cleanPhone}@s.whatsapp.net`;
    const order = saveOrder({ order_id, phone: cleanPhone, name, product, price, date });

    // Use the active use case's order confirmation template
    const body = config.useCase.messages.orderConfirmation({
        name,
        order_id,
        product,
        price,
        date: order.date,
    });

    try {
        let messagePayload;

        if (req.body.image_url) {
            messagePayload = { image: { url: req.body.image_url }, caption: body };
        } else if (req.body.contact) {
            const vcard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${req.body.contact_name || req.body.contact}\n` +
                `TEL;type=CELL;type=VOICE;waid=${req.body.contact.replace(/\D/g, "")}:+${req.body.contact.replace(/\D/g, "")}\n` +
                'END:VCARD';

            messagePayload = {
                contacts: {
                    displayName: req.body.contact_name || req.body.contact,
                    contacts: [{ vcard }]
                }
            };
        } else {
            messagePayload = { text: body };
        }

        await sock.sendMessage(jid, messagePayload);
        res.json({ success: true, message: "Order confirmation sent.", order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Send Custom Message ─────────────────────────────────────────────────────
router.post("/send-message", requireApiKey, async (req, res) => {
    const { phone, message, image_url, contact, contact_name } = req.body;
    const sock = getSocket();
    if (!sock) return res.status(503).json({ success: false, error: "WhatsApp not connected." });

    try {
        const jid = `${phone.replace(/\D/g, "")}@s.whatsapp.net`;
        let messagePayload;

        if (image_url) {
            messagePayload = { image: { url: image_url }, caption: message || "" };
        } else if (contact) {
            const vcard = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `FN:${contact_name || contact}\n` +
                `TEL;type=CELL;type=VOICE;waid=${contact.replace(/\D/g, "")}:+${contact.replace(/\D/g, "")}\n` +
                'END:VCARD';

            messagePayload = {
                contacts: {
                    displayName: contact_name || contact,
                    contacts: [{ vcard }]
                }
            };
        } else {
            messagePayload = { text: message };
        }

        await sock.sendMessage(jid, messagePayload);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Orders ──────────────────────────────────────────────────────────────────
router.get("/orders", requireApiKey, (req, res) => {
    res.json({ success: true, count: getAllOrders().length, orders: getAllOrders() });
});

router.get("/orders/:id", requireApiKey, (req, res) => {
    const order = getOrder(req.params.id);
    order ? res.json({ success: true, order }) : res.status(404).json({ success: false, error: "Order not found." });
});

router.patch("/orders/:id/status", requireApiKey, async (req, res) => {
    const { status, notify } = req.body;
    const order = updateOrderStatus(req.params.id, status);
    if (!order) return res.status(404).json({ success: false, error: "Order not found." });

    const sock = getSocket();
    if (notify && order.phone && sock) {
        try {
            await sendStatusNotification(sock, order, status);
        } catch { }
    }
    res.json({ success: true, order });
});

// ── Users ───────────────────────────────────────────────────────────────────
router.get("/users", requireApiKey, (req, res) => {
    res.json({ success: true, count: getAllUsers().length, users: getAllUsers() });
});

// ── IPTV Contact Form (From WordPress) ──────────────────────────────────────
router.post("/iptv-contact", async (req, res) => {
    const { name, email, phone } = req.body;
    const sock = getSocket();
    const status = getSockStatus();

    if (!sock || status !== "connected") {
        return res.status(503).json({ 
            success: false, 
            error: "WhatsApp not connected.",
            status: status 
        });
    }

    if (!name || !phone) {
        return res.status(400).json({ success: false, error: "Name and phone are required." });
    }

    try {
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length < 8) throw new Error("Invalid phone number format.");
        
        const userJid = `${cleanPhone}@s.whatsapp.net`;
        
        // Save user to storage
        saveUser(cleanPhone, name);

        // 1. Send Confirmation to the User
        const userMsg = `✅ *Demande reçue!*\n\nBonjour *${name}* 👋\n\nMerci de nous avoir contactés pour votre abonnement IPTV. Notre équipe vous contactera sur ce numéro WhatsApp dès que possible.\n\n📺 *Service IPTV Premium*`;
        await sock.sendMessage(userJid, { text: userMsg });

        // 2. Notify the Admin (if configured in .env)
        const adminPhone = process.env.ADMIN_NUMBER;
        if (adminPhone) {
            const cleanAdmin = adminPhone.replace(/\D/g, "");
            const adminJid = `${cleanAdmin}@s.whatsapp.net`;
            const adminMsg = `🚀 *Nouveau Contact IPTV!*\n\n👤 *Nom:* ${name}\n📧 *Email:* ${email || 'Non fourni'}\n📱 *WhatsApp:* ${phone}\n\nL'utilisateur attend votre message.`;
            await sock.sendMessage(adminJid, { text: adminMsg });
        }

        console.log(`📡  IPTV Contact processed for ${name} (${cleanPhone})`);
        res.json({ success: true, message: "Contact request processed successfully." });
    } catch (err) {
        console.error("❌ IPTV Contact Error:", err.message);
        res.status(500).json({ 
            success: false, 
            error: "Failed to process contact request.",
            details: err.message
        });
    }
});

module.exports = router;
