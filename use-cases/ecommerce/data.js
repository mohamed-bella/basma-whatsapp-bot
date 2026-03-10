/**
 * E-Commerce — Use Case Data
 * Product categories, FAQ answers, and keyword triggers for online stores.
 */

const FAQ = {
    shipping: `📦 *Shipping Information*\n\n• Standard delivery: 3-5 business days\n• Express delivery: 1-2 business days\n• Free shipping on orders over 500 MAD\n\nYou'll receive a tracking number once shipped.`,
    returns: `🔄 *Returns & Exchanges*\n\n• 14-day return window from delivery\n• Item must be unused and in original packaging\n• Free returns on defective items\n• Refund processed within 5 business days\n\nTo start a return, reply *return* or contact us.`,
    payment: `💳 *Payment Methods*\n\n• Credit/Debit Card (Visa, Mastercard)\n• Cash on Delivery (COD)\n• Bank Transfer\n• PayPal\n\nAll payments are secure and encrypted. 🔒`,
    contact: `📞 *Customer Support*\n\nReach us anytime:\n\n• WhatsApp: This chat!\n• Email: support@yourstore.com\n• Phone: +212 XXX XXX XXX\n• Hours: 9:00 – 21:00 (Mon-Sat)\n\nWe typically reply within 30 minutes! 💬`,
    tracking: `🔍 *Track Your Order*\n\nTo track your order:\n1️⃣ Type *order* followed by your order number\n2️⃣ Example: *order 5678*\n\nYou can also check your email for the tracking link.`,
};

const KEYWORDS = {
    greetings: ["hi", "hello", "hey", "bonjour", "salam", "مرحبا", "السلام عليكم", "good morning", "good evening"],
    menu: ["menu", "help", "start", "options", "مساعدة"],
    order: ["order", "commande", "طلب", "track", "tracking", "suivi"],
    shipping: ["shipping", "delivery", "livraison", "شحن", "توصيل", "when", "arrive"],
    returns: ["return", "exchange", "refund", "retour", "إرجاع", "استرجاع"],
    payment: ["pay", "payment", "payer", "دفع", "card", "cod"],
    contact: ["contact", "support", "agent", "help", "phone", "email", "اتصال"],
    products: ["product", "products", "shop", "store", "buy", "منتج", "شراء"],
    cancel: ["cancel", "annuler", "إلغاء"],
};

module.exports = { FAQ, KEYWORDS };
