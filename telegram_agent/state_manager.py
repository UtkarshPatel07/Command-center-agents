import json
import os
import logging

logger = logging.getLogger(__name__)

class StateManager:
    def __init__(self, state_file="state.json"):
        self.state_file = state_file
        self.state = self.load_state()
        self.tasks = {} # In-memory storage for asyncio Tasks

    def load_state(self):
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading state: {e}")
        return {
            "threads": {}, # source_chat_id_user_id -> topic_id
            "topics": {}   # topic_id -> source_info
        }

    def save_state(self):
        try:
            with open(self.state_file, "w") as f:
                json.dump(self.state, f, indent=4)
        except Exception as e:
            logger.error(f"Error saving state: {e}")

    def get_topic_for_user(self, source_chat_id, user_id):
        key = f"{source_chat_id}_{user_id}"
        return self.state["threads"].get(key)

    def register_topic(self, source_chat_id, user_id, topic_id):
        key = f"{source_chat_id}_{user_id}"
        self.state["threads"][key] = topic_id
        self.state["topics"][str(topic_id)] = {
            "source_chat_id": source_chat_id,
            "user_id": user_id,
            "status": "pending"
        }
        self.save_state()

    def get_source_for_topic(self, topic_id):
        return self.state["topics"].get(str(topic_id))

    def mark_resolved(self, topic_id):
        topic_id_str = str(topic_id)
        if topic_id_str in self.state["topics"]:
            self.state["topics"][topic_id_str]["status"] = "resolved"
            self.save_state()

    def is_resolved(self, topic_id):
        topic = self.state["topics"].get(str(topic_id))
        return topic and topic["status"] == "resolved"

    def set_auto_reply_task(self, topic_id, task):
        self.tasks[str(topic_id)] = task

    def cancel_auto_reply(self, topic_id):
        task = self.tasks.get(str(topic_id))
        if task:
            task.cancel()
            del self.tasks[str(topic_id)]
            logger.info(f"Cancelled auto-reply task for topic {topic_id}")

state = StateManager()
