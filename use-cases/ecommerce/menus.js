/**
 * E-Commerce — Menu Templates
 * WhatsApp menu text for online store bots.
 */

const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━";
const THIN_DIV = "─────────────────────";

function mainMenu() {
    return `🛒 *Welcome to Our Store*
_Your online shopping assistant_

${DIVIDER}
*How can I help you?*

1️⃣  📦  Track My Order
2️⃣  🚚  Shipping Info
3️⃣  🔄  Returns & Exchanges
4️⃣  💳  Payment Methods
5️⃣  📞  Contact Support
${DIVIDER}
_Reply with a number (1-5)_`;
}

function orderPrompt() {
    return `📦 *Track Your Order*

${THIN_DIV}
Please send your *order number*.

Example: \`ORD-5678\`
${THIN_DIV}
_Type *0* to go back_`;
}

function orderStatus(order) {
    const emoji = {
        Confirmed: "✅",
        Processing: "⚙️",
        Shipped: "🚚",
        Delivered: "📬",
        Pending: "⏳",
        Cancelled: "❌",
        Refunded: "💰",
    }[order.status] || "📋";

    return `📦 *Order #${order.order_id}*

${THIN_DIV}
${emoji} *Status:* ${order.status}
🏷️ *Item:* ${order.product}
💰 *Total:* ${order.price}
📅 *Date:* ${order.date}
👤 *Customer:* ${order.name}
${THIN_DIV}
_Type *contact* for support_
_Type *0* for main menu_`;
}

function greeting(name = "") {
    return `👋 *Hello${name ? ` ${name}` : ""}! Welcome to our store* 🛒

I'm your shopping assistant. I can help you:
• Track orders 📦
• Check shipping & returns 🚚
• Answer your questions 💬

${mainMenu()}`;
}

function fallback() {
    return `🤔 I didn't understand that.

Quick shortcuts:
• *menu* — Main menu
• *order ORD-5678* — Track order
• *shipping* — Delivery info
• *return* — Returns policy
• *contact* — Talk to support

Or just type a *number* when I show you a menu 👆`;
}

module.exports = { mainMenu, orderPrompt, orderStatus, greeting, fallback };
