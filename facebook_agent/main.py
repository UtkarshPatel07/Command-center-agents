from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uvicorn

from ai_engine import generate_facebook_caption
from facebook_api import post_to_facebook
from config import logger

app = FastAPI(title="Facebook Automation Agent")

class PublishRequest(BaseModel):
    title: str
    url: str
    summary: str = None
    use_ai: bool = True

async def process_publish_task(req: PublishRequest):
    """Background task to generate caption and post to Facebook."""
    logger.info(f"Processing publish task for: {req.title}")
    
    # 1. Generate Caption
    if req.use_ai:
        caption = await generate_facebook_caption(req.title, req.summary)
    else:
        caption = f"{req.title}\n\n{req.summary if req.summary else ''}"
        
    logger.info(f"Generated Caption: \n{caption}")
    
    # 2. Post to Facebook 
    success = post_to_facebook(message=caption, link=req.url)
    if success:
        logger.info("Background task completed successfully.")
    else:
        logger.error("Background task failed to post to Facebook.")

@app.post("/webhook/publish")
async def publish_to_facebook(req: PublishRequest, background_tasks: BackgroundTasks):
    """
    Webhook endpoint to trigger a Facebook post.
    Will process the AI generation and posting in the background.
    """
    logger.info(f"Received webhook request to publish: {req.title}")
    
    # Add to background tasks to return 200 OK immediately to the caller
    background_tasks.add_task(process_publish_task, req)
    
    return {"status": "success", "message": "Post request received and is being processed in the background."}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "facebook_agent"}

if __name__ == "__main__":
    logger.info("Starting FastAPI Webhook Server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
