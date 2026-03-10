/**
 * Orders Handler
 * Sends order confirmation/notification messages using the active use case templates.
 */

const config = require("../config");
const { saveOrder, getOrder } = require("../services/storage");

/**
 * Sends an order confirmation WhatsApp message and stores the order.
 */
async function sendOrderConfirmation(sock, { phone, name, order_id, product, price, date }) {
    const cleanPhone = phone.replace(/\D/g, "");
    const jid = `${cleanPhone}@s.whatsapp.net`;

    // Persist order to storage
    const order = saveOrder({ order_id, phone: cleanPhone, name, product, price, date });

    // Build message from use case template
    const message = config.useCase.messages.orderConfirmation({
        name,
        order_id,
        product,
        price,
        date: order.date,
    });

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

/**
 * Sends an order status update notification.
 */
async function sendStatusNotification(sock, order, status) {
    if (!order.phone) return;
    const jid = `${order.phone}@s.whatsapp.net`;
    const message = config.useCase.messages.orderStatusUpdate(order, status);
    if (message) {
        await sock.sendMessage(jid, { text: message });
    }
}

module.exports = { sendOrderConfirmation, sendCustomMessage, sendStatusNotification };
