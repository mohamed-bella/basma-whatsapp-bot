/**
 * E-Commerce — Use Case Entry Point
 * Exports everything the bot core needs to run this use case.
 */

const data = require("./data");
const menus = require("./menus");
const messages = require("./messages");

module.exports = {
    // ── Identity ──────────────────────────────────────────
    name: "E-Commerce Store Bot",
    description: "WhatsApp bot for online store order confirmations & support",

    // ── Data ──────────────────────────────────────────────
    keywords: data.KEYWORDS,
    faq: data.FAQ,

    // ── Menus ─────────────────────────────────────────────
    menus,

    // ── Message Templates ─────────────────────────────────
    messages,

    // ── Custom settings ───────────────────────────────────
    orderLabel: "Item",       // What to call orders (Tour, Product, Item, etc.)
    currency: "MAD",

    // ── Extra statuses available for e-commerce ───────────
    orderStatuses: ["Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded", "Pending"],
};
