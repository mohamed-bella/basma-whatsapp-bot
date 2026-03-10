# 🛒 E-Commerce — API Documentation

Use this API to send order confirmations, shipping updates, and support messages from your online store to customers via WhatsApp.

---

## 🔐 Authentication

All API requests require the `x-api-key` header:

```
x-api-key: basma_api_secret_2024
```

Set `API_SECRET` in your `.env` file.

---

## 📡 Base URL

```
http://77.42.43.52:3000/api
```

---

## Endpoints

### 1. ✅ Send Order Confirmation

Sends an order confirmation to the customer when they complete a purchase.

```
POST /api/send-order-message
```

**Headers:**
| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `x-api-key` | `basma_api_secret_2024` |

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phone` | string | ✅ | Customer phone with country code (e.g. `"212600123456"`) |
| `name` | string | ✅ | Customer name |
| `order_id` | string | ✅ | Your store's order ID (e.g. `"ORD-5678"`) |
| `product` | string | ✅ | Product/item name (e.g. `"Nike Air Max 90"`) |
| `price` | string | ✅ | Total price (e.g. `"499 MAD"`) |
| `date` | string | ❌ | Order date (auto-filled if omitted) |
| `image_url` | string | ❌ | URL of an image to send with the confirmation |
| `contact` | string | ❌ | WhatsApp number to share as a contact card |
| `contact_name` | string | ❌ | Name for the shared contact card |

**Example — JavaScript (from your checkout page):**
```javascript
// Call this after successful checkout
async function notifyCustomerViaWhatsApp(order) {
    const response = await fetch("http://77.42.43.52:3000/api/send-order-message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": "basma_api_secret_2024"
        },
        body: JSON.stringify({
            phone: order.customerPhone,    // "212600123456"
            name: order.customerName,      // "Fatima"
            order_id: order.id,            // "ORD-5678"
            product: order.itemName,       // "Nike Air Max 90"
            price: order.total,            // "499 MAD"
            date: order.date               // "10 March 2026"
        })
    });
    const result = await response.json();
    if (result.success) {
        console.log("✅ WhatsApp confirmation sent!");
    }
}
```

**Example — PHP (WooCommerce / Laravel):**
```php
$response = Http::withHeaders([
    'x-api-key' => 'basma_api_secret_2024',
])->post('http://77.42.43.52:3000/api/send-order-message', [
    'phone'    => $order->phone,
    'name'     => $order->customer_name,
    'order_id' => $order->id,
    'product'  => $order->product_name,
    'price'    => $order->total . ' MAD',
    'date'     => $order->created_at->format('d F Y'),
]);
```

**Example — Python (Django / Flask):**
```python
import requests

requests.post("http://77.42.43.52:3000/api/send-order-message",
    headers={"x-api-key": "basma_api_secret_2024"},
    json={
        "phone": "212600123456",
        "name": "Fatima",
        "order_id": "ORD-5678",
        "product": "Nike Air Max 90",
        "price": "499 MAD",
        "date": "10 March 2026"
    }
)
```

**Example — cURL:**
```bash
curl -X POST http://77.42.43.52:3000/api/send-order-message \
  -H "Content-Type: application/json" \
  -H "x-api-key: basma_api_secret_2024" \
  -d '{
    "phone": "212600123456",
    "name": "Fatima",
    "order_id": "ORD-5678",
    "product": "Nike Air Max 90",
    "price": "499 MAD",
    "date": "10 March 2026"
  }'
```

**Success Response:**
```json
{
    "success": true,
    "message": "Order confirmation sent.",
    "order": {
        "order_id": "ORD-5678",
        "phone": "212600123456",
        "name": "Fatima",
        "product": "Nike Air Max 90",
        "price": "499 MAD",
        "status": "Confirmed",
        "date": "10 March 2026"
    }
}
```

---

### 2. 📨 Send Custom Message

Send any text message (shipping update, promo, etc.) to a customer.

```
POST /api/send-message
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phone` | string | ✅ | Phone number with country code |
| `message` | string | ✅*| Message text (supports WhatsApp markdown) *Required if no image_url/contact |
| `image_url` | string | ❌ | URL of an image to send. If provided, `message` becomes the image caption. |
| `contact` | string | ❌ | WhatsApp number to share as a contact card |
| `contact_name` | string | ❌ | Name for the shared contact card |

**Example — Shipping notification:**
```javascript
fetch("http://77.42.43.52:3000/api/send-message", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        phone: "212600123456",
        message: "🚚 *Shipping Update*\n\nYour order #ORD-5678 has been shipped!\nTracking: ABC123456\n\nEstimated delivery: 2-3 days"
    })
});
```

**Example — Sending an Image:**
```javascript
fetch("http://77.42.43.52:3000/api/send-message", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        phone: "212600123456",
        message: "Here is your invoice! 🧾",
        image_url: "https://example.com/invoice-receipt.png"
    })
});
```

**Example — Sending a Contact Card:**
```javascript
fetch("http://77.42.43.52:3000/api/send-message", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        phone: "212600123456",
        contact: "212611223344",
        contact_name: "Yassine Support"
    })
});
```

---

### 3. 📦 Get Order by ID

```
GET /api/orders/:id
```

**Example:** `GET /api/orders/ORD-5678`

---

### 4. 📋 List All Orders

```
GET /api/orders
```

---

### 5. 🔄 Update Order Status + Notify Customer

Update the status and optionally send a WhatsApp notification.

```
PATCH /api/orders/:id/status
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ✅ | `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`, `Refunded` |
| `notify` | boolean | ❌ | If `true`, sends a WhatsApp status update to the customer |

**Example — Mark as shipped:**
```javascript
fetch("http://77.42.43.52:3000/api/orders/ORD-5678/status", {
    method: "PATCH",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        status: "Shipped",
        notify: true  // Customer gets: "🚚 Order #ORD-5678 has been shipped!"
    })
});
```

---

### 6. 👥 List All Users

```
GET /api/users
```

---

### 7. ❤️ Health Check (No Auth)

```
GET /api/health
```

---

## ⚠️ Error Responses

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid `x-api-key` |
| `404` | Order not found |
| `500` | Internal server error |
| `503` | WhatsApp not connected (scan QR first) |

---

## 🌐 Full Website Integration Example

### HTML Checkout Page Snippet

```html
<form id="checkout-form">
    <input name="name" placeholder="Full Name" required>
    <input name="phone" placeholder="Phone (e.g. 212600123456)" required>
    <input name="product" placeholder="Product Name" required>
    <input name="price" placeholder="Total Price" required>
    <button type="submit">Place Order</button>
</form>

<script>
document.getElementById("checkout-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    // 1. Process payment with your payment gateway...
    // 2. Save order to your database...

    // 3. Send WhatsApp confirmation:
    const orderId = "ORD-" + Date.now(); // Generate your own order ID
    
    await fetch("http://77.42.43.52:3000/api/send-order-message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": "basma_api_secret_2024"
        },
        body: JSON.stringify({
            phone: form.get("phone"),
            name: form.get("name"),
            order_id: orderId,
            product: form.get("product"),
            price: form.get("price") + " MAD"
        })
    });

    alert("✅ Order placed! Check your WhatsApp for confirmation.");
});
</script>
```

### WordPress / WooCommerce Hook

```php
// Add to your theme's functions.php or a custom plugin
add_action('woocommerce_order_status_completed', function($order_id) {
    $order = wc_get_order($order_id);
    
    wp_remote_post('http://77.42.43.52:3000/api/send-order-message', [
        'headers' => [
            'Content-Type' => 'application/json',
            'x-api-key'    => 'basma_api_secret_2024',
        ],
        'body' => json_encode([
            'phone'    => $order->get_billing_phone(),
            'name'     => $order->get_billing_first_name(),
            'order_id' => (string) $order_id,
            'product'  => implode(', ', array_map(fn($item) => $item->get_name(), $order->get_items())),
            'price'    => $order->get_total() . ' ' . $order->get_currency(),
        ]),
    ]);
});
```
