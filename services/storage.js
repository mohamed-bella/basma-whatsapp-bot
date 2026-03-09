/**
 * Simple JSON-based storage for orders and users.
 * No external database needed — data is persisted to JSON files.
 * Replace with MongoDB later for production scale.
 */

const fs = require("fs");
const path = require("path");

const os = require("os");

const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL;
const DATA_DIR = isVercel
    ? path.join(os.tmpdir(), "basma-bot-data")
    : path.join(__dirname, "..", "data", "store");

const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
function initFile(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
    }
}

initFile(ORDERS_FILE);
initFile(USERS_FILE);

// --- Generic read/write helpers ---

function readJSON(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
        return [];
    }
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- USER operations ---

function getUser(phone) {
    const users = readJSON(USERS_FILE);
    return users.find((u) => u.phone === phone) || null;
}

function saveUser(phone, name = "") {
    const users = readJSON(USERS_FILE);
    const existing = users.findIndex((u) => u.phone === phone);
    const now = new Date().toISOString();

    if (existing >= 0) {
        users[existing].last_message = now;
        if (name) users[existing].name = name;
    } else {
        users.push({ phone, name, last_message: now, created_at: now });
    }

    writeJSON(USERS_FILE, users);
    return getUser(phone);
}

// --- ORDER operations ---

function getOrder(orderId) {
    const orders = readJSON(ORDERS_FILE);
    return orders.find((o) => String(o.order_id) === String(orderId)) || null;
}

function saveOrder({ order_id, phone, name, product, price, status = "Confirmed", date = null }) {
    const orders = readJSON(ORDERS_FILE);
    const existing = orders.findIndex((o) => String(o.order_id) === String(order_id));
    const tourDate = date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const orderData = {
        order_id: String(order_id),
        phone,
        name,
        product,
        price,
        status,
        date: tourDate,
        created_at: new Date().toISOString(),
    };

    if (existing >= 0) {
        orders[existing] = { ...orders[existing], ...orderData };
    } else {
        orders.push(orderData);
    }

    writeJSON(ORDERS_FILE, orders);
    return getOrder(order_id);
}

function updateOrderStatus(orderId, status) {
    const orders = readJSON(ORDERS_FILE);
    const idx = orders.findIndex((o) => String(o.order_id) === String(orderId));
    if (idx >= 0) {
        orders[idx].status = status;
        writeJSON(ORDERS_FILE, orders);
        return orders[idx];
    }
    return null;
}

function getAllOrders() {
    return readJSON(ORDERS_FILE);
}

function getAllUsers() {
    return readJSON(USERS_FILE);
}

module.exports = {
    getUser,
    saveUser,
    getOrder,
    saveOrder,
    updateOrderStatus,
    getAllOrders,
    getAllUsers,
};
