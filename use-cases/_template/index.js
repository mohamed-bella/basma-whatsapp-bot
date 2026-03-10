/**
 * _template — Use Case Entry Point
 * Copy this entire folder to create a new use case.
 *
 * Steps:
 *   1. Copy this folder:  use-cases/_template  →  use-cases/your-project
 *   2. Edit data.js with your keywords and FAQ
 *   3. Edit menus.js with your menu text
 *   4. Edit messages.js with your message templates
 *   5. Update .env:  USE_CASE=your-project
 *   6. Restart the bot!
 */

const data = require("./data");
const menus = require("./menus");
const messages = require("./messages");

module.exports = {
    // ── Identity ──────────────────────────────────────────
    name: "My Bot Name",                              // Change this
    description: "WhatsApp bot for my project",        // Change this

    // ── Data ──────────────────────────────────────────────
    keywords: data.KEYWORDS,
    faq: data.FAQ,

    // ── Menus ─────────────────────────────────────────────
    menus,

    // ── Message Templates ─────────────────────────────────
    messages,

    // ── Custom settings ───────────────────────────────────
    orderLabel: "Order",       // What to call orders (Tour, Product, Item, etc.)
    currency: "USD",           // Your currency
};
