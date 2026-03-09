/**
 * REST API Routes — Protected endpoints for website integration
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const config = require("../config");
const { getSocket, getSockStatus, getQRData } = require("../services/whatsapp");
const { saveOrder, getOrder, getAllOrders, getAllUsers, updateOrderStatus } = require("../services/storage");

const router = express.Router();

router.use(rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max, message: { success: false, error: "Too many requests." } }));

function requireApiKey(req, res, next) {
    const key = req.headers["x-api-key"] || req.query.api_key;
    if (!key || key !== config.server.apiSecret) return res.status(401).json({ success: false, error: "Unauthorized." });
    next();
}

router.get("/health", (req, res) => {
    res.json({ success: true, bot: config.bot.name, api: "Baileys WhatsApp Web", status: getSockStatus(), timestamp: new Date().toISOString() });
});

router.get("/qr", (req, res) => {
    res.json({ success: true, status: getSockStatus(), qr: getQRData() });
});

router.post("/send-order-message", requireApiKey, async (req, res) => {
    const { phone, name, order_id, product, price, date } = req.body;
    const sock = getSocket();
    if (!sock) return res.status(503).json({ success: false, error: "WhatsApp socket not connected." });

    const cleanPhone = phone.replace(/\D/g, "");
    const jid = `${cleanPhone}@s.whatsapp.net`;
    const order = saveOrder({ order_id, phone: cleanPhone, name, product, price, date });

    const body = `✅ *Order Confirmed!*\n\nHello ${name} 👋\n\n📦 *Order ID:* #${order_id}\n🏷️ *Tour:* ${product}\n📅 *Date:* ${date || "To be confirmed"}\n💶 *Price:* ${price}\n\nOur team will contact you within 24 hours.\nQuestions? Reply *contact* anytime. 🌍`;

    try {
        await sock.sendMessage(jid, { text: body });
        res.json({ success: true, message: "Order confirmation sent.", order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/send-message", requireApiKey, async (req, res) => {
    const { phone, message } = req.body;
    const sock = getSocket();
    if (!sock) return res.status(503).json({ success: false, error: "WhatsApp not connected." });

    try {
        await sock.sendMessage(`${phone.replace(/\D/g, "")}@s.whatsapp.net`, { text: message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/orders", requireApiKey, (req, res) => { res.json({ success: true, count: getAllOrders().length, orders: getAllOrders() }); });
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
        const msgs = { Confirmed: `✅ Great news! Order #${order.order_id} is *confirmed*.`, Cancelled: `❌ Order #${order.order_id} has been *cancelled*.` };
        if (msgs[status]) try { await sock.sendMessage(`${order.phone}@s.whatsapp.net`, { text: msgs[status] }); } catch { }
    }
    res.json({ success: true, order });
});

router.get("/users", requireApiKey, (req, res) => { res.json({ success: true, count: getAllUsers().length, users: getAllUsers() }); });

module.exports = router;
