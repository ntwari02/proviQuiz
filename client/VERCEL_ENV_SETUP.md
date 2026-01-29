# Vercel Environment Variables Setup

## Quick Setup for Vercel Deployment

### Step 1: Add Environment Variable in Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project: **proviquiz-roan**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add the following:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://proviquiz-2.onrender.com/api`
   - **Environment:** Select **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your application for changes to take effect

### Step 2: Verify Backend CORS Configuration

Ensure your backend at `https://proviquiz-2.onrender.com/api` allows requests from:
- `https://proviquiz-roan.vercel.app`
- `http://localhost:5173` (for local development)
- `http://localhost:3000` (alternative dev port)

### Step 3: Test the Connection

After deployment, test that API calls work:
1. Open your deployed app: https://proviquiz-roan.vercel.app
2. Open browser DevTools → Network tab
3. Try logging in or making an API call
4. Verify requests are going to `https://proviquiz-2.onrender.com/api`

## Environment Variable Reference

| Variable Name | Development Value | Production Value |
|--------------|-------------------|-----------------|
| `VITE_API_URL` | `http://localhost:5000/api` | `https://proviquiz-2.onrender.com/api` |

## Troubleshooting

### API calls failing after deployment

1. **Check environment variable is set:**
   - Go to Vercel → Settings → Environment Variables
   - Verify `VITE_API_URL` exists and is set to `https://proviquiz-2.onrender.com/api`

2. **Redeploy after adding variable:**
   - Environment variables require a new deployment to take effect
   - Go to Deployments → Click "..." → Redeploy

3. **Check browser console:**
   - Open DevTools → Console
   - Look for CORS errors or network errors
   - Verify the API URL in Network tab requests

4. **Verify backend is accessible:**
   - Test backend directly: `https://proviquiz-2.onrender.com/api/health` (if available)
   - Check backend logs on Render dashboard

### CORS Errors

If you see CORS errors in the browser console:
- Backend needs to allow `https://proviquiz-roan.vercel.app` in CORS configuration
- Check backend CORS settings on Render dashboard
- Common CORS error: "Access-Control-Allow-Origin" header missing

### Environment variable not working

- Vite only exposes variables prefixed with `VITE_`
- Variable name must be exactly `VITE_API_URL` (case-sensitive)
- Restart dev server after changing `.env` files locally
- Redeploy on Vercel after adding/changing environment variables

## Local Development

For local development, create a `.env.local` file:

```bash
# .env.local
VITE_API_URL=http://localhost:5000/api
```

This file is gitignored and won't be committed.
