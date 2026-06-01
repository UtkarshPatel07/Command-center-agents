import os
import requests
import logging
from dotenv import load_dotenv

load_dotenv()

LINKEDIN_ACCESS_TOKEN = os.getenv("LINKEDIN_ACCESS_TOKEN")
LINKEDIN_AUTHOR_URN = os.getenv("LINKEDIN_AUTHOR_URN")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def post_to_linkedin(message: str, link: str = None) -> bool:
    """
    Posts a message and an optional link to LinkedIn using the v2/ugcPosts API.
    """
    if not LINKEDIN_ACCESS_TOKEN or not LINKEDIN_AUTHOR_URN:
        logger.error("Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN in .env")
        return False

    url = "https://api.linkedin.com/v2/ugcPosts"
    
    headers = {
        'Authorization': f'Bearer {LINKEDIN_ACCESS_TOKEN}',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
    }

    payload = {
        "author": LINKEDIN_AUTHOR_URN,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": message
                },
                "shareMediaCategory": "ARTICLE" if link else "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }

    if link:
        payload["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
            {
                "status": "READY",
                "originalUrl": link
            }
        ]

    try:
        logger.info(f"Attempting to post to LinkedIn ({LINKEDIN_AUTHOR_URN})...")
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"Successfully posted! LinkedIn Post ID: {result.get('id')}")
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to post to LinkedIn: {e}")
        if e.response is not None:
            logger.error(f"Response Content: {e.response.text}")
        return False
