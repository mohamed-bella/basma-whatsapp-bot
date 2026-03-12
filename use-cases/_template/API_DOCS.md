# 📝 Template — API Documentation

Copy this folder to create a new use case. This file documents how to interact with the bot's API.

---

## 🔐 Authentication

All requests require the `x-api-key` header:
```
x-api-key: basma_api_secret_2024
```

---

## 📡 Base URL
```
http://77.42.43.52:3000/api
```

---

## Endpoints

### 1. Send Order Confirmation
```
POST /api/send-order-message
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phone` | string | ✅ | Phone with country code |
| `name` | string | ✅ | Customer name |
| `order_id` | string | ✅ | Order ID |
| `product` | string | ✅ | Product/item name |
| `price` | string | ✅ | Price string |
| `date` | string | ❌ | Date string |
| `image_url` | string | ❌ | Image URL |
| `contact` | string | ❌ | Contact number |
| `contact_name` | string | ❌ | Contact name |

### 2. Send Custom Message
```
POST /api/send-message
```

| Parameter | Type | Required |
|-----------|------|----------|
| `phone` | string | ✅ |
| `message` | string | ✅* |
| `image_url` | string | ❌ |
| `contact` | string | ❌ |
| `contact_name` | string | ❌ |

### 3. Get Order
```
GET /api/orders/:id
```

### 4. List All Orders
```
GET /api/orders
```

### 5. Update Order Status
```
PATCH /api/orders/:id/status
```

| Parameter | Type | Required |
|-----------|------|----------|
| `status` | string | ✅ |
| `notify` | boolean | ❌ |

### 6. List All Users
```
GET /api/users
```

### 7. IPTV Contact (From WordPress)
```
POST /api/iptv-contact
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ | User's full name |
| `phone` | string | ✅ | User's WhatsApp number |
| `email` | string | ❌ | User's email address |

### 8. Health Check (No Auth)
```
GET /api/health
```
