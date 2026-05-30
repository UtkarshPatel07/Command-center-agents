import logging
import asyncio
from config import CONTROL_SUBREDDIT
from state_manager import resolve_reply, cancel_llm_task

logger = logging.getLogger(__name__)

async def create_control_post(reddit, message, ai_reply: str) -> str:
    """
    Create a new post in the control subreddit for dual-approval.
    Returns the submission ID.
    """
    try:
        subreddit = await reddit.subreddit(CONTROL_SUBREDDIT)
        
        # Build the post title and body
        title = f"Message from u/{message.author.name}"
        
        body = f"**Source:** Private Message\n"
        body += f"**From:** u/{message.author.name}\n\n"
        body += f"**Message:**\n> {message.body}\n\n"
        body += f"---\n\n"
        body += f"**🤖 AI Suggested Reply:**\n> {ai_reply}\n\n"
        body += f"---\n\n"
        body += f"⏳ **Auto-sending in 30s unless you comment below to override.**\n"
        body += f"Type your comment to cancel the LLM and send yours instead."
        
        # Submit the post
        submission = await subreddit.submit(title, selftext=body)
        logger.info(f"Created control post: {submission.id}")
        return submission.id
    except Exception as e:
        logger.error(f"Failed to create control post: {e}")
        return None

async def handle_human_override(comment):
    """
    Handle a human commenting on a control post.
    """
    submission_id = comment.submission.id
    
    # Try to claim the resolution
    if not resolve_reply(submission_id):
        # Already resolved by LLM
        try:
            await comment.reply("⚠️ Too late! The AI reply was already sent.")
        except Exception:
            pass
        return
        
    # Successfully claimed by human
    cancel_llm_task(submission_id)
    logger.info(f"Human override triggered on submission {submission_id}")
    
    # Send the human's reply to the original user
    from state_manager import get_state
    state = get_state(submission_id)
    if state:
        original_message = state['original_message']
        try:
            await original_message.reply(comment.body)
            logger.info(f"Sent human override reply to u/{state['sender']}")
            await comment.reply("✅ Override successful. Your reply was sent!")
        except Exception as e:
            logger.error(f"Failed to send human reply: {e}")
            await comment.reply(f"❌ Failed to send your reply: {e}")
