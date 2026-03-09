/**
 * Menu Functions — Official WhatsApp Cloud API
 * Uses real interactive buttons and list messages (fully supported by Meta API).
 */

const wa = require("../services/whatsappApi");
const { FAQ } = require("../data/botData");

const FOOTER = "Basma Morocco Travel 🌍";

// ── MAIN MENU (List Message — 9 options) ──────────────────────────────────────
async function mainMenu(to) {
    return wa.sendList(to, {
        header: "🌍 Basma Morocco Travel",
        body: "Welcome! How can I help you today?\nChoose an option below 👇",
        footer: FOOTER,
        buttonText: "View Options",
        sections: [
            {
                title: "📋 Our Services",
                rows: [
                    { id: "tours", title: "🗺️ Tour Packages", description: "Browse all our Morocco tours" },
                    { id: "price", title: "💶 Prices & Offers", description: "View pricing for all tours" },
                    { id: "booking", title: "📅 How to Book", description: "Reservation process explained" },
                ],
            },
            {
                title: "🔍 My Order",
                rows: [
                    { id: "check_order", title: "📦 Check Order", description: "Track your confirmed booking" },
                ],
            },
            {
                title: "ℹ️ Info & Support",
                rows: [
                    { id: "contact", title: "📞 Contact Agent", description: "Talk to our team directly" },
                    { id: "location", title: "📍 Destinations", description: "Cities & destinations covered" },
                    { id: "payment", title: "💳 Payment Methods", description: "How to pay for your tour" },
                    { id: "cancel", title: "🔄 Cancellation", description: "Refund & cancellation policy" },
                    { id: "visa", title: "🛂 Visa Info", description: "Entry requirements for Morocco" },
                ],
            },
        ],
    });
}

// ── GREETING + MAIN MENU ──────────────────────────────────────────────────────
async function greeting(to, name = "") {
    const nameStr = name ? `, ${name}` : "";
    await wa.sendText(to,
        `👋 *Marhaba${nameStr}! Welcome to Basma Morocco Travel.*\n\n` +
        `I'm your virtual travel assistant 🌍\n` +
        `I'll help you find the perfect Morocco tour.`
    );
    return mainMenu(to);
}

// ── TOUR LIST (List Message — 5 tours) ───────────────────────────────────────
async function toursList(to) {
    return wa.sendList(to, {
        header: "🗺️ Morocco Tour Packages",
        body: "Tap any tour to see full details, pricing and inclusions.",
        footer: "All prices per person",
        buttonText: "View Tours",
        sections: [
            {
                title: "🏜️ Available Tours",
                rows: [
                    { id: "tour_1", title: "🏜️ Sahara Desert", description: "3 days · 200€ · Camel ride + overnight camp" },
                    { id: "tour_2", title: "🕌 Marrakech City", description: "1 day · 80€ · Medina, souks & palace" },
                    { id: "tour_3", title: "🏛️ Fes Cultural", description: "2 days · 120€ · Ancient Medina & tanneries" },
                    { id: "tour_4", title: "👨‍👩‍👧 Family Explorer", description: "5 days · 350€ · Complete family adventure" },
                    { id: "tour_5", title: "💙 Chefchaouen", description: "2 days · 100€ · The blue mountain city" },
                ],
            },
        ],
    });
}

// ── TOUR DETAILS + BUTTONS ────────────────────────────────────────────────────
const TOUR_DATA = {
    tour_1: { emoji: "🏜️", name: "Sahara Desert Tour", price: "200€", duration: "3 days / 2 nights", about: "Ride camels into the Erg Chebbi dunes, sleep in a luxury Berber camp under the stars near Merzouga, and watch the sunrise over the Sahara.", includes: "🚌 Transport · 🏕️ Desert camp · 🍽️ Meals · 🐪 Camel ride · 🧭 Guide" },
    tour_2: { emoji: "🕌", name: "Marrakech City Tour", price: "80€", duration: "1 full day", about: "Explore Djemaa el-Fna square, vibrant souks, Bahia Palace and Saadian Tombs. Taste authentic Moroccan street food with an expert guide.", includes: "🚶 Guided walk · 🍜 Lunch · 🚌 Transport" },
    tour_3: { emoji: "🏛️", name: "Fes Cultural Tour", price: "120€", duration: "2 days / 1 night", about: "Discover Fes el-Bali, the world's oldest living medieval city. Visit the leather tanneries, Bou Inania Madrasa and Al-Qarawiyyin University.", includes: "🏨 Hotel · 🍳 Breakfast · 🧭 Expert guide" },
    tour_4: { emoji: "👨‍👩‍👧", name: "Family Morocco Explorer", price: "350€", duration: "5 days / 4 nights", about: "The ultimate family adventure — Marrakech souks, Atlas Mountains, Sahara Desert, and the magical blue city of Chefchaouen.", includes: "🚌 Transport · 🏨 Hotels · 🍽️ All meals · 🎯 Activities · 🧭 Guide" },
    tour_5: { emoji: "💙", name: "Chefchaouen Blue City", price: "100€", duration: "2 days / 1 night", about: "Lose yourself in the magical blue-painted streets of Chefchaouen in the Rif Mountains. A photographer's paradise with peaceful mountain air.", includes: "🚌 Transport · 🏨 Boutique hotel · 🍳 Breakfast" },
};

async function tourDetail(to, tourId) {
    const t = TOUR_DATA[tourId];
    if (!t) return toursList(to);

    const body =
        `${t.emoji} *${t.name}*\n\n` +
        `⏱️ *Duration:* ${t.duration}\n` +
        `💶 *Price:* ${t.price} per person\n\n` +
        `📝 *About:*\n${t.about}\n\n` +
        `✅ *Included:*\n${t.includes}`;

    return wa.sendButtons(to, {
        header: `${t.emoji} ${t.name}`,
        body,
        footer: FOOTER,
        buttons: [
            { id: "booking", title: "📅 Book This Tour" },
            { id: "contact", title: "📞 Ask a Question" },
            { id: "tours", title: "⬅️ All Tours" },
        ],
    });
}

// ── ORDER PROMPT ──────────────────────────────────────────────────────────────
async function orderPrompt(to) {
    return wa.sendButtons(to, {
        header: "📦 Check Order Status",
        body: "Please send your *order number*.\n\nExample: reply with just the number:\n`1254`",
        footer: FOOTER,
        buttons: [
            { id: "contact", title: "📞 Talk to Agent" },
            { id: "menu", title: "🏠 Main Menu" },
        ],
    });
}

// ── ORDER STATUS ──────────────────────────────────────────────────────────────
async function orderStatus(to, order) {
    const statusEmoji = { Confirmed: "✅", Pending: "⏳", Cancelled: "❌", Completed: "🏁" };
    const emoji = statusEmoji[order.status] || "📋";

    const body =
        `📦 *Order #${order.order_id}*\n\n` +
        `${emoji} *Status:* ${order.status}\n` +
        `🏷️ *Tour:* ${order.product}\n` +
        `📅 *Date:* ${order.date}\n` +
        `💶 *Price:* ${order.price}\n` +
        `👤 *Name:* ${order.name}`;

    return wa.sendButtons(to, {
        header: `Order #${order.order_id}`,
        body,
        footer: "Need help? Tap Contact Agent",
        buttons: [
            { id: "contact", title: "📞 Contact Agent" },
            { id: "tours", title: "🗺️ Browse Tours" },
            { id: "menu", title: "🏠 Main Menu" },
        ],
    });
}

// ── ORDER NOT FOUND ───────────────────────────────────────────────────────────
async function orderNotFound(to, orderId) {
    return wa.sendButtons(to, {
        header: "❓ Order Not Found",
        body: `Order *#${orderId}* was not found.\n\nPlease check the number and try again, or contact our team.`,
        footer: FOOTER,
        buttons: [
            { id: "contact", title: "📞 Contact Agent" },
            { id: "check_order", title: "🔁 Try Again" },
            { id: "menu", title: "🏠 Main Menu" },
        ],
    });
}

// ── FAQ + NAV BUTTONS ─────────────────────────────────────────────────────────
async function faq(to, faqKey) {
    const text = FAQ[faqKey];
    if (!text) return mainMenu(to);

    return wa.sendButtons(to, {
        body: text,
        footer: FOOTER,
        buttons: [
            { id: "tours", title: "🗺️ See Tours" },
            { id: "booking", title: "📅 How to Book" },
            { id: "menu", title: "🏠 Main Menu" },
        ],
    });
}

// ── FALLBACK ──────────────────────────────────────────────────────────────────
async function fallback(to) {
    return wa.sendButtons(to, {
        body:
            "🤔 I didn't understand that.\n\n" +
            "You can also type keywords:\n" +
            "*tours* · *price* · *book* · *contact*",
        footer: FOOTER,
        buttons: [
            { id: "tours", title: "🗺️ Tour Packages" },
            { id: "menu", title: "📋 Main Menu" },
            { id: "contact", title: "📞 Contact Agent" },
        ],
    });
}

module.exports = {
    mainMenu,
    greeting,
    toursList,
    tourDetail,
    orderPrompt,
    orderStatus,
    orderNotFound,
    faq,
    fallback,
    TOUR_DATA,
};
