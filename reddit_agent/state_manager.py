import asyncio
import logging

logger = logging.getLogger(__name__)

# Dictionary to hold pending replies and their asyncio Tasks
# Key: Subreddit Submission ID (string)
# Value: Dict with original_message, sender, ai_reply, llm_task, resolved flag
pending_replies = {}

def add_pending_reply(submission_id: str, message, sender: str, ai_reply: str, task: asyncio.Task):
    """Add a new message to the state tracking."""
    pending_replies[submission_id] = {
        'original_message': message,
        'sender': sender,
        'ai_reply': ai_reply,
        'llm_task': task,
        'resolved': False
    }
    logger.debug(f"Added pending reply for submission {submission_id}")

def resolve_reply(submission_id: str) -> bool:
    """
    Mark a reply as resolved. Returns True if successfully claimed, 
    False if already resolved.
    """
    state = pending_replies.get(submission_id)
    if not state or state['resolved']:
        return False
    state['resolved'] = True
    return True

def cancel_llm_task(submission_id: str):
    """Cancel the pending LLM asyncio.Task if a human overrides."""
    state = pending_replies.get(submission_id)
    if state and not state['resolved'] and not state['llm_task'].done():
        state['llm_task'].cancel()
        logger.info(f"Cancelled LLM task for submission {submission_id}")

def get_state(submission_id: str) -> dict:
    return pending_replies.get(submission_id)
