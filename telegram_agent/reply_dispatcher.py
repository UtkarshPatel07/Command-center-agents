import logging
import asyncio
from telethon import TelegramClient
from state_manager import state
from config import CONTROL_GROUP_ID
from ai_engine import humanize_override, add_to_context

logger = logging.getLogger(__name__)

async def handle_manual_reply(client: TelegramClient, event):
    """
    Handles a reply from the operator in the Control Group topic.
    Extracts the destination from the topic state and sends the message.
    """
    topic_id = event.reply_to_msg_id
    
    # Check if this topic is tracked in our state.
    topic_info = state.get_source_for_topic(topic_id)
    actual_topic_id = topic_id
    
    if not topic_info:
        if hasattr(event.message, 'reply_to') and event.message.reply_to:
            top_msg_id = event.message.reply_to.reply_to_top_id or event.message.reply_to.reply_to_msg_id
            topic_info = state.get_source_for_topic(top_msg_id)
            actual_topic_id = top_msg_id
            
        if not topic_info:
            logger.debug(f"Message in un-tracked topic {topic_id}, ignoring.")
            return

    # Cancel auto-reply if the human operator takes over
    state.cancel_auto_reply(actual_topic_id)

    if state.is_resolved(actual_topic_id):
        # Already resolved
        return

    state.mark_resolved(actual_topic_id)
    
    source_chat_id = topic_info["source_chat_id"]
    user_id = topic_info["user_id"]
    
    await event.reply("✅ *Manual reply processing...*")
    
    # Humanize / expand text using AI here
    final_content = await humanize_override(event.raw_text, "A question from the user")
    
    # Simulate typing delay
    await asyncio.sleep(1)
    
    # Send to target
    try:
        await client.send_message(source_chat_id, final_content)
        
        # Update AI context with human's reply
        add_to_context(str(user_id), "assistant", final_content)
        
        await event.reply("🚀 **Reply sent successfully!**")
        logger.info(f"Sent manual reply to {source_chat_id}")
    except Exception as e:
        logger.error(f"Failed to send reply to {source_chat_id}: {e}")
        await event.reply(f"❌ **Failed to send reply:** {e}")
