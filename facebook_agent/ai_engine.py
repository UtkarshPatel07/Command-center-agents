from openai import AsyncOpenAI
import logging
from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

if OPENAI_API_KEY:
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None

async def generate_facebook_caption(title: str, summary: str = None) -> str:
    """Generate an engaging Facebook caption using OpenAI."""
    if not openai_client:
        logger.warning("OpenAI client not initialized. Returning a simple text caption.")
        base_text = f"Check out our new post: {title}"
        if summary:
            base_text += f"\n\n{summary}"
        return base_text
        
    try:
        content_prompt = f"Blog Title: {title}"
        if summary:
            content_prompt += f"\nBlog Summary/Content: {summary}"
            
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a professional social media manager. Write an engaging, catchy Facebook post caption for a new blog post. Use appropriate emojis and a few relevant hashtags. Keep it concise but exciting. Do not include the link in the text, as it will be attached automatically."
                },
                {"role": "user", "content": content_prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error generating AI caption: {e}")
        # Fallback
        return f"Check out our new post: {title}\n\n#update"
