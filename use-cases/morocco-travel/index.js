/**
 * Morocco Travel — Use Case Entry Point
 * Exports everything the bot core needs to run this use case.
 */

const data = require("./data");
const menus = require("./menus");
const messages = require("./messages");

module.exports = {
    // ── Identity ──────────────────────────────────────────
    name: "Basma Morocco Travel",
    description: "WhatsApp bot for Morocco travel tours & bookings",

    // ── Data ──────────────────────────────────────────────
    keywords: data.KEYWORDS,
    faq: data.FAQ,
    tours: data.TOURS,
    tourList: data.TOUR_LIST,

    // ── Menus ─────────────────────────────────────────────
    menus,

    // ── Message Templates ─────────────────────────────────
    messages,

    // ── Custom settings ───────────────────────────────────
    orderLabel: "Tour",       // What to call orders (Tour, Product, Item, etc.)
    currency: "€",
};
