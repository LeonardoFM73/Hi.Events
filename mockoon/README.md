# Xendit Mock API dengan Mockoon

Mock API untuk Xendit payment gateway menggunakan Mockoon CLI. Mock ini digunakan untuk testing lokal menggantikan `https://api.xendit.co`.

## 📋 Fitur

- ✅ **POST /v2/invoices** - Membuat invoice baru
- ✅ **GET /v2/invoices/:invoice_id** - Mendapatkan detail invoice
- ✅ **POST /invoices/:invoice_id/expire** - Expire invoice
- ✅ **GET /mock-payment/:payment_id** - Halaman simulasi pembayaran

## 🚀 Cara Menggunakan

### Quick Start

**Opsi 1: Jalankan dengan Docker Compose (Standalone)**

```bash
cd mockoon
docker-compose up -d
```

Mock API akan berjalan di `http://localhost:3000`

**Opsi 2: Jalankan bersama All-in-One**

Edit file `.env` di root project:
```env
XENDIT_BASE_URL=http://mockoon:3000
XENDIT_API_KEY=test_api_key
XENDIT_WEBHOOK_TOKEN=test_webhook_token
```

Kemudian jalankan:
```bash
cd docker/all-in-one
docker-compose up -d
```

**Opsi 3: Jalankan Tanpa Docker**

1. Install Mockoon CLI:
```bash
npm install -g @mockoon/cli
```

2. Jalankan mock server:
```bash
cd mockoon
mockoon-cli start --data ./xendit-mock.json --port 3000
```

3. Update `.env`:
```env
XENDIT_BASE_URL=http://localhost:3000
```

### Testing Mock API

**Menggunakan Script (Recommended)**

Windows (PowerShell):
```powershell
cd mockoon
.\test-api.ps1
```

Linux/Mac:
```bash
cd mockoon
chmod +x test-api.sh
./test-api.sh
```

**Manual Testing dengan cURL**


```bash
curl -X POST http://localhost:3000/v2/invoices \
  -H "Content-Type: application/json" \
  -u test_api_key: \
  -d '{
    "external_id": "order_123_test",
    "amount": 100000,
    "payer_email": "customer@example.com",
    "description": "Event: Test Event - Order: ABC123",
    "invoice_duration": 86400,
    "currency": "IDR",
    "items": [
      {
        "name": "Event Tickets",
        "quantity": 1,
        "price": 100000
      }
    ],
    "customer": {
      "given_names": "John Doe",
      "email": "customer@example.com"
    }
  }'
```

### 2. Get Invoice

```bash
curl -X GET http://localhost:3000/v2/invoices/{invoice_id} \
  -H "Content-Type: application/json" \
  -u test_api_key:
```

### 3. Expire Invoice

```bash
curl -X POST http://localhost:3000/invoices/{invoice_id}/expire \
  -H "Content-Type: application/json" \
  -u test_api_key:
```

### 4. Mock Payment Page

Buka di browser:
```
http://localhost:3000/mock-payment/{payment_id}
```

Halaman ini menyediakan tombol untuk simulasi:
- ✅ Successful Payment
- ❌ Failed Payment

## 📝 Response Examples

### Create Invoice Response
```json
{
  "id": "generated-uuid",
  "external_id": "order_123_test",
  "user_id": "user-uuid",
  "status": "PENDING",
  "merchant_name": "Hi.Events",
  "amount": 100000,
  "payer_email": "customer@example.com",
  "description": "Event: Test Event - Order: ABC123",
  "invoice_url": "http://localhost:3000/mock-payment/generated-uuid",
  "available_banks": [...],
  "available_ewallets": [...],
  "currency": "IDR",
  "created": "2025-12-16T09:51:51.000Z",
  "updated": "2025-12-16T09:51:51.000Z"
}
```

## 🔧 Konfigurasi

File konfigurasi Mockoon: `mockoon/xendit-mock.json`

### Port Configuration
Default port: `3000`

Untuk mengubah port, edit `docker-compose.yaml`:
```yaml
services:
  mockoon:
    ports:
      - "3001:3000"  # host:container
```

### CORS
CORS sudah diaktifkan secara default untuk semua origin (`*`).

## 🐛 Troubleshooting

### Mock API tidak bisa diakses dari backend container

Pastikan menggunakan nama service sebagai hostname:
```env
XENDIT_BASE_URL=http://mockoon:3000
```

Bukan:
```env
XENDIT_BASE_URL=http://localhost:3000  # ❌ Tidak akan work di container
```

### Authentication Error

Mock API menerima semua API key. Pastikan format Basic Auth benar:
```
Authorization: Basic base64(api_key:)
```

Note: Password kosong, hanya API key diikuti colon.

## 📚 Dokumentasi Xendit

Untuk referensi API asli Xendit:
- [Xendit Invoice API](https://developers.xendit.co/api-reference/#create-invoice)
- [Xendit Webhooks](https://developers.xendit.co/api-reference/#invoice-callback)

## 🎯 Next Steps

1. Implementasi webhook callback simulation
2. Tambahkan endpoint untuk virtual account
3. Tambahkan endpoint untuk e-wallet
4. Tambahkan data persistence dengan Mockoon databucket
