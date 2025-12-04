# Xendit Quick Setup (5 Menit)

## 1️⃣ Dapatkan Xendit Keys (2 menit)

```bash
# 1. Buka https://xendit.co → Sign Up
# 2. Verify email
# 3. Login ke https://dashboard.xendit.co
# 4. Settings → API Keys → Copy Secret Key (xnd_development_xxxxx)
# 5. Settings → Webhooks → Copy Webhook Token
```

## 2️⃣ Setup Environment (1 menit)

```bash
# Edit docker/all-in-one/.env
XENDIT_API_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=webhook_token_xxxxx

# Restart container
podman-compose restart
```

## 3️⃣ Enable di Event (1 menit)

1. Login Hi.Events Admin
2. Pilih Event
3. Settings → Payment & Invoicing
4. Centang **Xendit**
5. Click **Save**

## 4️⃣ Test Payment (1 menit)

1. Buka product page (public link)
2. Pilih ticket
3. Checkout
4. Pilih **Xendit** sebagai payment method
5. Klik **Pay with Xendit**

---

## ✅ Done! Xendit siap digunakan! 🚀

**Untuk detail lebih lanjut**: Baca `XENDIT_USAGE_TUTORIAL.md`
