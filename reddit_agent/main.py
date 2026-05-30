import asyncio
import logging
import asyncpraw
from config import (
    REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, 
    REDDIT_PASSWORD, REDDIT_USER_AGENT, CONTROL_SUBREDDIT
)
from ai_engine import generate_ai_reply
from control_manager import create_control_post, handle_human_override
from state_manager import add_pending_reply, resolve_reply

logger = logging.getLogger(__name__)

async def llm_auto_send(submission_id: str, original_message, ai_reply: str, delay: int = 30):
    """Path A: The LLM auto-approval timer."""
    try:
        logger.info(f"Started {delay}s LLM timer for submission {submission_id}")
        await asyncio.sleep(delay)
        
        # Try to claim resolution
        if resolve_reply(submission_id):
            logger.info(f"LLM timer finished. Auto-sending reply for {submission_id}...")
            # We won the race! Send the reply.
            await original_message.reply(ai_reply)
            logger.info(f"Sent LLM reply to u/{original_message.author.name}")
            
            # Optionally, update the Reddit post to indicate it was sent
            # Note: For simplicity, we just log it. Updating the post requires fetching it.
    except asyncio.CancelledError:
        logger.info(f"LLM auto-send cancelled for {submission_id} (Human Override)")
    except Exception as e:
        logger.error(f"Error in LLM auto-send for {submission_id}: {e}")

async def process_incoming_message(reddit, message):
    """Handle a new incoming private message."""
    logger.info(f"New message from u/{message.author.name}: {message.body[:50]}...")
    
    # 1. Generate AI Reply
    ai_reply = await generate_ai_reply(message.body, message.author.name)
    
    # 2. Create Control Post
    submission_id = await create_control_post(reddit, message, ai_reply)
    if not submission_id:
        return

    # 3. Start LLM Timer Task (Path A)
    llm_task = asyncio.create_task(llm_auto_send(submission_id, message, ai_reply, delay=30))
    
    # 4. Save to State
    add_pending_reply(submission_id, message, message.author.name, ai_reply, llm_task)

async def listen_inbox(reddit):
    """Monitor inbox for new messages."""
    logger.info("Listening for new Inbox messages...")
    async for item in reddit.inbox.stream(skip_existing=True):
        if hasattr(item, 'author') and item.author:
            # Check if it's a private message (not a comment reply to us)
            # You can expand this to handle comment replies too!
            if getattr(item, 'was_comment', False) == False:
                await process_incoming_message(reddit, item)
                await item.mark_read()

async def listen_control_subreddit(reddit):
    """Monitor the control subreddit for human overrides (comments)."""
    logger.info(f"Listening for overrides in r/{CONTROL_SUBREDDIT}...")
    subreddit = await reddit.subreddit(CONTROL_SUBREDDIT)
    async for comment in subreddit.stream.comments(skip_existing=True):
        if comment.author.name.lower() == REDDIT_USERNAME.lower():
            # Don't override ourselves if we comment (e.g. status updates)
            continue
            
        await handle_human_override(comment)

async def main():
    if not all([REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD]):
        logger.error("Missing Reddit credentials. Exiting.")
        return

    logger.info("Starting Reddit Command Center...")
    
    reddit = asyncpraw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        password=REDDIT_PASSWORD,
        user_agent=REDDIT_USER_AGENT,
        username=REDDIT_USERNAME,
    )

    try:
        # Verify login
        me = await reddit.user.me()
        logger.info(f"Logged in successfully as u/{me.name}")
        
        # Start both listeners concurrently
        await asyncio.gather(
            listen_inbox(reddit),
            listen_control_subreddit(reddit)
        )
    except Exception as e:
        logger.error(f"Critical error: {e}")
    finally:
        await reddit.close()

if __name__ == "__main__":
    asyncio.run(main())
