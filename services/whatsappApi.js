/**
 * WhatsApp Business Cloud API — Official HTTP Client
 * Sends messages via graph.facebook.com using Meta's REST API.
 *
 * SUPPORTS (official API features, not available in Baileys):
 *   ✅ Real interactive button messages (up to 3 quick-reply buttons)
 *   ✅ Real list messages (up to 10 options in sections)
 *   ✅ Template messages (for outbound / 24h-window exceptions)
 *   ✅ Text messages with markdown formatting
 *
 * CHARACTER LIMITS (enforced by Meta):
 *   Button title:       max 20 chars
 *   List button text:   max 20 chars
 *   Row title:          max 24 chars
 *   Row description:    max 72 chars
 *   Header text:        max 60 chars
 *   Footer text:        max 60 chars
 *   Body text:          max 1024 chars
 */

const axios = require("axios");
const config = require("../config");

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: `https://graph.facebook.com/${config.whatsapp.apiVersion}`,
    headers: {
        Authorization: `Bearer ${config.whatsapp.token}`,
        "Content-Type": "application/json",
    },
    timeout: 10_000,
});

// ── Error logger ──────────────────────────────────────────────────────────────
function logError(fn, err) {
    const detail = err.response?.data?.error || err.message;
    console.error(`❌  WhatsApp API [${fn}]:`, JSON.stringify(detail, null, 2));
    throw err;
}

// ── Low-level send ────────────────────────────────────────────────────────────
async function sendPayload(payload) {
    try {
        const res = await api.post(`/${config.whatsapp.phoneNumberId}/messages`, {
            messaging_product: "whatsapp",
            ...payload,
        });
        return res.data;
    } catch (err) {
        logError("sendPayload", err);
    }
}

// ── Mark message as read ──────────────────────────────────────────────────────
async function markRead(messageId) {
    try {
        await api.post(`/${config.whatsapp.phoneNumberId}/messages`, {
            messaging_product: "whatsapp",
            status: "read",
            message_id: messageId,
        });
    } catch { /* non-critical */ }
}

// ── 1. TEXT MESSAGE ───────────────────────────────────────────────────────────
async function sendText(to, body) {
    return sendPayload({
        to,
        type: "text",
        text: { preview_url: false, body },
    });
}

// ── 2. INTERACTIVE BUTTON MESSAGE ─────────────────────────────────────────────
/**
 * @param {string} to      - Phone number with country code (no +)
 * @param {object} opts
 * @param {string} opts.body    - Main message text (max 1024 chars)
 * @param {string} [opts.header]  - Optional header text (max 60 chars)
 * @param {string} [opts.footer]  - Optional footer text (max 60 chars)
 * @param {Array}  opts.buttons   - Max 3 items: [{ id, title }]
 */
async function sendButtons(to, { body, header, footer, buttons }) {
    const interactive = {
        type: "button",
        body: { text: body },
        action: {
            buttons: buttons.slice(0, 3).map((btn) => ({
                type: "reply",
                reply: {
                    id: btn.id,
                    title: btn.title.slice(0, 20), // Meta enforces 20-char limit
                },
            })),
        },
    };

    if (header) interactive.header = { type: "text", text: header.slice(0, 60) };
    if (footer) interactive.footer = { text: footer.slice(0, 60) };

    return sendPayload({ to, type: "interactive", interactive });
}

// ── 3. LIST MESSAGE ───────────────────────────────────────────────────────────
/**
 * @param {string} to
 * @param {object} opts
 * @param {string} opts.body        - Message body (max 1024 chars)
 * @param {string} [opts.header]    - Optional header text (max 60 chars)
 * @param {string} [opts.footer]    - Optional footer text (max 60 chars)
 * @param {string} opts.buttonText  - Label for the "open list" button (max 20 chars)
 * @param {Array}  opts.sections    - [{ title, rows: [{ id, title, description? }] }]
 *                                    Row title: max 24 chars, description: max 72 chars
 */
async function sendList(to, { body, header, footer, buttonText, sections }) {
    const interactive = {
        type: "list",
        body: { text: body },
        action: {
            button: buttonText.slice(0, 20),
            sections: sections.map((sec) => ({
                title: sec.title,
                rows: sec.rows.map((row) => ({
                    id: row.id,
                    title: row.title.slice(0, 24),
                    ...(row.description ? { description: row.description.slice(0, 72) } : {}),
                })),
            })),
        },
    };

    if (header) interactive.header = { type: "text", text: header.slice(0, 60) };
    if (footer) interactive.footer = { text: footer.slice(0, 60) };

    return sendPayload({ to, type: "interactive", interactive });
}

// ── 4. TEMPLATE MESSAGE ───────────────────────────────────────────────────────
async function sendTemplate(to, templateName, languageCode = "en_US", components = []) {
    return sendPayload({
        to,
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
            ...(components.length ? { components } : {}),
        },
    });
}

// ── 5. ORDER CONFIRMATION (Text fallback for outbound) ────────────────────────
async function sendOrderConfirmation(to, { name, order_id, product, price, date }) {
    const body =
        `✅ *Order Confirmed!*\n\n` +
        `Hello ${name} 👋\n\n` +
        `📦 *Order ID:* #${order_id}\n` +
        `🏷️ *Tour:* ${product}\n` +
        `📅 *Date:* ${date || "To be confirmed"}\n` +
        `💶 *Price:* ${price}\n\n` +
        `Our team will contact you within 24 hours.\n` +
        `Questions? Reply *contact* anytime. 🌍`;

    return sendText(to, body);
}

// ── Health check: verify token & phone number ID are set ─────────────────────
function checkConfig() {
    const missing = [];
    if (!config.whatsapp.token) missing.push("WHATSAPP_TOKEN");
    if (!config.whatsapp.phoneNumberId) missing.push("WHATSAPP_PHONE_ID");
    if (missing.length) {
        console.warn(`⚠️  WhatsApp API: missing env vars: ${missing.join(", ")}`);
        return false;
    }
    return true;
}

module.exports = {
    sendText,
    sendButtons,
    sendList,
    sendTemplate,
    sendOrderConfirmation,
    markRead,
    checkConfig,
};
