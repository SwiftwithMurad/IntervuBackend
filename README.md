# Intervu Backend

Express + TypeScript + MongoDB backend for an iOS AI interview app.  
This repo includes:

- Complete auth flow (register/login/refresh/forgot/reset password with OTP).
- Interview flow with GPT-4o-mini evaluations.
- Free vs Pro gating for history and ideal answers.
- Vercel deployment support.

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Set at least these env vars:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENAI_API_KEY`

## Main endpoints

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/verify-reset-otp`
- `POST /api/v1/auth/reset-password`

### Interview (JWT required)

- `GET /api/v1/interview/main-config`  
  Roles, levels, styles, topics for your main screen.
- `POST /api/v1/interview/sessions/start`  
  Starts an interview session and returns first question.
- `GET /api/v1/interview/sessions/:sessionId/question`  
  Returns current question + remaining timer.
- `POST /api/v1/interview/sessions/:sessionId/answer`  
  Saves answer, evaluates it, returns next question or completed status.
- `GET /api/v1/interview/sessions/:sessionId/feedback`  
  Returns detailed feedback (`idealAnswer` visible only for Pro).
- `GET /api/v1/interview/sessions-summary`
- `GET /api/v1/interview/history`  
  Free users get limited history, Pro users get full history.

### Profile and paywall (JWT required)

- `GET /api/v1/profile/me`
- `GET /api/v1/paywall`

Paywall products:

- Monthly: `$7.99`
- Yearly: `$49.99`

## Vercel deployment

This repo includes `vercel.json` and `api/index.ts` to run Express on Vercel. MongoDB connects on each request via middleware (required for serverless).

1. Push this repo to GitHub (see below).
2. In [Vercel](https://vercel.com): New Project → Import the GitHub repo.
3. **Environment variables:** add the same keys as in `.env.example` (copy values from your local `.env`, **never** commit `.env`).
   - Required: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OPENAI_API_KEY`
   - Optional: `OPENAI_MODEL`, `JWT_*_EXPIRES_IN`, `BREVO_API_KEY`, `EMAIL_FROM`, profile URLs, etc.
4. Deploy.

After deploy, use your Vercel URL as the API base (no trailing slash), for example:

- Health: `GET https://<your-project>.vercel.app/health`
- Auth: `POST https://<your-project>.vercel.app/api/v1/auth/login`

Test in Postman: set **Authorization → Bearer Token** with `accessToken` after login.

### Push to GitHub

```bash
git add -A
git status   # confirm .env is NOT listed
git commit -m "Add interview API, Vercel entry, MongoDB connect for serverless"
git push origin main
```
