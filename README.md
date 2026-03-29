# Polyvia Backend – AI Vocabulary Trainer API

Node.js + Express + MongoDB (Mongoose) ile yazılmış production-ready REST APIIIII.

## Kurulum

```bash
cp .env.example .env
# .env dosyasını düzenleyin (MONGODB_URI, JWT secret'lar, OPENAI_API_KEY vb.)

npm install
npm run dev
```

## Ortam Değişkenleri

- `MONGODB_URI` – MongoDB bağlantı adresi
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` – JWT imzalama (en az 32 karakter)
- `OPENAI_API_KEY` – OpenAI API anahtarı (konu üretimi için)
- `EMAIL_*` – E-posta (OTP) gönderimi (opsiyonel; dev’de log’a yazılır)
- `REVENUECAT_WEBHOOK_SECRET` – RevenueCat webhook imza doğrulama

## API Özeti

- **Auth:** `POST /api/v1/auth/register`, `verify-email`, `login`, `refresh`, `forgot-password`, `reset-password`
- **Topics:** `POST /api/v1/topics/generate`, `POST /api/v1/topics/:draftId/save`, `GET /api/v1/topics`
- **Test:** `GET /api/v1/topics/:id/test`, `POST /api/v1/topics/:id/submit`
- **Webhook:** `POST /api/v1/webhooks/revenuecat` (RevenueCat)

iOS uygulamasında RevenueCat’e `app_user_id` olarak kullanıcı ID’sini (MongoDB ObjectId) gönderin; webhook plan güncellemesi buna göre yapılır.

## Hata Kodları

`EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `OTP_EXPIRED`, `OTP_BLOCKED_24H`, `RESEND_LIMIT_EXCEEDED`, `DAILY_TOPIC_LIMIT_EXCEEDED`, `TEST_ALREADY_COMPLETED`, `DRAFT_EXPIRED`, `UNAUTHORIZED`, vb.

## Cron

- Her 5 dakika: 15 dakikadan eski DRAFT konular EXPIRED yapılır.
- Her saat: OTP resend sayaçları sıfırlanır.
