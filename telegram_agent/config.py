import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
LOG_LEVEL_STR = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_LEVEL = getattr(logging, LOG_LEVEL_STR, logging.INFO)

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Core Settings
TG_API_ID = os.getenv("TG_API_ID")
TG_API_HASH = os.getenv("TG_API_HASH")
TG_SESSION_NAME = os.getenv("TG_SESSION_NAME", "command_center_session")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not TG_API_ID or not TG_API_HASH:
    logging.error("TG_API_ID or TG_API_HASH is missing in environment variables.")

# Control Group ID where topics will be created
# In Telegram, supergroups start with -100
CONTROL_GROUP_ID = os.getenv("CONTROL_GROUP_ID")
if CONTROL_GROUP_ID:
    try:
        CONTROL_GROUP_ID = int(CONTROL_GROUP_ID)
    except ValueError:
        logging.error("CONTROL_GROUP_ID must be a valid integer starting with -100.")
else:
    logging.error("CONTROL_GROUP_ID is missing. The Command Center needs a group to route messages to.")

# List of target chats to monitor (similar to Discord's TARGET_CHANNEL_IDS)
# Can be chat IDs, usernames, or invite links
TARGET_CHATS = [
    # Example:
    # -1001234567890,
    # "some_crypto_group"
]
