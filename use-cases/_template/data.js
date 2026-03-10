/**
 * _template — Data (FAQ & Keywords)
 * Replace these with your project-specific data.
 */

const FAQ = {
    // Add your FAQ answers here. Each key is a topic name.
    // The value is the WhatsApp message text (supports *bold*, _italic_, etc.)
    contact: `📞 *Contact Us*\n\nReach us at:\n• WhatsApp: +XX XXX XXX\n• Email: hello@example.com`,
    // Add more topics...
};

const KEYWORDS = {
    // Each key is a topic, the value is an array of trigger words.
    // When a user sends a message containing any of these words, the bot matches it.
    greetings: ["hi", "hello", "hey"],
    menu: ["menu", "help", "start"],
    order: ["order", "track"],
    contact: ["contact", "support", "agent"],
    // Add more keyword groups...
};

module.exports = { FAQ, KEYWORDS };
