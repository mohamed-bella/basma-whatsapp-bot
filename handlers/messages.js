/**
 * Message Handler — Stateful Conversation (Baileys compatible)
 * Pure text approach: Parses text/numbers and routes to state logic.
 */

const { KEYWORDS, FAQ } = require("../data/botData");
const { getOrder, saveUser } = require("../services/storage");
const { getSession, setState } = require("../services/session");
const menus = require("./menus");

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
    if (matchesKeyword(text, KEYWORDS.tours) || lower === "tours") {
        setState(phone, "tours");
        await send(sock, jid, menus.toursList());
        return true;
    }
    if (matchesKeyword(text, KEYWORDS.price)) { setState(phone, "main_menu"); await send(sock, jid, FAQ.price); return true; }
    if (matchesKeyword(text, KEYWORDS.booking) || lower === "book") { setState(phone, "main_menu"); await send(sock, jid, FAQ.booking); return true; }
    if (matchesKeyword(text, KEYWORDS.contact)) { setState(phone, "main_menu"); await send(sock, jid, FAQ.contact); return true; }
    if (matchesKeyword(text, KEYWORDS.location)) { setState(phone, "main_menu"); await send(sock, jid, FAQ.location); return true; }
    if (matchesKeyword(text, KEYWORDS.payment)) { setState(phone, "main_menu"); await send(sock, jid, FAQ.payment); return true; }
    if (matchesKeyword(text, KEYWORDS.cancel)) { setState(phone, "main_menu"); await send(sock, jid, FAQ.cancel); return true; }
    if (matchesKeyword(text, KEYWORDS.visa)) { setState(phone, "main_menu"); await send(sock, jid, FAQ.visa); return true; }

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
    switch (text.trim()) {
        case "1": setState(phone, "tours"); await send(sock, jid, menus.toursList()); break;
        case "2": setState(phone, "awaiting_order"); await send(sock, jid, menus.orderPrompt()); break;
        case "3": await send(sock, jid, FAQ.price); break;
        case "4": await send(sock, jid, FAQ.booking); break;
        case "5": await send(sock, jid, FAQ.contact); break;
        case "6": setState(phone, "more_info"); await send(sock, jid, menus.moreInfoMenu()); break;
        default: await send(sock, jid, menus.mainMenu());
    }
}

async function handleTours(sock, jid, phone, text) {
    const n = parseInt(text.trim());
    if (n >= 1 && n <= 5) {
        setState(phone, "tour_detail");
        await send(sock, jid, menus.tourDetail(n));
    } else {
        await send(sock, jid, menus.toursList());
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
        await send(sock, jid, `📦 Please send your *order number* only.\nExample: \`1254\`\nType *0* to go back.`);
    }
}

async function handleMoreInfo(sock, jid, phone, text) {
    switch (text.trim()) {
        case "1": await send(sock, jid, FAQ.location); break;
        case "2": await send(sock, jid, FAQ.payment); break;
        case "3": await send(sock, jid, FAQ.cancel); break;
        case "4": await send(sock, jid, FAQ.visa); break;
        default: await send(sock, jid, menus.moreInfoMenu());
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

    const session = getSession(phone);

    if (await handleGlobalShortcut(sock, jid, phone, text)) return;

    const state = session.state;
    if (state === "idle") { setState(phone, "main_menu"); return send(sock, jid, menus.greeting()); }
    if (state === "main_menu") return handleMainMenu(sock, jid, phone, text);
    if (state === "tours") return handleTours(sock, jid, phone, text);
    if (state === "tour_detail") { setState(phone, "tours"); return send(sock, jid, menus.toursList()); }
    if (state === "awaiting_order") return handleAwaitingOrder(sock, jid, phone, text);
    if (state === "more_info") return handleMoreInfo(sock, jid, phone, text);

    setState(phone, "main_menu");
    await send(sock, jid, menus.fallback());
}

module.exports = { handleIncomingMessage };
