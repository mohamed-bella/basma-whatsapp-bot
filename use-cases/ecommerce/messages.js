/**
 * E-Commerce — Message Templates
 * Order confirmations, shipping updates, and notification messages.
 */

function orderConfirmation({ name, order_id, product, price, date }) {
    return `✅ *Order Confirmed!*

Hello ${name} 👋

Your order has been successfully placed!

━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* #${order_id}
🏷️ *Item:* ${product}
💰 *Total:* ${price}
📅 *Date:* ${date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
━━━━━━━━━━━━━━━━━━━━

📦 You'll receive a tracking number once your order ships.

Questions? Reply *contact* anytime.

Thank you for shopping with us! 🛍️`;
}

function shippingUpdate({ name, order_id, product, tracking_number }) {
    return `🚚 *Shipping Update*

Hello ${name} 👋

Your order *#${order_id}* (${product}) has been shipped!

📋 *Tracking Number:* ${tracking_number || "Will be sent shortly"}

You can track your package anytime by replying *order ${order_id}*.

Happy shopping! 🛍️`;
}

function deliveryConfirmation({ name, order_id, product }) {
    return `📬 *Delivered!*

Hello ${name} 👋

Your order *#${order_id}* (${product}) has been delivered!

We hope you love it! 💛

• Not satisfied? Reply *return* within 14 days.
• Love it? We'd appreciate a review! ⭐

Thank you for shopping with us! 🛍️`;
}

function orderStatusUpdate(order, status) {
    const msgs = {
        Confirmed: `✅ Your order #${order.order_id} is *confirmed* and being processed.`,
        Processing: `⚙️ Order #${order.order_id} is being *prepared* for shipping.`,
        Shipped: `🚚 Order #${order.order_id} has been *shipped*! Check your email for tracking.`,
        Delivered: `📬 Order #${order.order_id} has been *delivered*. Enjoy!`,
        Cancelled: `❌ Order #${order.order_id} has been *cancelled*.`,
        Refunded: `💰 Order #${order.order_id} has been *refunded*. Allow 5 business days.`,
        Pending: `⏳ Order #${order.order_id} is *pending*. We'll update you soon.`,
    };
    return msgs[status] || `📋 Order #${order.order_id} status updated to *${status}*.`;
}

module.exports = { orderConfirmation, shippingUpdate, deliveryConfirmation, orderStatusUpdate };
