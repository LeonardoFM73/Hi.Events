# Setup CORS dengan Cloudflare

## 🔍 Issue Detected

Response header menunjukkan `server: cloudflare` - artinya Cloudflare berada di antara user dan backend Anda.

Cloudflare bisa block atau modify CORS headers. Ada 2 cara fix:

---

## ✅ Solusi 1: Cloudflare Transform Rules (RECOMMENDED)

### Langkah 1: Login ke Cloudflare Dashboard

1. Buka https://dash.cloudflare.com
2. Pilih domain `ticket-pro.digi46.id`

### Langkah 2: Buat Transform Rule

1. Sidebar → **Rules** → **Transform Rules**
2. Klik **Create rule**
3. Pilih **Modify Response Header**

### Langkah 3: Konfigurasi Rule

**Rule name:** `CORS for Xendit Webhook`

**When incoming requests match:**
- Field: **URI Path**
- Operator: **equals**
- Value: `/api/public/webhooks/xendit`

**Then:**

Add multiple headers:

| Action | Header Name | Value |
|--------|------------|-------|
| Set static | `Access-Control-Allow-Origin` | `*` |
| Set static | `Access-Control-Allow-Methods` | `GET, POST, OPTIONS` |
| Set static | `Access-Control-Allow-Headers` | `Content-Type, X-CALLBACK-TOKEN, Origin, Accept` |
| Set static | `Access-Control-Max-Age` | `86400` |

### Langkah 4: Deploy & Test

1. Klik **Deploy**
2. Tunggu 1-2 menit untuk propagation
3. Test:

```bash
curl -I -X OPTIONS https://ticket-pro.digi46.id/api/public/webhooks/xendit \
  -H "Origin: https://gwen-mock-pay.digi46.id"
```

Seharusnya sekarang ada:
```
Access-Control-Allow-Origin: *
```

---

## ✅ Solusi 2: Cloudflare Workers (Advanced)

Jika Transform Rules tidak tersedia di plan Anda, gunakan Worker:

### Langkah 1: Buat Worker

1. Dashboard → **Workers & Pages**
2. **Create Worker**
3. Name: `cors-webhook-handler`

### Langkah 2: Worker Script

Paste script ini:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Only handle webhook path
  if (url.pathname === '/api/public/webhooks/xendit') {
    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response('', {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-CALLBACK-TOKEN, Origin, Accept',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    
    // Forward to origin and add CORS headers
    const response = await fetch(request)
    const newResponse = new Response(response.body, response)
    
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CALLBACK-TOKEN, Origin, Accept')
    
    return newResponse
  }
  
  // Pass through for other requests
  return fetch(request)
}
```

### Langkah 3: Deploy Worker

1. Klik **Save and Deploy**
2. **Triggers** tab → **Add Route**
3. Route: `ticket-pro.digi46.id/api/public/webhooks/xendit`
4. Zone: `digi46.id`

---

## ✅ Solusi 3: Bypass Cloudflare (Quick Test)

Untuk **testing cepat**, bypass Cloudflare dengan akses langsung ke origin:

### Find Origin IP

Di Cloudflare Dashboard:
1. **DNS** → Check A record untuk `ticket-pro.digi46.id`
2. Note down IP address (contoh: 203.123.45.67)

### Temporarily Use IP

Di **`mockoon/.env`**, ganti:
```env
# Temporary bypass Cloudflare
BACKEND_WEBHOOK_URL=http://203.123.45.67:8123

# Atau jika ada SSL di origin:
# BACKEND_WEBHOOK_URL=https://203.123.45.67:8123
```

Restart Mockoon:
```bash
cd mockoon
docker-compose restart
```

**⚠️ WARNING:** Ini hanya untuk testing! Production harus pakai domain, bukan IP.

---

## 🔍 Debug Cloudflare

### Check Cloudflare is Blocking

```bash
# Test direct ke Cloudflare
curl -I -X OPTIONS https://ticket-pro.digi46.id/api/public/webhooks/xendit \
  -H "Origin: https://gwen-mock-pay.digi46.id" \
  -H "CF-Connecting-IP: 1.2.3.4"  # Fake IP untuk bypass

# Compare dengan bypass Cloudflare (jika tahu origin IP)
curl -I -X OPTIONS http://YOUR_ORIGIN_IP:8123/api/public/webhooks/xendit \
  -H "Origin: https://gwen-mock-pay.digi46.id" \
  -H "Host: ticket-pro.digi46.id"
```

### Check Cloudflare Firewall

1. Dashboard → **Security** → **Events**
2. Check apakah ada block untuk OPTIONS request
3. Jika ada, tambahkan **WAF Exception Rule**:
   - Match: URI Path = `/api/public/webhooks/xendit` AND Method = `OPTIONS`
   - Action: **Allow**

---

## 📋 Quick Checklist

**Cloudflare Level:**
- [ ] Transform Rule created untuk CORS headers
- [ ] WAF tidak block OPTIONS request
- [ ] SSL/TLS mode = Full (not Flexible)

**Backend Level:**
- [x] Middleware `XenditWebhookCors` diperbaiki
- [ ] Container di-restart: `docker-compose restart all-in-one`
- [ ] Test: `curl -I -X OPTIONS https://...`

**Testing:**
- [ ] Buat order BARU
- [ ] Klik Pay → Mock page
- [ ] Open Console (F12)
- [ ] Klik Simulate Success
- [ ] No CORS error di console ✅
- [ ] Auto-redirect to summary ✅

---

## 🎯 Recommended Order

1. **Update middleware** (sudah ✅)
2. **Restart container** (lakukan sekarang)
3. **Setup Cloudflare Transform Rule** (paling mudah)
4. **Test payment flow**

---

Silakan:
1. **Restart container dulu**
2. **Setup Cloudflare Transform Rule**
3. **Test ulang**
