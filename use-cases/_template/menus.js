/**
 * _template — Menu Templates
 * Replace these with your project-specific menu text.
 */

const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━";
const THIN_DIV = "─────────────────────";

function mainMenu() {
    return `🤖 *My Bot Name*

${DIVIDER}
*How can I help you?*

1️⃣  📦  Track Order
2️⃣  📞  Contact Us
${DIVIDER}
_Reply with a number_`;
}

function orderPrompt() {
    return `📦 *Track Your Order*

${THIN_DIV}
Please send your *order number*.
${THIN_DIV}
_Type *0* to go back_`;
}

function orderStatus(order) {
    return `📦 *Order #${order.order_id}*

${THIN_DIV}
*Status:* ${order.status}
*Item:* ${order.product}
*Price:* ${order.price}
${THIN_DIV}
_Type *0* for main menu_`;
}

function greeting(name = "") {
    return `👋 *Hello${name ? ` ${name}` : ""}!*

${mainMenu()}`;
}

function fallback() {
    return `🤔 I didn't understand that.\n\nType *menu* to see options.`;
}

module.exports = { mainMenu, orderPrompt, orderStatus, greeting, fallback };
