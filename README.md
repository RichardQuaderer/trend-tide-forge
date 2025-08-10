# InfluenZer - AI Video Content Creator

## YouTube OAuth Setup

To enable YouTube integration, you need to configure Google OAuth credentials:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3

### 2. Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: InfluenZer
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/youtube.readonly`
5. Add test users if needed

### 3. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure:
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/oauth-callback` (development)
     - `https://your-domain.com/oauth-callback` (production)

### 4. Add Secrets to Supabase

Use the buttons below to add your Google OAuth credentials:

### 5. Security Notes

- Never log or expose the `GOOGLE_CLIENT_SECRET`
- Use HTTPS in production
- The client secret is only used server-side in edge functions
- Tokens are encrypted and stored securely in the database
- State and nonce parameters protect against CSRF attacks

### Required Scopes

- `https://www.googleapis.com/auth/youtube.readonly` - Read channel info and video data

You can configure additional scopes later if you need write access for publishing videos.

## Features

- ✅ Secure OAuth 2.0 + PKCE flow
- ✅ Token refresh handling
- ✅ CSRF protection with state/nonce
- ✅ Encrypted token storage
- ✅ Automatic token refresh
- ✅ Connection status tracking
- ✅ Test API functionality

## Project info

**URL**: https://lovable.dev/projects/df569328-64e9-4952-8a72-bd049cba4bf0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/df569328-64e9-4952-8a72-bd049cba4bf0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/df569328-64e9-4952-8a72-bd049cba4bf0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
