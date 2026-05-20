import logging
from telethon import TelegramClient, events
from config import TG_API_ID, TG_API_HASH, TG_SESSION_NAME, TARGET_CHATS, CONTROL_GROUP_ID
from message_listener import handle_new_message

logger = logging.getLogger(__name__)

async def main():
    if not TG_API_ID or not TG_API_HASH:
        logger.error("Missing TG_API_ID or TG_API_HASH. Exiting.")
        return

    logger.info("Starting Telegram Command Center...")
    
    # Initialize the Telethon client
    client = TelegramClient(TG_SESSION_NAME, TG_API_ID, TG_API_HASH)
    
    # Register event handlers
    @client.on(events.NewMessage)
    async def new_message_handler(event):
        await handle_new_message(client, event)
    
    # Start the client
    await client.start()
    
    me = await client.get_me()
    logger.info(f"Logged in successfully as {me.first_name} (@{me.username or 'No Username'})")
    logger.info(f"Listening for messages... Targets: {TARGET_CHATS}, Control Group: {CONTROL_GROUP_ID}")
    
    # Run until disconnected
    await client.run_until_disconnected()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
