# Cloudflare Pages Setup

Step-by-step guide to deploying your site on Cloudflare Pages.

## 1. Create a Cloudflare Account

Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up (free).

## 2. Create a Pages Project

1. Go to **Workers & Pages** → **Create** → **Pages** → **Direct Upload**
2. Name your project (e.g. `my-site`) — this becomes `my-site.pages.dev`
3. Upload any placeholder file to create the project
4. You can skip the custom domain setup for now

## 3. Create an API Token

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Custom token** template:
   - **Permissions**: Account → Cloudflare Pages → Edit
   - **Account Resources**: Include → Your account
4. Click **Continue to summary** → **Create Token**
5. Copy the token (you won't see it again)

## 4. Find Your Account ID

1. Go to any domain in your Cloudflare dashboard, or **Workers & Pages**
2. Your **Account ID** is in the right sidebar
3. Copy it

## 5. Configure GitHub

### Secrets (Settings → Secrets and variables → Actions)

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | The API token from step 3 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID from step 4 |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Value |
|----------|-------|
| `PROJECT_NAME` | Your Cloudflare Pages project name from step 2 |

### Environment (Settings → Environments → New environment)

Create an environment named `cloudflare`.

## 6. Deploy

1. Update `package.json` — change `name` and the `--project-name` in the `deploy` script
2. Commit and push to `main`
3. Go to **Actions** tab → **Deploy to Cloudflare Pages** → **Run workflow**

Your site will be live at `https://PROJECT_NAME.pages.dev`.

## Custom Domain (Optional)

1. In Cloudflare dashboard → **Workers & Pages** → your project → **Custom domains**
2. Add your domain
3. If the domain is on Cloudflare, DNS records are configured automatically
4. If not, add the CNAME record shown

## Local Development

```bash
npm run dev
# Opens http://localhost:3000
```

This uses `wrangler pages dev` which emulates the Cloudflare Pages environment locally.
