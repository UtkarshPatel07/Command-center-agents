from openai import AsyncOpenAI
import logging
from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

if OPENAI_API_KEY:
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None

async def generate_ai_reply(message_content: str, sender: str) -> str:
    """Generate a candidate reply using OpenAI."""
    if not openai_client:
        logger.error("OpenAI client not initialized.")
        return "I'm currently unable to generate a response. Please stand by."
        
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a helpful assistant responding to Reddit messages on behalf of the user. Keep your responses natural, conversational, and concise, fitting for Reddit. Do not include signature or sign-offs."
                },
                {"role": "user", "content": f"Message from {sender}: {message_content}"}
            ],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error generating AI reply: {e}")
        return "Sorry, I encountered an error generating a reply."
