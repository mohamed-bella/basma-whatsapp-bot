/**
 * Message Handler — Simple List Reply
 * Every incoming message triggers a clean interactive list menu.
 */

const wa = require("../services/whatsappApi");
const { saveUser } = require("../services/storage");
const { markRead } = require("../services/whatsappApi");

// ── The one list we always send ───────────────────────────────────────────────
async function sendMainList(to) {
    return wa.sendList(to, {
        header: "🌍 Basma Morocco Travel",
        body: "Bonjour! 👋 How can I help you today?\nPlease choose an option below:",
        footer: "Morocco Travel Service",
        buttonText: "View Options",
        sections: [
            {
                title: "🗺️ Tours & Prices",
                rows: [
                    { id: "tours", title: "🗺️ Tour Packages", description: "Browse all our Morocco tours" },
                    { id: "price", title: "💶 Prices & Offers", description: "View pricing for all tours" },
                    { id: "booking", title: "📅 How to Book", description: "Reservation process explained" },
                ],
            },
            {
                title: "📦 My Order",
                rows: [
                    { id: "order", title: "📦 Check Order", description: "Track your confirmed booking" },
                ],
            },
            {
                title: "📞 Support",
                rows: [
                    { id: "contact", title: "📞 Contact Agent", description: "Talk to our team directly" },
                    { id: "faq", title: "❓ FAQ", description: "Common questions answered" },
                ],
            },
        ],
    });
}

// ── Handle list/button reply ──────────────────────────────────────────────────
async function handleAction(to, id) {
    const responses = {
        tours: `🗺️ *Our Tours:*\n\n🏜️ Sahara Desert — 3 days · 200€\n🕌 Marrakech City — 1 day · 80€\n🏛️ Fes Cultural — 2 days · 120€\n👨‍👩‍👧 Family Explorer — 5 days · 350€\n💙 Chefchaouen — 2 days · 100€\n\nReply *contact* to book any tour!`,
        price: `💶 *Prices:*\n\n• Sahara Desert → 200€\n• Marrakech → 80€\n• Fes Cultural → 120€\n• Family Package → 350€\n• Chefchaouen → 100€\n\n_All prices per person. Contact us for group rates._`,
        booking: `📅 *How to Book:*\n\n1️⃣ Choose your tour\n2️⃣ Tell us your travel dates\n3️⃣ Confirm number of guests\n4️⃣ Pay deposit (30%)\n5️⃣ Receive confirmation ✅\n\nContact us to start: +212 600 000 000`,
        order: `📦 *Check Order*\n\nPlease send your order number:\n\nExample: \`order 1254\``,
        contact: `📞 *Contact Us:*\n\n• WhatsApp: +212 600 000 000\n• Email: info@basmatravel.com\n• Hours: 9:00 – 20:00 (GMT+1)\n\nWe reply within 1 hour! 🙏`,
        faq: `❓ *FAQ:*\n\n*Can I cancel?* Yes, 7+ days = full refund.\n*Visa needed?* Most EU/US citizens don't need one.\n*Group discounts?* Yes! Ask our team.\n*What's included?* Varies by tour — always includes guide.`,
    };

    const text = responses[id];
    if (text) {
        await wa.sendText(to, text);
    }

    // Always follow up with the list again
    await sendMainList(to);
}

// ── MAIN ENTRY ────────────────────────────────────────────────────────────────
async function handleIncomingMessage(message, contact) {
    const phone = message.from;
    const name = contact?.profile?.name || "";

    saveUser(phone, name);

    try {
        await markRead(message.id);
    } catch { /* non-critical */ }

    console.log(`📨  [${phone}] type="${message.type}"`);

    // Button tap
    if (message.type === "interactive" && message.interactive?.type === "button_reply") {
        return handleAction(phone, message.interactive.button_reply.id);
    }

    // List row tap
    if (message.type === "interactive" && message.interactive?.type === "list_reply") {
        return handleAction(phone, message.interactive.list_reply.id);
    }

    // Any text message → show the list
    if (message.type === "text") {
        const text = (message.text?.body || "").toLowerCase().trim();

        // Quick text shortcuts
        if (text.includes("order") || text.includes("commande")) {
            const match = text.match(/\d{3,10}/);
            if (match) {
                await wa.sendText(phone, `📦 Looking up order #${match[0]}...\n\nPlease contact our team at +212 600 000 000 to check your order status.`);
                return sendMainList(phone);
            }
        }

        // Everything else → show the list
        return sendMainList(phone);
    }

    // Any other message type (image, audio, etc.) → show list
    return sendMainList(phone);
}

module.exports = { handleIncomingMessage };
