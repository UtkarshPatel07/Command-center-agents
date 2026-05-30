import os
import logging
from dotenv import load_dotenv

load_dotenv()

LOG_LEVEL_STR = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_LEVEL = getattr(logging, LOG_LEVEL_STR, logging.INFO)

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USERNAME = os.getenv("REDDIT_USERNAME")
REDDIT_PASSWORD = os.getenv("REDDIT_PASSWORD")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", f"windows:commandcenter:v1.0 (by u/{REDDIT_USERNAME})")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CONTROL_SUBREDDIT = os.getenv("CONTROL_SUBREDDIT")

if not all([REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, OPENAI_API_KEY, CONTROL_SUBREDDIT]):
    logging.error("Missing required environment variables. Please check your .env file.")
