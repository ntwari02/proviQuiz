# Environment Configuration Guide

This guide explains how to configure environment variables for the PROVIQUIZ frontend application.

## Environment Files

The application uses different environment files for different environments:

- `.env.development` - Used for local development (automatically loaded by Vite)
- `.env.production` - Used for production builds (automatically loaded by Vite)
- `.env.local` - Local overrides (highest priority, not committed to git)
- `.env.example` - Example file showing required variables

## Required Environment Variables

### `VITE_API_URL`

The base URL for the backend API.

**Development:**
```
VITE_API_URL=http://localhost:5000/api
```

**Production:**
```
VITE_API_URL=https://proviquiz-2.onrender.com/api
```

## Setup Instructions

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set your local backend URL:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. Restart your development server if it's already running.

### Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://proviquiz-2.onrender.com/api`
   - **Environment:** Production (and Preview if needed)

4. Redeploy your application

## How It Works

- Vite automatically loads environment variables prefixed with `VITE_`
- Environment files are loaded in this order (later files override earlier ones):
  1. `.env`
  2. `.env.local`
  3. `.env.[mode]` (e.g., `.env.development`)
  4. `.env.[mode].local`

- The API client in `src/api/http.ts` reads `VITE_API_URL` and uses it as the base URL for all API requests
- If `VITE_API_URL` is not set, it defaults to the production URL

## CORS Configuration

The backend API at `https://proviquiz-2.onrender.com/api` should be configured to allow requests from:
- `https://proviquiz-roan.vercel.app` (production frontend)
- `http://localhost:5173` (Vite dev server default)
- `http://localhost:3000` (alternative dev port)

Make sure your backend CORS configuration includes these origins.

## Troubleshooting

### API calls failing in production

1. Verify `VITE_API_URL` is set in Vercel environment variables
2. Check that the backend URL is correct and accessible
3. Verify CORS is configured on the backend
4. Check browser console for specific error messages

### API calls pointing to wrong URL

1. Check which environment file is being used
2. Verify `VITE_API_URL` is set correctly
3. Restart the development server after changing `.env` files
4. Clear browser cache if issues persist

### Environment variable not working

- Remember: Vite only exposes variables prefixed with `VITE_`
- Restart the dev server after changing environment files
- Check that the variable name is exactly `VITE_API_URL` (case-sensitive)
