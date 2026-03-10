/**
 * _template — Message Templates
 * Replace these with your project-specific message formats.
 */

function orderConfirmation({ name, order_id, product, price, date }) {
    return `✅ *Order Confirmed!*

Hello ${name} 👋

━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* #${order_id}
🏷️ *Item:* ${product}
💰 *Price:* ${price}
📅 *Date:* ${date || "N/A"}
━━━━━━━━━━━━━━━━━━━━

Thank you for your order!`;
}

function orderStatusUpdate(order, status) {
    return `📋 Order #${order.order_id} status: *${status}*`;
}

module.exports = { orderConfirmation, orderStatusUpdate };
