# Social Media Command Center

A centralized dashboard for automating social media workflows. This app generates AI-driven social media posts, manages an approval queue, and automatically publishes them to various social media platforms.

## Initial Setup

1. **Install Node.js**: Ensure you have Node.js installed on your system.
2. **Install Dependencies**: Run `npm install` in the project root folder.
3. **Set Up Environment Variables**: Create a `.env` file in the root folder based on the `.env.example` file. You must fill in the credentials to enable the integrations.
4. **Run the App**: Start the development server by running `npm run dev`. Open your browser and navigate to `http://localhost:3000`.

---

## How to Get API Tokens (Step-by-Step)

### 1. OpenAI (AI Post Generation)
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Log in and click **"Create new secret key"**.
3. Copy the key and paste it as `OPENAI_API_KEY` in your `.env` file.

### 2. Telegram
1. Open the Telegram app and search for the user **@BotFather**.
2. Send the message `/newbot` and follow the prompts to give your bot a name and username.
3. BotFather will reply with an **HTTP API Token**. Paste this as `TELEGRAM_BOT_TOKEN`.
4. Create a Telegram Channel or Group where you want the posts to go. Add your bot as an Admin.
5. Send a test message in the channel. You can extract the `TELEGRAM_CHAT_ID` by passing the bot token to `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`.

### 3. LinkedIn
1. Log into your real, human LinkedIn account.
2. Click the "For Business" icon in the top right and click **"Create a Company Page"**. Copy the Company ID from the URL (e.g., 123456789) and set it as `LINKEDIN_AUTHOR_URN` (format: `urn:li:organization:123456789`).
3. Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/) and click **"Create App"**. Link it to the Company Page you just made.
4. Go to the **"Products"** tab and request access to **"Share on LinkedIn"** and **"Sign In with LinkedIn using OpenID Connect"**.
5. Go to the **"Auth"** tab, click **"Generate Access Token"**, and paste it as `LINKEDIN_ACCESS_TOKEN`.

### 4. Reddit
1. Log into an established Reddit account (brand new accounts are blocked).
2. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps).
3. Click **"Create another app..."**, select **"script"**, and set the redirect URI to `http://localhost:8080`.
4. Click create. Copy the string under the name (`REDDIT_CLIENT_ID`) and the secret (`REDDIT_CLIENT_SECRET`).
5. Set `REDDIT_USERNAME` and `REDDIT_PASSWORD` to the credentials of the account the bot will post from. 
*(Note: Reddit's anti-spam filter blocks new accounts with 0 Karma from posting via API).*

### 5. Facebook / Instagram
1. Log into an established, phone-verified Facebook account.
2. Go to the [Meta Developer Portal](https://developers.facebook.com/) and click **"Create App"**.
3. Select **"Business"** and link it to your Facebook Business Manager.
4. Add the **Facebook Graph API** and **Instagram Graph API** products to your app.
5. Use the Graph API Explorer to generate long-lived Page Access Tokens.
6. Copy the Page ID and Token into `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN`. Do the same for `INSTAGRAM_ACCOUNT_ID` and `INSTAGRAM_ACCESS_TOKEN`. 

---

### Additional Notes
* **CoinMarketCap:** Auto-posting is strictly against their Terms of Service and they use Cloudflare to block automated bots. Do not attempt to automate CoinMarketCap as it will result in an IP/Account ban.
* **Email Notifications:** The app currently uses Nodemailer with a Gmail SMTP relay to send notification emails for approvals. Ensure `SMTP_USER` and `SMTP_PASSWORD` are configured.
