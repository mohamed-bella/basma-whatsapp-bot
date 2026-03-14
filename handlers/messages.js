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

    if (lower.startsWith(".post")) {
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
    
    // Command: .post start or .post
    if (argsLower === "start" || argsLower === "") {
        const instructionMessage = `📝 *New Article Creation*

Copy the template in the next message, replace the bracketed text with your article details, and send it back to me.
Do not change the labels (Title:, Subtitle:, etc.)`;

        const templateMessage = `.post submit
Title: [Your Article Title]
Subtitle: [Your Subtitle]
Time: [e.g. 5 Min Read]
Media: [e.g. 1606]
Content: 
[Paste your Markdown/HTML code here]`;

        await send(sock, jid, instructionMessage);
        await send(sock, jid, templateMessage);
        return true;
    }

    // Command: .post submit \n...
    if (argsLower.startsWith("submit")) {
        const rawContent = args.substring(6).trim(); // Remove "submit" keyword
        
        // Extract fields using Regex
        const titleMatch = rawContent.match(/Title:\s*(.+)/i);
        const subtitleMatch = rawContent.match(/Subtitle:\s*(.+)/i);
        const timeMatch = rawContent.match(/Time:\s*(.+)/i);
        const mediaMatch = rawContent.match(/Media:\s*(\d+)/i);
        
        // Content is everything after "Content:" line
        const contentSplit = rawContent.split(/Content:\s*/i);
        const contentMatch = contentSplit.length > 1 ? contentSplit[1].trim() : null;

        if (!titleMatch || !subtitleMatch || !timeMatch || !mediaMatch || !contentMatch) {
            await send(sock, jid, `❌ *Missing fields detected!*\n\nPlease make sure you filled out all fields correctly including Title, Subtitle, Time, Media, and Content.\n\nType \`.post\` to see the template again.`);
            return true;
        }

        const draft = {
            title: titleMatch[1].trim(),
            subtitle: subtitleMatch[1].trim(),
            reading_time: timeMatch[1].trim(),
            hero_image: parseInt(mediaMatch[1].trim()),
            content: contentMatch
        };

        if (draft.content.startsWith("[Paste") && draft.content.includes("here]")) {
            await send(sock, jid, `❌ Please replace the "[Paste your Markdown/HTML code here]" text with your actual content.`);
            return true;
        }

        await send(sock, jid, `⏳ *Creating article on WordPress...*\n\n*Title:* ${draft.title}\n*Media ID:* ${draft.hero_image}\n\nPlease wait.`);
            
        const result = await createStory(draft);
        if (result.success) {
            await send(sock, jid, 
                `✅ *Success! Article Created.*\n\n` +
                `*ID:* ${result.id}\n` +
                `*URL:* ${result.link}\n\n` +
                `Type *menu* to return.`
            );
        } else {
            await send(sock, jid, `❌ *Failed to create article.*\n\nError: ${result.error}`);
        }
        return true;
    }

    await send(sock, jid, `⚠️ Unknown .post command.\n\nValid commands:\n.post start\n.post submit`);
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
