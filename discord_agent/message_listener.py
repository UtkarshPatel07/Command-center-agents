import logging
import discord
from config import CONTROL_SERVER_ID, TARGET_CHANNEL_IDS
from thread_manager import create_control_thread, append_to_control_thread
from reply_dispatcher import handle_manual_reply
from state_manager import state
from priority_engine import is_target_question

logger = logging.getLogger(__name__)

async def process_message(client: discord.Client, message: discord.Message):
    """
    Main routing logic for all incoming messages.
    """
    # 1. Ignore bot messages
    if message.author.bot:
        return

    # 2. Handle messages in Control Server
    if message.guild and message.guild.id == CONTROL_SERVER_ID:
        # Check if it's a message in a tracked thread
        if isinstance(message.channel, discord.Thread) and state.get_state(message.channel.id):
            # Only process if it's the account owner replying
            if message.author.id == client.user.id:
                # Prevent infinite loops from the bot's own status messages
                bot_prefixes = ("✅", "🚀", "⚠️", "⏰", "🤖", "Incoming message", "━━━━━━━━━━━━━━━━━━━━━━", "⏳", "**Follow-up")
                if message.content.startswith(bot_prefixes):
                    return
                
                logger.info("Operator reply detected in Control Thread, but replies are temporarily disabled.")
                # await handle_manual_reply(message)
        return

    # 3. Ignore own messages in external servers to prevent loops
    if message.author.id == client.user.id:
       return

    # 4. Check if there's an active thread for this user
    active_thread_id = state.get_thread_for_user(message.author.id)

    if active_thread_id:
        logger.info(f"Routing follow-up message from {message.author.name} to existing thread {active_thread_id}")
        await append_to_control_thread(client, message, active_thread_id)
        return

    # 5. Filter messages to only target questions
    # Bypass filter for Direct Messages so the AI can freely converse
    is_dm = message.guild is None
    
    # Enforce Target Channel filtering for external servers
    if not is_dm and message.channel.id not in TARGET_CHANNEL_IDS:
        return

    if not is_dm and not is_target_question(message.content):
        logger.debug(f"Ignored non-target message from {message.author.name}")
        return

    # 6. Handle incoming target questions from other servers/DMs
    logger.info(f"Intercepted target question from {message.author.name} in {message.guild.name if message.guild else 'DM'}")
    await create_control_thread(client, message)

