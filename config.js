require("dotenv").config();

const config = {
  bot: {
    name: process.env.BOT_NAME || "Basma Travel Bot",
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
    apiSecret: process.env.API_SECRET || "change-me-in-production",
  },
  whatsapp: {
    // Official WhatsApp Business Cloud API
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v22.0",
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || "basma_verify_token",
    // Derived base URL
    get apiUrl() {
      return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    },
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 30,
  },
};

module.exports = config;
