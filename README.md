# 🤖 WhatsApp Bot — Multi-Project Framework

A scalable WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys) + Node.js + Express.js.

**One bot, many projects.** Just create a use case folder and you're ready to go.

---

## 📁 Project Structure

```
├── index.js                  ← Entry point
├── config.js                 ← Config (loads USE_CASE from .env)
├── .env / .env.example       ← Environment variables
│
├── use-cases/
│   ├── morocco-travel/       ← Travel booking use case
│   │   ├── index.js          ← Use case config
│   │   ├── data.js           ← Tours, FAQ, keywords
│   │   ├── menus.js          ← Menu templates
│   │   ├── messages.js       ← Message templates
│   │   └── API_DOCS.md       ← Full API docs for this use case
│   │
│   ├── ecommerce/            ← E-commerce / online store use case
│   │   ├── index.js
│   │   ├── data.js
│   │   ├── menus.js
│   │   ├── messages.js
│   │   └── API_DOCS.md
│   │
│   └── _template/            ← Copy this to create a new use case
│       ├── index.js
│       ├── data.js
│       ├── menus.js
│       ├── messages.js
│       └── API_DOCS.md
│
├── handlers/
│   ├── messages.js           ← Generic message router
│   └── orders.js             ← Order confirmation handler
│
├── services/
│   ├── whatsapp.js           ← Baileys connection & QR
│   ├── session.js            ← Conversation state manager
│   └── storage.js            ← JSON file storage
│
├── routes/
│   └── api.js                ← REST API endpoints
│
├── data/store/               ← Auto-created: orders.json, users.json
└── sessions/                 ← Auto-created: WhatsApp session
```

---

## ⚡ Quick Start

### 1. Install
```bash
npm install
```

### 2. Configure
```bash
copy .env.example .env
```
Edit `.env`:
- Set `USE_CASE` to your use case folder name (e.g. `morocco-travel` or `ecommerce`)
- Set `API_SECRET` to a strong random string

### 3. Start
```bash
npm start
```

### 4. Scan QR
A QR code appears in the terminal. Scan it with WhatsApp:
> **Settings → Linked Devices → Link a Device**

---

## 🔄 Switching Use Cases

Just change one line in `.env`:

```ini
# For travel bookings:
USE_CASE=morocco-travel

# For e-commerce:
USE_CASE=ecommerce
```

Then restart the bot.

---

## 🆕 Creating a New Use Case

1. Copy the template:
   ```bash
   cp -r use-cases/_template use-cases/my-project
   ```

2. Edit the files in `use-cases/my-project/`:
   - `data.js` — Your keywords and FAQ answers
   - `menus.js` — Your WhatsApp menu text
   - `messages.js` — Your notification message templates
   - `index.js` — Your bot name and config
   - `API_DOCS.md` — Your API documentation

3. Set in `.env`:
   ```ini
   USE_CASE=my-project
   ```

4. Restart — done! 🎉

---

## 📡 API Documentation

Each use case has its own `API_DOCS.md` with full endpoint documentation, parameters, and code examples (JavaScript, PHP, Python, cURL).

See:
- `use-cases/morocco-travel/API_DOCS.md`
- `use-cases/ecommerce/API_DOCS.md`

### Quick API Summary

All endpoints use `http://YOUR_SERVER:3000/api` and require `x-api-key` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (no auth) |
| `GET` | `/api/qr` | Get QR code for WhatsApp login |
| `POST` | `/api/send-order-message` | Send order confirmation via WhatsApp |
| `POST` | `/api/send-message` | Send custom message |
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | Get single order |
| `PATCH` | `/api/orders/:id/status` | Update order status + notify |
| `GET` | `/api/users` | List all users |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_CASE` | `morocco-travel` | Which use case folder to load |
| `BOT_NAME` | _(from use case)_ | Bot display name (override) |
| `PORT` | `3000` | API server port |
| `API_SECRET` | `change-me` | API authentication key |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `30` | Max requests per window |

---

## 🔒 Security

- Never commit `.env` to Git
- Use a strong `API_SECRET` in production
- Keep `sessions/` folder secure — it contains WhatsApp auth tokens
- Avoid bulk messaging to prevent WhatsApp bans

---

## 🚀 Production

```bash
npm install -g pm2
pm2 start index.js --name my-bot
pm2 save
pm2 startup
```
