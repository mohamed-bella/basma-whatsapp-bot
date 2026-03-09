/**
 * Orders Handler
 * Sends order confirmation/notification messages from the API.
 */

const { saveOrder, getOrder } = require("../services/storage");

/**
 * Formats the order confirmation message sent to the customer.
 */
function buildOrderConfirmationMessage({ name, order_id, product, price, date }) {
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

/**
 * Sends an order confirmation WhatsApp message and stores the order.
 */
async function sendOrderConfirmation(sock, { phone, name, order_id, product, price, date }) {
    // Normalize phone number to WhatsApp JID
    // Remove any + or spaces, ensure it has country code
    const cleanPhone = phone.replace(/\D/g, "");
    const jid = `${cleanPhone}@s.whatsapp.net`;

    // Persist order to storage
    const order = saveOrder({ order_id, phone: cleanPhone, name, product, price, date });

    // Send WhatsApp message
    const message = buildOrderConfirmationMessage({ name, order_id, product, price, date: order.date });
    await sock.sendMessage(jid, { text: message });

    console.log(`📨  Order confirmation sent → ${cleanPhone} (Order #${order_id})`);
    return order;
}

/**
 * Sends a custom text message to a phone number.
 */
async function sendCustomMessage(sock, phone, text) {
    const cleanPhone = phone.replace(/\D/g, "");
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
    console.log(`📨  Custom message sent → ${cleanPhone}`);
}

module.exports = { sendOrderConfirmation, sendCustomMessage, buildOrderConfirmationMessage };
