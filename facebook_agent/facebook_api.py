import requests
import logging
from config import FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN

logger = logging.getLogger(__name__)

def post_to_facebook(message: str, link: str = None) -> bool:
    """
    Posts a message and an optional link to a Facebook Page using the Graph API.
    """
    if not FACEBOOK_PAGE_ID or not FACEBOOK_PAGE_ACCESS_TOKEN:
        logger.error("Missing Facebook Page ID or Access Token in config.")
        return False

    # Using v19.0 of the Graph API
    url = f"https://graph.facebook.com/v19.0/{FACEBOOK_PAGE_ID}/feed"
    
    payload = {
        'message': message,
        'access_token': FACEBOOK_PAGE_ACCESS_TOKEN
    }
    
    if link:
        payload['link'] = link

    try:
        logger.info(f"Attempting to post to Facebook Page {FACEBOOK_PAGE_ID}...")
        response = requests.post(url, data=payload)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"Successfully posted! Post ID: {result.get('id')}")
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to post to Facebook: {e}")
        if e.response is not None:
            logger.error(f"Response Content: {e.response.text}")
        return False
