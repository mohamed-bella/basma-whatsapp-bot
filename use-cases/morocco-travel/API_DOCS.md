# 🌍 Morocco Travel — API Documentation

Use this API to send tour booking confirmations from your website to customers via WhatsApp.

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

### 1. Send Order Confirmation

Sends a tour booking confirmation message to the customer's WhatsApp.

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
| `phone` | string | ✅ | Customer phone with country code (e.g. `"212600000000"`) |
| `name` | string | ✅ | Customer name |
| `order_id` | string | ✅ | Your order/booking ID |
| `product` | string | ✅ | Tour name (e.g. `"Sahara Desert Tour"`) |
| `price` | string | ✅ | Price with currency (e.g. `"200€"`) |
| `date` | string | ❌ | Tour date (e.g. `"12 April 2025"`) |
| `image_url` | string | ❌ | URL of an image to send (e.g., ticket/voucher) |
| `contact` | string | ❌ | WhatsApp number to share as a contact card |
| `contact_name` | string | ❌ | Name for the shared contact card |

**Example Request (JavaScript):**
```javascript
fetch("http://77.42.43.52:3000/api/send-order-message", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        phone: "212600000000",
        name: "Ahmed",
        order_id: "1254",
        product: "Sahara Desert Tour",
        price: "200€",
        date: "12 April 2025"
    })
});
```

**Example Request (cURL):**
```bash
curl -X POST http://77.42.43.52:3000/api/send-order-message \
  -H "Content-Type: application/json" \
  -H "x-api-key: basma_api_secret_2024" \
  -d '{
    "phone": "212600000000",
    "name": "Ahmed",
    "order_id": "1254",
    "product": "Sahara Desert Tour",
    "price": "200€",
    "date": "12 April 2025"
  }'
```

**Success Response:**
```json
{
    "success": true,
    "message": "Order confirmation sent.",
    "order": {
        "order_id": "1254",
        "phone": "212600000000",
        "name": "Ahmed",
        "product": "Sahara Desert Tour",
        "price": "200€",
        "status": "Confirmed",
        "date": "12 April 2025"
    }
}
```

---

### 2. Send Custom Message

Sends any text message to a WhatsApp number.

```
POST /api/send-message
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phone` | string | ✅ | Phone number with country code |
| `message` | string | ✅*| Message text (supports WhatsApp markdown) *Required if no image_url/contact |
| `image_url` | string | ❌ | URL of an image to send. If provided, `message` becomes the caption. |
| `contact` | string | ❌ | WhatsApp number to share as a contact card |
| `contact_name` | string | ❌ | Name for the shared contact card |

**Example:**
```javascript
fetch("http://77.42.43.52:3000/api/send-message", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        phone: "212600000000",
        message: "Your tour departs tomorrow at 9am! ✅"
    })
});
```

**Example (Sending an Image/Ticket):**
```javascript
fetch("http://77.42.43.52:3000/api/send-message", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        phone: "212600000000",
        message: "Here is your tour voucher! 🚌",
        image_url: "https://example.com/voucher.jpg"
    })
});
```

**Example (Sending a Contact):**
```javascript
fetch("http://77.42.43.52:3000/api/send-message", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        phone: "212600000000",
        contact: "212699887766",
        contact_name: "Hassan Guide"
    })
});
```

---

### 3. Get Order by ID

```
GET /api/orders/:id
```

**Example:** `GET /api/orders/1254`

**Response:**
```json
{
    "success": true,
    "order": {
        "order_id": "1254",
        "phone": "212600000000",
        "name": "Ahmed",
        "product": "Sahara Desert Tour",
        "price": "200€",
        "status": "Confirmed",
        "date": "12 April 2025"
    }
}
```

---

### 4. List All Orders

```
GET /api/orders
```

---

### 5. Update Order Status

```
PATCH /api/orders/:id/status
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ✅ | `Confirmed`, `Pending`, `Cancelled`, or `Completed` |
| `notify` | boolean | ❌ | If `true`, sends a WhatsApp notification to the customer |

**Example:**
```javascript
fetch("http://77.42.43.52:3000/api/orders/1254/status", {
    method: "PATCH",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": "basma_api_secret_2024"
    },
    body: JSON.stringify({
        status: "Confirmed",
        notify: true
    })
});
```

---

### 6. List All Users

```
GET /api/users
```

---

### 7. Health Check (No Auth Required)

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
| `503` | WhatsApp socket not connected |

---

## 🌐 Website Integration (HTML Snippet)

Copy-paste this into your booking confirmation page:

```html
<script>
async function sendBookingToWhatsApp(orderData) {
    const response = await fetch("http://YOUR_SERVER:3000/api/send-order-message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": "YOUR_API_SECRET"
        },
        body: JSON.stringify({
            phone: orderData.phone,
            name: orderData.name,
            order_id: orderData.orderId,
            product: orderData.tourName,
            price: orderData.price,
            date: orderData.date
        })
    });
    const result = await response.json();
    console.log("WhatsApp sent:", result);
}
</script>
```
