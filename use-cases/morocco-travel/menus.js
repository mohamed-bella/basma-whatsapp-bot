/**
 * Morocco Travel — Menu Templates
 * All WhatsApp menu text rendered for this use case.
 */

const { TOUR_LIST } = require("./data");

const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━";
const THIN_DIV = "─────────────────────";

function mainMenu() {
    return `🌍 *Basma Morocco Travel*
_Your trusted Morocco tour guide_

${DIVIDER}
*What can I help you with?*

1️⃣  🗺️  Tour Packages
2️⃣  📦  Check Order Status
3️⃣  💶  Prices & Offers
4️⃣  📅  How to Book
5️⃣  📞  Contact Agent
6️⃣  ℹ️  More Info
${DIVIDER}
_Reply with a number (1-6)_`;
}

function toursList() {
    const items = TOUR_LIST.map(
        (t) => `${t.key}️⃣  ${t.emoji}  *${t.name}*\n     ${t.duration} · from *${t.price}*`
    ).join("\n\n");

    return `🗺️ *Our Morocco Tour Packages*

${THIN_DIV}
${items}
${THIN_DIV}
_Reply with a number for full details_
_Or type *0* to go back to main menu_`;
}

function tourDetail(tourNum) {
    const t = TOUR_LIST.find((tour) => tour.key === tourNum);
    if (!t) return null;
    const inc = t.includes.map((i) => `  ${i}`).join("\n");
    return `${t.emoji} *${t.name}*

⏱️ *Duration:* ${t.duration}
💶 *Price:* ${t.price} per person

📝 *About:*
${t.about}

✅ *Included:*
${inc}

${THIN_DIV}
To book this tour, reply *book*
For questions, reply *contact*
To see all tours, reply *tours*
To go back, type *0*`;
}

function orderPrompt() {
    return `📦 *Check Order Status*

${THIN_DIV}
Please send your *order number*.

Example: \`1254\`
${THIN_DIV}
_Type *0* to go back_`;
}

function orderStatus(order) {
    const emoji = { Confirmed: "✅", Pending: "⏳", Cancelled: "❌", Completed: "🏁" }[order.status] || "📋";
    return `📦 *Order #${order.order_id}*

${THIN_DIV}
${emoji} *Status:* ${order.status}
🏷️ *Tour:* ${order.product}
📅 *Date:* ${order.date}
💶 *Price:* ${order.price}
👤 *Name:* ${order.name}
${THIN_DIV}
_Type *contact* to speak with our team_
_Type *0* for main menu_`;
}

function moreInfoMenu() {
    return `ℹ️ *More Information*

${THIN_DIV}
1️⃣  📍  Destinations we cover
2️⃣  💳  Payment methods
3️⃣  🔄  Cancellation policy
4️⃣  🛂  Visa requirements
${THIN_DIV}
_Reply with a number (1-4)_
_Or type *0* to go back_`;
}

function greeting(name = "") {
    return `👋 *Marhaba${name ? `, ${name}` : ""}! Welcome to Basma Morocco Travel*

I'm your virtual travel assistant 🌍
I'll help you explore our tours and check your order status.

${mainMenu()}`;
}

function fallback() {
    return `🤔 I didn't understand that.

Quick shortcuts:
• *menu* — Main menu
• *tours* — See all tours  
• *order 1254* — Check order
• *book* — How to book
• *contact* — Talk to agent

Or just type a *number* when I show you a menu 👆`;
}

module.exports = { mainMenu, toursList, tourDetail, orderPrompt, orderStatus, moreInfoMenu, greeting, fallback };
