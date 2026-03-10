require("dotenv").config();

const path = require("path");

// ── Load the active use case ───────────────────────────────────────────────
const USE_CASE = process.env.USE_CASE || "morocco-travel";
const useCasePath = path.join(__dirname, "use-cases", USE_CASE);

let useCase;
try {
  useCase = require(useCasePath);
} catch (err) {
  console.error(`\n❌ Use case "${USE_CASE}" not found at: ${useCasePath}`);
  console.error(`   Available use cases are in the use-cases/ folder.`);
  console.error(`   Set USE_CASE in your .env file.\n`);
  process.exit(1);
}

const config = {
  useCase,
  bot: {
    name: useCase.name || process.env.BOT_NAME || "WhatsApp Bot",
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
    apiSecret: process.env.API_SECRET || "change-me-in-production",
  },
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v22.0",
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || "basma_verify_token",
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
