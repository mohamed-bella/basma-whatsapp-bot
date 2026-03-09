# 🤖 Basma WhatsApp Bot

**Morocco Travel Service — WhatsApp Automation Bot**

Built with [Baileys](https://github.com/WhiskeySockets/Baileys) + Node.js + Express.js

---

## 📁 Project Structure

```
BASMA_BOT_WHATSAPP/
│
├── index.js                  ← Main entry point
├── config.js                 ← App configuration (reads .env)
├── .env.example              ← Environment variable template
│
├── data/
│   ├── botData.js            ← Tour packages, FAQ answers, keywords
│   └── store/                ← Auto-created: orders.json, users.json
│
├── handlers/
│   ├── messages.js           ← WhatsApp message router (keyword → response)
│   └── orders.js             ← Order confirmation sender
│
├── services/
│   ├── whatsapp.js           ← Baileys connection, QR code, reconnect
│   └── storage.js            ← JSON file-based data storage
│
├── routes/
│   └── api.js                ← Express REST API endpoints
│
└── sessions/                 ← Auto-created: WhatsApp session files
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
copy .env.example .env
```
Edit `.env` and set your `API_SECRET` to a strong random string.

### 3. Start the bot
```bash
npm start
```

### 4. Scan QR code
A QR code will appear in the terminal. Open WhatsApp on your phone:
> **Settings → Linked Devices → Link a Device**

Scan the QR code. The bot is now active! ✅

---

## 💬 Bot Commands (User-facing)

| Input | Response |
|-------|----------|
| `hi` / `hello` / `salam` | Welcome greeting + menu |
| `menu` / `help` | Full options menu |
| `1` | Tour packages list |
| `2` | Ask for order number |
| `3` | Prices |
| `4` | Contact agent |
| `5` | How to book |
| `tours` | All tour packages |
| `order 1254` | Order status for #1254 |
| `price` | Pricing information |
| `book` | Booking instructions |
| `contact` | Agent contact details |
| `location` | Destinations covered |
| `payment` | Payment methods |
| `cancel` | Cancellation policy |
| `visa` | Visa requirements |

---

## 🌐 REST API

All endpoints require the `x-api-key` header set to your `API_SECRET`.

### Health Check
```
GET http://localhost:3000/api/health
```

### Send Order Confirmation (from your website)
```
POST http://localhost:3000/api/send-order-message
x-api-key: your-secret-key

{
  "phone": "212600000000",
  "name": "Ahmed",
  "order_id": "1254",
  "product": "Desert Tour",
  "price": "200€",
  "date": "12 April 2025"
}
```

### Send Custom Message
```
POST http://localhost:3000/api/send-message
x-api-key: your-secret-key

{
  "phone": "212600000000",
  "message": "Your tour departs tomorrow at 9am. ✅"
}
```

### Get Order
```
GET http://localhost:3000/api/orders/1254
x-api-key: your-secret-key
```

### List All Orders
```
GET http://localhost:3000/api/orders
x-api-key: your-secret-key
```

### Update Order Status + Notify Customer
```
PATCH http://localhost:3000/api/orders/1254/status
x-api-key: your-secret-key

{
  "status": "Confirmed",
  "notify": true
}
```
Valid statuses: `Confirmed`, `Pending`, `Cancelled`, `Completed`

### List All Users
```
GET http://localhost:3000/api/users
x-api-key: your-secret-key
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_NAME` | `Basma Travel Bot` | Bot display name |
| `PORT` | `3000` | API server port |
| `API_SECRET` | `change-me` | Secret key for API authentication |
| `SESSION_DIR` | `./sessions` | Where WhatsApp session is saved |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `10` | Max requests per window |

---

## 🔄 Reconnection

If the bot disconnects, it automatically reconnects every 3 seconds.

If it shows `Logged out`, delete the `sessions/` folder and restart:
```bash
rm -rf sessions/
npm start
```

---

## 🚀 Production Deployment

### VPS / Cloud Server (Ubuntu)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and install
git clone <your-repo>
cd BASMA_BOT_WHATSAPP
npm install --production

# Run with PM2 (process manager)
npm install -g pm2
pm2 start index.js --name basma-bot
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
```

---

## 🔒 Security Notes

- Never commit `.env` to Git (it's in `.gitignore`)
- Use a strong `API_SECRET` in production
- Rate limiting is enabled by default
- Avoid bulk messaging to prevent WhatsApp account bans
- Keep session files secure — they contain your WhatsApp auth tokens

---

## 📊 Data Storage

Orders and users are stored as JSON files in `data/store/`:
- `data/store/orders.json`
- `data/store/users.json`

To migrate to MongoDB later, only `services/storage.js` needs to be updated.

---

## 🛠️ Customization

To add new keywords or responses, edit `data/botData.js`:
- `TOURS` — Add/modify tour packages
- `FAQ` — Edit FAQ answers  
- `KEYWORDS` — Add trigger words

To add new message routes, edit `handlers/messages.js`.
