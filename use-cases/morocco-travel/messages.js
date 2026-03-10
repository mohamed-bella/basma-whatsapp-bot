/**
 * Morocco Travel — Message Templates
 * Order confirmations and notification messages.
 */

function orderConfirmation({ name, order_id, product, price, date }) {
    return `✅ *Order Confirmed!*

Hello ${name} 👋

Your order has been successfully placed.

━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* #${order_id}
🏷️ *Tour:* ${product}
📅 *Date:* ${date || "To be confirmed"}
💶 *Price:* ${price}
━━━━━━━━━━━━━━━━━━━━

Our team will contact you within 24 hours to confirm all details.

Questions? Reply *contact* to reach us directly.

Thank you for choosing *Basma Morocco Travel* 🌍`;
}

function orderStatusUpdate(order, status) {
    const msgs = {
        Confirmed: `✅ Great news! Order #${order.order_id} is *confirmed*.`,
        Cancelled: `❌ Order #${order.order_id} has been *cancelled*.`,
        Completed: `🏁 Your tour (Order #${order.order_id}) is now *completed*. Thank you!`,
        Pending: `⏳ Order #${order.order_id} is now *pending*. We'll update you soon.`,
    };
    return msgs[status] || `📋 Order #${order.order_id} status updated to *${status}*.`;
}

module.exports = { orderConfirmation, orderStatusUpdate };
