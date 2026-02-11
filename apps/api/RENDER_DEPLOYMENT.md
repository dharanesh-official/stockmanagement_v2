# Deploy to Render - Free Tier Guide

## Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for easy deployment)

## Step 2: Deploy PostgreSQL Database (Free)
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `stockmanager-db`
   - **Database**: `stockmanager`
   - **User**: `stockmanager_user`
   - **Region**: Choose closest to you
   - **Plan**: **Free** (500 MB storage, expires after 90 days but can be recreated)
3. Click **"Create Database"**
4. Wait for it to provision
5. Copy the **"Internal Database URL"** (starts with `postgresql://`)

## Step 3: Deploy Backend API (Free)
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `dharanesh-official/stockmanager-client-`
3. Configure:
   - **Name**: `stockmanager-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm run start:prod`
   - **Plan**: **Free** (750 hours/month, spins down after 15 min inactivity)

4. **Environment Variables** - Click "Advanced" and add:
   ```
   DATABASE_URL=<paste Internal Database URL from Step 2>
   DIRECT_URL=<same as DATABASE_URL>
   JWT_SECRET=8808b2a5e952ace9f3d2eb4ff6ee1bc1da7f26e369759dafce3a5924d83b096f
   ALLOWED_ORIGINS=https://stockmanager-client.vercel.app
   NODE_ENV=production
   PORT=10000
   ```
   
   **Note**: Render uses port 10000 by default for web services

5. Click **"Create Web Service"**

## Step 4: Wait for Deployment
- Render will build and deploy your API
- First deployment takes 5-10 minutes
- You'll get a URL like: `https://stockmanager-api.onrender.com`

## Step 5: Configure Vercel
1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add/Update:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://stockmanager-api.onrender.com` (your Render URL)
   - **Environment**: Production
3. Redeploy Vercel

## Important Notes about Render Free Tier:
- ✅ **750 hours/month** of runtime (enough for 24/7 if you have one service)
- ✅ **Automatic HTTPS**
- ✅ **Automatic deployments** from GitHub
- ⚠️ **Spins down after 15 min of inactivity** (first request after spin-down takes 30-60 seconds)
- ⚠️ **PostgreSQL free tier expires after 90 days** (but you can create a new one)

## Troubleshooting:
- If build fails, check the build logs in Render dashboard
- Make sure Root Directory is set to `apps/api`
- Verify all environment variables are set correctly
