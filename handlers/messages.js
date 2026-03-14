/**
 * Message Handler — Stateful Conversation (Baileys compatible)
 * Dynamically loads keywords, FAQ, and menus from the active use case.
 */

const config = require("../config");
const { getOrder, saveUser } = require("../services/storage");
const { getSession, setState } = require("../services/session");
const { createStory } = require("../services/wordpress");

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

    if (lower === "hi") {
        setState(phone, "hi_menu");
        await send(sock, jid,
            `👋 *Welcome! How can we help you today?*\n\n` +
            `*1️⃣* Book a New Tour\n` +
            `*2️⃣* Check Order Status\n` +
            `*3️⃣* Speak to Agent\n\n` +
            `_Reply with a number (1-3)_`
        );
        return true;
    }

    if (lower === "/post") {
        setState(phone, "POST_TITLE", { post_data: {} });
        await send(sock, jid, "📝 *New Article Creation*\n\nPlease enter the *Article Title*:\n\n_Type 'cancel' to abort._");
        return true;
    }

    // Handle hi_menu numbered replies
    const session = getSession(phone);
    if (session.state === "hi_menu") {
        if (text.trim() === "1") {
            setState(phone, "tours");
            await send(sock, jid, menus.toursList ? menus.toursList() : "🌍 Here are our available tours:\n1️⃣ Sahara Desert Tour\n2️⃣ Atlas Mountains\n\nReply with the number to learn more.");
            return true;
        }
        if (text.trim() === "2") {
            setState(phone, "awaiting_order");
            await send(sock, jid, menus.orderPrompt ? menus.orderPrompt() : "📦 Please enter your *Order Number* to check the status:");
            return true;
        }
        if (text.trim() === "3") {
            setState(phone, "agent");
            await send(sock, jid, "🧑‍💻 Connecting you to a live agent... Please wait a moment.\n\nType *0* to go back to the main menu.");
            return true;
        }
        // Invalid input — prompt again
        await send(sock, jid, "⚠️ Please reply with *1*, *2*, or *3* to choose an option.");
        return true;
    }

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

async function handlePostFlow(sock, jid, phone, text) {
    const session = getSession(phone);
    const postData = session.context.post_data || {};

    if (text.toLowerCase() === "cancel") {
        setState(phone, "main_menu");
        await send(sock, jid, "❌ Post creation cancelled.\n\nType *menu* to go back.");
        return;
    }

    switch (session.state) {
        case "POST_TITLE":
            postData.title = text;
            setState(phone, "POST_CONTENT", { post_data: postData });
            await send(sock, jid, "✅ Title saved!\n\nNow, please send the *.md code* for the post content (ACF story_content):");
            break;

        case "POST_CONTENT":
            postData.content = text;
            setState(phone, "POST_SUBTITLE", { post_data: postData });
            await send(sock, jid, "✅ Content saved!\n\nNow, please enter the *Subtitle*:");
            break;

        case "POST_SUBTITLE":
            postData.subtitle = text;
            setState(phone, "POST_READ_TIME", { post_data: postData });
            await send(sock, jid, "✅ Subtitle saved!\n\nNow, enter the *Reading Time* (e.g., '5 Min Read'):");
            break;

        case "POST_READ_TIME":
            postData.reading_time = text;
            setState(phone, "POST_HERO_IMAGE", { post_data: postData });
            await send(sock, jid, "✅ Reading Time saved!\n\nFinally, enter the *Media ID* for the Hero Image (e.g., '1606'):");
            break;

        case "POST_HERO_IMAGE":
            postData.hero_image = parseInt(text.trim()) || 1606;
            await send(sock, jid, `⏳ Creating article on WordPress with Media ID ${postData.hero_image}... Please wait.`);
            
            const result = await createStory(postData);
            
            if (result.success) {
                setState(phone, "main_menu");
                await send(sock, jid, 
                    `✅ *Success! Article Created.*\n\n` +
                    `*ID:* ${result.id}\n` +
                    `*URL:* ${result.link}\n\n` +
                    `Type *menu* to return.`
                );
            } else {
                await send(sock, jid, `❌ *Failed to create article.*\n\nError: ${result.error}\n\nType 'cancel' to stop or try entering the Media ID again:`);
            }
            break;
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
        case "POST_TITLE":
        case "POST_CONTENT":
        case "POST_SUBTITLE":
        case "POST_READ_TIME":
        case "POST_HERO_IMAGE":
            await handlePostFlow(sock, jid, phone, text);
            break;
        default:
            // New user or idle — show greeting
            setState(phone, "main_menu");
            await send(sock, jid, menus.greeting());
    }
}

module.exports = { handleIncomingMessage };
