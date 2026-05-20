import logging
import asyncio
from datetime import datetime
from telethon import TelegramClient
from state_manager import state
from config import CONTROL_GROUP_ID
from telethon.tl import functions
from ai_engine import generate_reply, add_to_context

logger = logging.getLogger(__name__)

async def auto_reply_countdown(client: TelegramClient, topic_id: int, source_chat_id: int, ai_draft: str, user_id: int):
    """
    Waits 30 seconds. If the topic is not resolved by a human, sends the AI draft.
    """
    try:
        await asyncio.sleep(30)
        
        if not state.is_resolved(topic_id):
            logger.info(f"Auto-reply timeout reached for topic {topic_id}. Sending AI draft.")
            state.mark_resolved(topic_id)
            
            await client.send_message(CONTROL_GROUP_ID, "⏰ **Timeout reached. Auto-sending AI draft...**", reply_to=topic_id)
            
            # Send to target
            await client.send_message(source_chat_id, ai_draft)
            
            # Update AI context
            add_to_context(str(user_id), "assistant", ai_draft)
            
            await client.send_message(CONTROL_GROUP_ID, "🚀 **Auto-reply sent successfully!**", reply_to=topic_id)
    except asyncio.CancelledError:
        logger.info(f"Auto-reply countdown cancelled for topic {topic_id} (Human override).")
    except Exception as e:
        logger.error(f"Critical error in auto_reply_countdown for topic {topic_id}: {e}")
        try:
            await client.send_message(CONTROL_GROUP_ID, f"❌ **Error during auto-reply:** {e}", reply_to=topic_id)
        except:
            pass

async def route_to_control_center(client: TelegramClient, event, is_new_thread=True):
    """
    Routes an intercepted message to the Command Center group.
    Creates a new Topic if it's a new conversation, otherwise replies in the existing Topic.
    """
    chat = await event.get_chat()
    sender = await event.get_sender()
    
    chat_id = chat.id
    user_id = sender.id if sender else chat_id
    
    chat_title = chat.title if hasattr(chat, 'title') else 'Direct Message'
    sender_name = sender.first_name if sender else 'Unknown User'

    topic_id = None

    # Generate Message Link
    message_id = event.message.id
    message_link = ""
    if hasattr(chat, 'username') and chat.username:
        message_link = f"https://t.me/{chat.username}/{message_id}"
    else:
        chat_id_str = str(chat_id)
        if chat_id_str.startswith("-100"):
            message_link = f"https://t.me/c/{chat_id_str[4:]}/{message_id}"
        elif chat_id_str.startswith("-"):
            # Older/smaller groups
            message_link = f"https://t.me/c/{chat_id_str[1:]}/{message_id}"
        else:
            # Direct Message without a username
            message_link = f"[Open Chat](tg://user?id={chat_id})"

    if is_new_thread:
        # Create a new Topic in the Control Group
        topic_title = f"{sender_name} | {chat_title}"
        try:
            result = await client(
                functions.channels.CreateForumTopicRequest(
                    channel=CONTROL_GROUP_ID,
                    title=topic_title[:128]
                )
            )
            topic_id = result.updates[0].id
            
            # Save state
            state.register_topic(chat_id, user_id, topic_id)
            logger.info(f"Created new topic {topic_id} for {sender_name}")
            
            # Send intro message to the new topic
            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            card_content = (
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"**NEW INCOMING MESSAGE**\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
                f"**Source:** {chat_title}\n"
                f"**Link:** {message_link if message_link else 'N/A'}\n"
                f"**From:** {sender_name} (`{user_id}`)\n"
                f"**Time:** {timestamp_str}\n\n"
                f"**Message:**\n"
                f"> {event.raw_text if event.raw_text else '*[No text content]*'}\n\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"**Status:** ✅ MESSAGE FETCHED\n"
                f"*Reply feature temporarily disabled.*"
            )
            await client.send_message(CONTROL_GROUP_ID, card_content, reply_to=topic_id)
            
        except Exception as e:
            logger.error(f"Failed to create topic or route message: {e}")
            return
            
    else:
        # Append to existing topic
        topic_id = state.get_topic_for_user(chat_id, user_id)
        if topic_id:
            try:
                # Cancel old auto-reply
                state.cancel_auto_reply(topic_id)
                # Mark as unresolved again
                state_topics = state.state["topics"]
                if str(topic_id) in state_topics:
                    state_topics[str(topic_id)]["status"] = "pending"
                    state.save_state()
                
                link_str = f"\n**Link:** {message_link}" if message_link else ""
                msg_content = f"**Follow-up from {sender_name}:**\n> {event.raw_text}{link_str}" if event.raw_text else f"**Follow-up from {sender_name}:** *[No text / Media only]*{link_str}"
                await client.send_message(CONTROL_GROUP_ID, msg_content, reply_to=topic_id)
                logger.info(f"Appended follow-up message to topic {topic_id}")
            except Exception as e:
                logger.error(f"Failed to route follow-up to topic: {e}")
                return

    # --- AI Drafting & Auto-Reply ---
    # Disabled for now as per instructions "till message fetching only"
    """
    if topic_id:
        try:
            # Generate the draft
            ai_draft = await generate_reply(event.raw_text, str(user_id))
            draft_msg = f"🤖 **AI Draft:**\n\n{ai_draft}\n\n*⏳ Auto-sending in 30s. Reply to override.*"
            await client.send_message(CONTROL_GROUP_ID, draft_msg, reply_to=topic_id)
            
            # Start the countdown
            task = asyncio.create_task(auto_reply_countdown(client, topic_id, chat_id, ai_draft, user_id))
            state.set_auto_reply_task(topic_id, task)
        except Exception as e:
            logger.error(f"Error generating AI draft for topic {topic_id}: {e}")
    """

