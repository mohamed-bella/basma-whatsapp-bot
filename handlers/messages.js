/**
 * Message Handler — Stateful Conversation (Baileys compatible)
 * Dynamically loads keywords, FAQ, and menus from the active use case.
 */

const config = require("../config");
const { getOrder, saveUser } = require("../services/storage");
const { getSession, setState } = require("../services/session");
const { createStory } = require("../services/wordpress");

const postDrafts = new Map();

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

    if (lower.startsWith("/post")) {
        const args = text.trim().substring(5).trim();
        await handlePostCommands(sock, jid, phone, args);
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

async function handlePostCommands(sock, jid, phone, args) {
    const argsLower = args.toLowerCase();
    
    if (argsLower === "start" || argsLower === "") {
        postDrafts.set(phone, {});
        await send(sock, jid, "📝 *New Article Creation Started*\n\nYour draft memory is saved.\nPlease set the title by sending:\n\n👉 `/post title [Your Title]`");
        return true;
    }

    if (argsLower === "cancel") {
        postDrafts.delete(phone);
        await send(sock, jid, "❌ Post draft cleared. Type *menu* to return.");
        return true;
    }

    const draft = postDrafts.get(phone);
    if (!draft) {
        await send(sock, jid, "⚠️ No active post draft found. Send `/post start` to begin.");
        return true;
    }

    const firstSpace = args.indexOf(" ");
    const command = firstSpace > -1 ? args.substring(0, firstSpace).toLowerCase() : args.toLowerCase();
    const payload = firstSpace > -1 ? args.substring(firstSpace + 1).trim() : "";

    switch (command) {
        case "title":
            if (!payload) { await send(sock, jid, "⚠️ Please provide the title. Example:\n/post title My Awesome Trip"); return true; }
            draft.title = payload;
            await send(sock, jid, `✅ *Title saved!*\n\nNow, send the MD content:\n👉 \`/post content [Your .md code]\``);
            break;

        case "content":
            if (!payload) { await send(sock, jid, "⚠️ Please provide the content."); return true; }
            draft.content = payload;
            await send(sock, jid, `✅ *Content saved!*\n\nNow, send the subtitle:\n👉 \`/post subtitle [Your Subtitle]\``);
            break;

        case "subtitle":
            if (!payload) { await send(sock, jid, "⚠️ Please provide the subtitle."); return true; }
            draft.subtitle = payload;
            await send(sock, jid, `✅ *Subtitle saved!*\n\nNow, send the reading time:\n👉 \`/post time [e.g. 5 Min Read]\``);
            break;

        case "time":
            if (!payload) { await send(sock, jid, "⚠️ Please provide the reading time."); return true; }
            draft.reading_time = payload;
            await send(sock, jid, `✅ *Reading Time saved!*\n\nNow, send the Hero Image Media ID:\n👉 \`/post media [e.g. 1606]\``);
            break;
            
        case "media":
            if (!payload) { await send(sock, jid, "⚠️ Please provide the Media ID."); return true; }
            draft.hero_image = parseInt(payload) || 1606;
            await send(sock, jid, `⏳ *Creating article on WordPress...*\n\n*Title:* ${draft.title || 'N/A'}\n*Media ID:* ${draft.hero_image}\n\nPlease wait.`);
            
            const result = await createStory(draft);
            if (result.success) {
                postDrafts.delete(phone);
                await send(sock, jid, 
                    `✅ *Success! Article Created.*\n\n` +
                    `*ID:* ${result.id}\n` +
                    `*URL:* ${result.link}\n\n` +
                    `Type *menu* to return.`
                );
            } else {
                await send(sock, jid, `❌ *Failed to create article.*\n\nError: ${result.error}\n\nCheck your details. You can update any field (e.g., \`/post media 123\`) or \`/post cancel\`.`);
            }
            break;
            
        case "status":
            await send(sock, jid, `📊 *Draft Status:*\n\n*Title:* ${draft.title ? '✅' : '❌'}\n*Content:* ${draft.content ? '✅' : '❌'}\n*Subtitle:* ${draft.subtitle ? '✅' : '❌'}\n*Time:* ${draft.reading_time ? '✅' : '❌'}\n*Media:* ${draft.hero_image ? '✅' : '❌'}\n\nUpdate any missing field to continue.`);
            break;

        default:
            await send(sock, jid, `⚠️ Unknown /post command: ${command}\n\nValid commands:\n/post start\n/post title [text]\n/post content [md]\n/post subtitle [text]\n/post time [text]\n/post media [id]\n/post status\n/post cancel`);
    }

    return true;
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
