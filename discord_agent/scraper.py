import asyncio
import json
import os
import re
import aiohttp
from playwright.async_api import async_playwright

# ==========================================
# CONFIGURE WEBHOOK ENDPOINT
# ==========================================
WEBHOOK_URL = None  # e.g., "http://localhost:8000/api/scraper/webhook/"

async def scrape_channel(page, server_name, channel_name):
    print(f"\n--- Navigating to Server: {server_name} ---")
    try:
        # Discord servers on the left sidebar are usually treeitems with aria-labels matching the server name
        server_icon = page.get_by_role("treeitem", name=re.compile(server_name, re.IGNORECASE)).first
        await server_icon.click(timeout=10000)
        await page.wait_for_timeout(2000) # Wait for channels to load
        
        print(f"Navigating to Channel: {channel_name}")
        # Discord channels are usually links in the sidebar
        channel_link = page.get_by_role("link", name=re.compile(channel_name, re.IGNORECASE)).first
        await channel_link.click(timeout=10000)
        await page.wait_for_timeout(3000) # Wait for messages to load
        
        print(f"Scraping recent messages...")
        messages = []
        
        # Discord messages have ids like chat-messages-123456789
        message_elements = await page.locator('li[id^="chat-messages-"]').all()
        
        # Get the last 15 messages
        for el in message_elements[-15:]:
            text = await el.inner_text()
            # Clean up the text a bit (removing newlines, etc for cleaner JSON)
            clean_text = "\n".join([line for line in text.split("\n") if line.strip()])
            messages.append(clean_text)
            
        print(f"Successfully scraped {len(messages)} messages from {channel_name}.")
        return messages
    except Exception as e:
        print(f"Error scraping {server_name} -> {channel_name}: {str(e)}")
        # Save a screenshot for debugging if it fails
        os.makedirs("debug", exist_ok=True)
        await page.screenshot(path=f"debug/error_{server_name}_{channel_name}.png")
        return []

async def run():
    # Setup directory for video recording
    os.makedirs("videos", exist_ok=True)
    
    async with async_playwright() as p:
        print("Launching browser... (Headed mode is ON so you can solve CAPTCHAs)")
        # Headless=False so the user can interact if Discord asks for CAPTCHA or New Login Location verification
        browser = await p.chromium.launch(headless=False) 
        context = await browser.new_context(
            record_video_dir="videos/",
            record_video_size={"width": 1280, "height": 720}
        )
        page = await context.new_page()

        print("Navigating to Discord login...")
        await page.goto("https://discord.com/login")

        print("Filling credentials...")
        await page.fill("input[name='email']", "mailaalaxmi@gmail.com")
        await page.fill("input[name='password']", "Pass@123456")
        await page.click("button[type='submit']")

        print("Waiting for login to complete...")
        print("IMPORTANT: If Discord asks for a CAPTCHA or Email Verification, please do it in the browser window now.")
        print("Waiting up to 90 seconds for the 'Servers' area to appear...")
        
        try:
            # Wait until we see the servers list
            await page.wait_for_selector('[aria-label="Servers sidebar"]', timeout=90000)
            print("Successfully logged in!")
        except Exception as e:
            print("Timeout waiting for login. Either credentials were wrong, or CAPTCHA/2FA took too long.")
            await context.close()
            await browser.close()
            return

        # Give discord a moment to fully load
        await page.wait_for_timeout(5000)

        results = {}

        # Target 1: Market cipher -> btc and eth
        results["Market cipher - btc and eth"] = await scrape_channel(page, "Market cipher", "btc and eth")
        
        # Target 2: Market cipher -> shitcoins
        results["Market cipher - shitcoins"] = await scrape_channel(page, "Market cipher", "shitcoins")

        # Target 3: Jayson Casper -> general discussion
        results["Jayson Casper - general discussion"] = await scrape_channel(page, "Jayson Casper", "general discussion")

        # Save results to JSON
        with open("fetched_messages.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=4, ensure_ascii=False)
            
        print("\n--- Scraping Complete ---")
        print("Results saved to fetched_messages.json")
        print("A video recording of this session has been saved in the 'videos/' directory.")
        
        # Push to webhook if configured
        if WEBHOOK_URL:
            print(f"🚀 Pushing payload to Django webhook: {WEBHOOK_URL}")
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(WEBHOOK_URL, json=results) as response:
                        if response.status in (200, 201):
                            print("✅ Successfully pushed to Django backend!")
                        else:
                            print(f"⚠️ Webhook responded with status: {response.status}")
                            print(await response.text())
            except Exception as e:
                print(f"❌ ERROR: Failed to push to webhook: {str(e)}")

        # Close everything
        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
