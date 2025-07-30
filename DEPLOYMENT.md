# 🚀 Deployment Guide for Render

This guide will help you deploy your musicContext application to Render's static site hosting.

## 📋 Prerequisites

- A [Render](https://render.com) account
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Your Supabase project URL and anon key

## 🔧 Deployment Steps

### 1. Connect Your Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your Git repository containing this project
4. Select the repository and branch you want to deploy

### 2. Configure Your Static Site

Fill in the deployment settings:

- **Name**: `musiccontext` (or your preferred name)
- **Branch**: `main` (or your default branch)
- **Build Command**: `./build.sh`
- **Publish Directory**: `.` (root directory)

### 3. Set Environment Variables

In the Render dashboard, add these environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon/public key**

### 4. Deploy

1. Click **"Create Static Site"**
2. Render will automatically build and deploy your application
3. Your site will be available at `https://your-site-name.onrender.com`

## 🔄 Automatic Deployments

Render will automatically redeploy your site whenever you push changes to your connected Git branch.

## 🛠️ Local Development

For local development, the app will use the fallback values in `js/config/supabase.js`. No additional setup needed!

## 📁 Project Structure

```
musicContext/
├── index.html              # Main application file
├── styles.css              # Application styles
├── js/                     # JavaScript modules
│   ├── app.js             # Main application logic
│   ├── config/            # Configuration files
│   ├── modules/           # Application modules
│   ├── utils/             # Utility functions
│   └── components/        # UI components
├── render.yaml            # Render configuration
├── package.json           # Project metadata
├── build.sh              # Build script for deployment
├── _headers              # Security and caching headers
└── DEPLOYMENT.md         # This file
```

## 🔐 Security Notes

- The `_headers` file configures security headers for your deployed site
- Environment variables are injected at build time for client-side access
- Your Supabase anon key is safe to expose publicly (by design)

## 🆘 Troubleshooting

### Build Fails
- Ensure `build.sh` is executable: `chmod +x build.sh`
- Check that environment variables are set correctly

### Application Doesn't Load
- Verify Supabase URL and keys are correct
- Check browser console for JavaScript errors
- Ensure all files are properly committed to your repository

### Environment Variables Not Working
- Check that variables are set in Render dashboard
- Verify the build script runs successfully
- Look for the generated `js/config/env.js` file in build logs

## 📞 Support

If you encounter issues:
1. Check Render's build logs for detailed error messages
2. Verify your Supabase configuration
3. Ensure all files are committed and pushed to your repository

Happy deploying! 🎉 