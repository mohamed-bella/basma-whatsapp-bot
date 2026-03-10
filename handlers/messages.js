/**
 * Message Handler — Stateful Conversation (atexovi-baileys compatible)
 * Supports interactive list buttons via atexovi-baileys.
 * Dynamically loads keywords, FAQ, and menus from the active use case.
 */

const config = require("../config");
const { getOrder, saveUser } = require("../services/storage");
const { getSession, setState } = require("../services/session");

// ── Load from active use case ───────────────────────────────────────────
const { keywords: KEYWORDS, faq: FAQ, menus } = config.useCase;

/**
 * Extracts plain text OR an interactive button reply ID from any message type.
 * Returns { text, rowId } — either can be null.
 */
function extractText(msg) {
    const m = msg.message;

    // Standard text messages
    const text = (
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        m?.videoMessage?.caption ||
        ""
    ).trim();
    if (text) return text;

    // Interactive list response (atexovi-baileys: user taps a list item)
    try {
        if (m?.interactiveResponseMessage?.nativeFlowResponseMessage) {
            const parsed = JSON.parse(m.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson || "{}");
            return parsed.id || parsed.title || "";
        }
    } catch (_) { }

    // Legacy listResponseMessage fallback
    if (m?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        return m.listResponseMessage.singleSelectReply.selectedRowId;
    }

    // Button reply fallback
    if (m?.buttonsResponseMessage?.selectedButtonId) {
        return m.buttonsResponseMessage.selectedButtonId;
    }

    return "";
}

function matchesKeyword(text, keywords) {
    if (!keywords) return false;
    return keywords.some((kw) => text.toLowerCase().includes(kw));
}

async function send(sock, jid, text) {
    await sock.sendMessage(jid, { text });
}

/**
 * Sends an interactive list menu using atexovi-baileys interactiveButtons.
 * Falls back to formatted text if the feature isn't available.
 * @param {object} sock
 * @param {string} jid
 * @param {string} headerText - The message text above the button
 * @param {string} footerText - Footer under the button
 * @param {string} buttonLabel - Label on the list-open button
 * @param {string} listTitle  - Title shown inside the list sheet
 * @param {Array}  rows       - Array of {title, description, id}
 */
async function sendInteractiveMenu(sock, jid, headerText, footerText, buttonLabel, listTitle, rows) {
    const listPayload = {
        title: buttonLabel,
        sections: [{ title: listTitle, rows }]
    };

    try {
        await sock.sendMessage(jid, {
            text: headerText,
            footer: footerText,
            interactiveButtons: [
                { name: "single_select", buttonParamsJson: JSON.stringify(listPayload) }
            ]
        });
    } catch (err) {
        // Graceful fallback: plain numbered text menu
        const numbered = rows.map((r, i) => `  ${i + 1}️⃣  ${r.title}${r.description ? ` — ${r.description}` : ""}`).join("\n");
        await send(sock, jid, `${headerText}\n\n${numbered}\n\n_Reply with a number to choose._`);
    }
}

// ── Global shortcuts ────────────────────────────────────────────────────────
async function handleGlobalShortcut(sock, jid, phone, text) {
    const lower = text.toLowerCase();

    // ── "hi" → interactive list menu ────────────────────────────────────────
    if (lower === "hi" || lower === "hello" || lower === "hola" || lower === "salut") {
        setState(phone, "main_menu");
        await sendInteractiveMenu(
            sock, jid,
            "👋 Welcome to *Basma Bot*!\n\nHow can we help you today?",
            "Tap the button below to see your options",
            "📋 View Options",
            "Choose what you need:",
            [
                { title: "🌍 Book a Tour", description: "Browse & book travel packages", id: "menu_tours" },
                { title: "📦 Track My Order", description: "Check your order status", id: "menu_order" },
                { title: "🤝 Speak to an Agent", description: "Get personalized assistance", id: "menu_agent" },
                { title: "📖 Show Full Menu", description: "See all available options", id: "menu_main" },
            ]
        );
        return true;
    }

    // ── Interactive list response IDs ────────────────────────────────────────
    if (text === "menu_tours") {
        setState(phone, "tours");
        const msg = menus.toursList ? menus.toursList() : "🌍 *Our Tours*\n\n1️⃣ Sahara Desert Adventure\n2️⃣ Atlas Mountains Trek\n3️⃣ Marrakech City Tour\n\nReply with a number to learn more.";
        await send(sock, jid, msg);
        return true;
    }

    if (text === "menu_order") {
        setState(phone, "awaiting_order");
        await send(sock, jid, menus.orderPrompt ? menus.orderPrompt() : "📦 Please enter your *Order Number* to check the status:");
        return true;
    }

    if (text === "menu_agent") {
        setState(phone, "main_menu");
        await send(sock, jid, "🤝 *Customer Support*\n\nOur team is ready to help you! Please describe your question or issue and we'll get back to you as soon as possible.\n\nYou can also reply *0* at any time to return to the main menu.");
        return true;
    }

    if (text === "menu_main") {
        setState(phone, "main_menu");
        await send(sock, jid, menus.mainMenu());
        return true;
    }

    // ── Standard text shortcuts ─────────────────────────────────────────────
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
