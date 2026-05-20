import logging
from telethon import TelegramClient
from config import CONTROL_GROUP_ID, TARGET_CHATS
from state_manager import state
from control_manager import route_to_control_center
from reply_dispatcher import handle_manual_reply

logger = logging.getLogger(__name__)

# Basic keyword filtering just like the Discord bot
TARGET_KEYWORDS = ["?", "how", "what", "why", "where", "when", "help", "issue", "bug", "error", "can i", "do you", "is there"]

def is_target_question(text):
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in TARGET_KEYWORDS)

async def handle_new_message(client: TelegramClient, event):
    # 1. Ignore out-going messages from ourselves to prevent loops
    if event.out:
        # Unless it's us replying in the Control Group!
        if event.chat_id == CONTROL_GROUP_ID:
            # We are in the control group. Check if we are replying to a topic.
            if event.reply_to_msg_id:
                # Prevent infinite loops from the bot's own status messages
                bot_prefixes = ("✅", "🚀", "⚠️", "⏰", "🤖", "**New Lead", "**Follow-up")
                if event.raw_text and event.raw_text.startswith(bot_prefixes):
                    return
                    
                # Ignore messages that the bot forwarded
                if event.message.fwd_from:
                    return
                    
                await handle_manual_reply(client, event)
        return

    # 2. Check if we're receiving a message in the Control Group from someone else (ignore)
    if event.chat_id == CONTROL_GROUP_ID:
        return

    chat_id = event.chat_id
    sender = await event.get_sender()
    user_id = sender.id if sender else chat_id
    
    # 3. Check if there's an active topic for this user
    active_topic_id = state.get_topic_for_user(chat_id, user_id)
    if active_topic_id:
        logger.info(f"Routing follow-up message to existing topic {active_topic_id}")
        await route_to_control_center(client, event, is_new_thread=False)
        return

    # 4. Filter messages: must be in TARGET_CHATS (if specified) and must be a question
    if TARGET_CHATS and chat_id not in TARGET_CHATS:
        # Check if chat username is in TARGET_CHATS
        chat = await event.get_chat()
        if hasattr(chat, 'username') and chat.username not in TARGET_CHATS:
            return

    if not is_target_question(event.raw_text):
        return

    # 5. Route new target question
    logger.info(f"Intercepted target question from {user_id} in {chat_id}")
    await route_to_control_center(client, event, is_new_thread=True)
