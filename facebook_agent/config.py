import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Facebook settings
FACEBOOK_PAGE_ID = os.getenv("FACEBOOK_PAGE_ID")
FACEBOOK_PAGE_ACCESS_TOKEN = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN")

# OpenAI settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if not FACEBOOK_PAGE_ID or not FACEBOOK_PAGE_ACCESS_TOKEN:
    logger.warning("FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN is missing in the .env file.")

if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY is missing in the .env file. AI caption generation will be disabled.")
