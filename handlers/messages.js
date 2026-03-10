/**
 * Message Handler — Stateful Conversation (Baileys compatible)
 * Dynamically loads keywords, FAQ, and menus from the active use case.
 */

const config = require("../config");
const { getOrder, saveUser } = require("../services/storage");
const { getSession, setState } = require("../services/session");

// ── Load from active use case ───────────────────────────────────────────
const { keywords: KEYWORDS, faq: FAQ, menus } = config.useCase;

function extractText(msg) {
    const m = msg.message;
    return (
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        m?.videoMessage?.caption ||
        ""
    ).trim();
}

function matchesKeyword(text, keywords) {
    if (!keywords) return false;
    return keywords.some((kw) => text.toLowerCase().includes(kw));
}

async function send(sock, jid, text) {
    await sock.sendMessage(jid, { text });
}

// ── Global shortcuts ────────────────────────────────────────────────────────
async function handleGlobalShortcut(sock, jid, phone, text) {
    const lower = text.toLowerCase();

    if (lower === "0" || matchesKeyword(text, KEYWORDS.menu)) {
        setState(phone, "main_menu");
        await send(sock, jid, menus.mainMenu());
        return true;
    }
    if (matchesKeyword(text, KEYWORDS.greetings)) {
        setState(phone, "main_menu");
        await send(sock, jid, menus.greeting());
        return true;
    }

    // Dynamic FAQ matching — check all keyword groups against FAQ
    for (const [topic, words] of Object.entries(KEYWORDS)) {
        if (["greetings", "menu", "order"].includes(topic)) continue;
        if (FAQ[topic] && matchesKeyword(text, words)) {
            setState(phone, "main_menu");
            await send(sock, jid, FAQ[topic]);
            return true;
        }
    }

    // "order 1254"
    if (matchesKeyword(text, KEYWORDS.order)) {
        const match = text.match(/(\d{3,10})/);
        if (match) {
            const order = getOrder(match[1]);
            if (order) {
                setState(phone, "main_menu");
                await send(sock, jid, menus.orderStatus(order));
            } else {
                setState(phone, "awaiting_order");
                await send(sock, jid, `❓ Order *#${match[1]}* not found.\nCheck the number and try again:`);
            }
            return true;
        }
        setState(phone, "awaiting_order");
        await send(sock, jid, menus.orderPrompt());
        return true;
    }
    return false;
}

// ── States ──────────────────────────────────────────────────────────────────
async function handleMainMenu(sock, jid, phone, text) {
    const num = text.trim();

    // Check if the use case has a custom mainMenuHandler
    if (config.useCase.menus.handleMainMenuChoice) {
        const handled = await config.useCase.menus.handleMainMenuChoice(sock, jid, phone, num, send, setState, FAQ);
        if (handled) return;
    }

    // Default menu handling (works for most use cases)
    switch (num) {
        case "1":
            if (menus.toursList) {
                setState(phone, "tours");
                await send(sock, jid, menus.toursList());
            } else {
                setState(phone, "awaiting_order");
                await send(sock, jid, menus.orderPrompt());
            }
            break;
        case "2":
            setState(phone, "awaiting_order");
            await send(sock, jid, menus.orderPrompt());
            break;
        default:
            // Try to match FAQ topics by menu number
            const faqKeys = Object.keys(FAQ);
            const idx = parseInt(num) - 3; // 3+ maps to FAQ
            if (idx >= 0 && idx < faqKeys.length) {
                await send(sock, jid, FAQ[faqKeys[idx]]);
            } else {
                await send(sock, jid, menus.mainMenu());
            }
    }
}

async function handleTours(sock, jid, phone, text) {
    if (!menus.tourDetail) {
        await send(sock, jid, menus.mainMenu());
        return;
    }
    const n = parseInt(text.trim());
    const detail = menus.tourDetail(n);
    if (detail) {
        setState(phone, "tour_detail");
        await send(sock, jid, detail);
    } else {
        await send(sock, jid, menus.toursList ? menus.toursList() : menus.mainMenu());
    }
}

async function handleAwaitingOrder(sock, jid, phone, text) {
    const match = text.match(/(\d{3,10})/);
    if (match) {
        const order = getOrder(match[1]);
        if (order) {
            setState(phone, "main_menu");
            await send(sock, jid, menus.orderStatus(order));
        } else {
            await send(sock, jid, `❓ *Order #${match[1]} not found.*\nDouble check the order number or type *contact*. Type *0* to go back.`);
        }
    } else {
        await send(sock, jid, `📦 Please send your *order number* only.\nType *0* to go back.`);
    }
}

async function handleMoreInfo(sock, jid, phone, text) {
    if (menus.moreInfoMenu) {
        const faqKeys = Object.keys(FAQ);
        const idx = parseInt(text.trim()) - 1;
        if (idx >= 0 && idx < faqKeys.length) {
            await send(sock, jid, FAQ[faqKeys[idx]]);
        } else {
            await send(sock, jid, menus.moreInfoMenu());
        }
    } else {
        await send(sock, jid, menus.mainMenu());
    }
}

// ── Entry ───────────────────────────────────────────────────────────────────
async function handleIncomingMessage(sock, msg) {
    const jid = msg.key.remoteJid;
    const phone = jid.replace("@s.whatsapp.net", "").replace("@g.us", "");
    const text = extractText(msg);

    if (!text) return;
    saveUser(phone);
    console.log(`📨  [${phone}] "${text}"`);

    // Try global shortcuts first
    const handled = await handleGlobalShortcut(sock, jid, phone, text);
    if (handled) return;

    // Route based on current state
    const session = getSession(phone);
    switch (session.state) {
        case "main_menu":
            await handleMainMenu(sock, jid, phone, text);
            break;
        case "tours":
            await handleTours(sock, jid, phone, text);
            break;
        case "awaiting_order":
            await handleAwaitingOrder(sock, jid, phone, text);
            break;
        case "more_info":
            await handleMoreInfo(sock, jid, phone, text);
            break;
        case "tour_detail":
            // from tour detail, any text goes back to shortcuts or main menu
            setState(phone, "main_menu");
            await handleMainMenu(sock, jid, phone, text);
            break;
        default:
            // New user or idle — show greeting
            setState(phone, "main_menu");
            await send(sock, jid, menus.greeting());
    }
}

module.exports = { handleIncomingMessage };
