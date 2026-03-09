/**
 * REST API Routes — Protected endpoints for website integration
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const config = require("../config");
const wa = require("../services/whatsappApi");
const { saveOrder, getOrder, getAllOrders, getAllUsers, updateOrderStatus } = require("../services/storage");

const router = express.Router();

// ── Rate Limiter ──────────────────────────────────────────────────────────────
router.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { success: false, error: "Too many requests. Please try again later." },
}));

// ── API Key Auth ──────────────────────────────────────────────────────────────
function requireApiKey(req, res, next) {
    const key = req.headers["x-api-key"] || req.query.api_key;
    if (!key || key !== config.server.apiSecret) {
        return res.status(401).json({ success: false, error: "Unauthorized." });
    }
    next();
}

// ── GET /api/health ───────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
    res.json({
        success: true,
        bot: config.bot.name,
        api: "WhatsApp Business Cloud API",
        phoneNumberId: config.whatsapp.phoneNumberId,
        configured: wa.checkConfig(),
        timestamp: new Date().toISOString(),
    });
});

// ── GET /api/status (polled by dashboard) ────────────────────────────────────
router.get("/status", (req, res) => {
    res.json({
        status: wa.checkConfig() ? "connected" : "misconfigured",
        configured: wa.checkConfig(),
    });
});

// ── POST /api/send-order-message ─────────────────────────────────────────────
// Triggered by website when a new order is placed.
router.post("/send-order-message", requireApiKey, async (req, res) => {
    const { phone, name, order_id, product, price, date } = req.body;

    const missing = ["phone", "name", "order_id", "product", "price"].filter((f) => !req.body[f]);
    if (missing.length) {
        return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
    }

    if (!wa.checkConfig()) {
        return res.status(503).json({ success: false, error: "WhatsApp API not configured." });
    }

    try {
        const cleanPhone = phone.replace(/\D/g, "");
        const order = saveOrder({ order_id, phone: cleanPhone, name, product, price, date });
        await wa.sendOrderConfirmation(cleanPhone, order);
        res.json({ success: true, message: "Order confirmation sent.", order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── POST /api/send-message ────────────────────────────────────────────────────
router.post("/send-message", requireApiKey, async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ success: false, error: "Missing 'phone' or 'message'." });
    }
    try {
        await wa.sendText(phone.replace(/\D/g, ""), message);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/orders ───────────────────────────────────────────────────────────
router.get("/orders", requireApiKey, (req, res) => {
    const orders = getAllOrders();
    res.json({ success: true, count: orders.length, orders });
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
router.get("/orders/:id", requireApiKey, (req, res) => {
    const order = getOrder(req.params.id);
    order
        ? res.json({ success: true, order })
        : res.status(404).json({ success: false, error: "Order not found." });
});

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
router.patch("/orders/:id/status", requireApiKey, async (req, res) => {
    const { status, notify } = req.body;
    const valid = ["Confirmed", "Pending", "Cancelled", "Completed"];
    if (!valid.includes(status)) {
        return res.status(400).json({ success: false, error: `Status must be: ${valid.join(", ")}` });
    }
    const order = updateOrderStatus(req.params.id, status);
    if (!order) return res.status(404).json({ success: false, error: "Order not found." });

    if (notify && order.phone && wa.checkConfig()) {
        const msgs = {
            Confirmed: `✅ Great news! Order #${order.order_id} is *confirmed*.\nTour: ${order.product} · Date: ${order.date}`,
            Cancelled: `❌ Order #${order.order_id} has been *cancelled*. Type *contact* for help.`,
            Completed: `🏁 Your tour for order #${order.order_id} is *completed*. Thank you! 🌟`,
            Pending: `⏳ Order #${order.order_id} is *pending review*. We will confirm shortly.`,
        };
        try { await wa.sendText(order.phone, msgs[status]); } catch { /* non-critical */ }
    }
    res.json({ success: true, order });
});

// ── GET /api/users ────────────────────────────────────────────────────────────
router.get("/users", requireApiKey, (req, res) => {
    const users = getAllUsers();
    res.json({ success: true, count: users.length, users });
});

module.exports = router;
