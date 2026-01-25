# Vercel Deployment Guide - Frontend Only

This guide will help you deploy your React frontend to Vercel while keeping your backend on Render.

## Prerequisites

- ✅ GitHub/GitLab/Bitbucket account with your code
- ✅ Render backend already deployed and running
- ✅ Vercel account (free tier works fine)

---

## Step 1: Prepare Your Repository

### 1.1 Ensure your repository structure is correct

Your repo should have:
```
PROVIQUIZ/
├── client/          # Frontend (React + Vite)
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json  # Already exists ✅
└── server/          # Backend (stays on Render)
```

### 1.2 Verify your API configuration

Your frontend already points to Render backend:
- `client/src/api/http.ts` uses: `https://proviquiz-2.onrender.com/api`
- `client/src/api/examApi.ts` uses the same

✅ **This is already configured correctly!**

---

## Step 2: Connect to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in (use GitHub/GitLab)

2. **Click "Add New Project"** or **"Import Project"**

3. **Select your repository** (PROVIQUIZ)

4. **Configure Project Settings:**
   - **Framework Preset:** Vite (or auto-detect)
   - **Root Directory:** `client` ⚠️ **IMPORTANT!**
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Environment Variables:**
   - Click "Environment Variables"
   - Add if needed:
     ```
     VITE_API_URL=https://proviquiz-2.onrender.com/api
     ```
   - (Optional - your code already has a fallback)

6. **Click "Deploy"**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to client directory
cd client

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

---

## Step 3: Configure Vercel Settings

### 3.1 Root Directory Configuration

**CRITICAL:** Since your frontend is in the `client/` folder:

1. Go to **Project Settings** → **General**
2. Find **Root Directory**
3. Set it to: `client`
4. Click **Save**

### 3.2 Build Settings

Verify these settings in **Settings** → **General**:
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3.3 Environment Variables

Go to **Settings** → **Environment Variables** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://proviquiz-2.onrender.com/api` | Production, Preview, Development |

**Note:** Your code already has a fallback, but setting this explicitly is recommended.

---

## Step 4: Update CORS on Render Backend

Make sure your Render backend allows requests from your Vercel domain:

### In your server code (`server/src/index.ts`):

```typescript
app.use(cors({
  origin: [
    "http://localhost:5173",           // Local dev
    "https://your-app.vercel.app",     // Vercel production
    "https://*.vercel.app",            // All Vercel previews
    // Add your Render backend URL if needed
  ],
  credentials: true
}));
```

Or allow all origins (for development):
```typescript
app.use(cors({
  origin: true,  // Allows all origins
  credentials: true
}));
```

---

## Step 5: Update OAuth Redirect URLs

If you're using Google OAuth, update the redirect URLs:

### In Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URIs:
   - `https://your-app.vercel.app/oauth/callback`
   - `https://your-app.vercel.app/api/auth/google/callback`

### Update Backend Environment Variables on Render:

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment**
4. Update:
   ```
   GOOGLE_REDIRECT_URI=https://proviquiz-2.onrender.com/api/auth/google/callback
   FRONTEND_URL=https://your-app.vercel.app
   ```

---

## Step 6: Deploy and Test

### 6.1 First Deployment

1. Push your code to GitHub (if not already):
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin master  # or main
   ```

2. Vercel will automatically detect the push and deploy

3. Wait for deployment to complete (usually 1-2 minutes)

### 6.2 Verify Deployment

1. Check the deployment logs in Vercel dashboard
2. Visit your Vercel URL: `https://your-app.vercel.app`
3. Test:
   - ✅ Frontend loads
   - ✅ API calls work (check browser console)
   - ✅ Authentication works
   - ✅ Admin dashboard works

---

## Step 7: Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

---

## Troubleshooting

### Issue: Build fails

**Solution:**
- Check build logs in Vercel
- Ensure `Root Directory` is set to `client`
- Verify `package.json` has correct build script

### Issue: API calls fail (CORS errors)

**Solution:**
- Update CORS settings on Render backend
- Add Vercel domain to allowed origins
- Check browser console for specific errors

### Issue: Environment variables not working

**Solution:**
- Ensure variables start with `VITE_` prefix
- Rebuild after adding variables
- Check variable names match exactly

### Issue: 404 errors on page refresh

**Solution:**
- Your `vercel.json` already handles this ✅
- Ensure rewrites are configured correctly

---

## File Structure Summary

```
PROVIQUIZ/
├── client/                    # ← Vercel deploys this
│   ├── src/
│   │   ├── api/
│   │   │   ├── http.ts       # Points to Render backend ✅
│   │   │   └── examApi.ts    # Points to Render backend ✅
│   │   └── ...
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json           # SPA routing config ✅
│
└── server/                    # ← Stays on Render
    └── ...
```

---

## Quick Checklist

- [ ] Vercel account created
- [ ] Repository connected to Vercel
- [ ] Root Directory set to `client`
- [ ] Build settings verified
- [ ] Environment variables added (if needed)
- [ ] CORS updated on Render backend
- [ ] OAuth redirect URLs updated
- [ ] First deployment successful
- [ ] Frontend tested and working
- [ ] API calls working correctly

---

## Useful Commands

```bash
# Deploy to Vercel (from client directory)
cd client
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Open Vercel dashboard
vercel dashboard
```

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Render Documentation](https://render.com/docs)

---

**Your frontend is now on Vercel, backend stays on Render! 🚀**
