import asyncio
import logging
import discord
from aiohttp import web
from config import DISCORD_TOKEN
from message_listener import process_message

logger = logging.getLogger(__name__)

class CommandCenterClient(discord.Client):
    def __init__(self):
        super().__init__()
        self.web_server_started = False

    async def start_web_server(self):
        app = web.Application()
        app.add_routes([
            web.get('/api/channels', self.handle_get_channels),
            web.options('/api/channels', self.handle_options_channels)
        ])
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 8080)
        await site.start()
        logger.info("Web API server started on http://0.0.0.0:8080/api/channels")

    async def handle_options_channels(self, request):
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
        return web.Response(headers=headers)

    async def handle_get_channels(self, request):
        guild_id_str = request.query.get('guild_id')
        server_name = request.query.get('server_name')
        
        headers = {
            "Access-Control-Allow-Origin": "*",
        }
        
        if not guild_id_str and not server_name:
            return web.json_response({"error": "Must provide guild_id or server_name parameter"}, status=400, headers=headers)
        
        guild = None
        
        if guild_id_str:
            try:
                guild_id = int(guild_id_str)
                guild = self.get_guild(guild_id)
            except ValueError:
                return web.json_response({"error": "Invalid guild_id format"}, status=400, headers=headers)
        elif server_name:
            # Case-insensitive search for server name
            guild = discord.utils.find(lambda g: g.name.lower() == server_name.lower(), self.guilds)
            
        if not guild:
            return web.json_response({"error": "Guild/Server not found or bot does not have access"}, status=404, headers=headers)
            
        channels = []
        for channel in guild.text_channels:
            channels.append({
                "channel_name": channel.name,
                "channel_id": channel.id
            })
            
        return web.json_response(channels, headers=headers)

    async def on_ready(self):
        logger.info(f"Logged in as {self.user.name}#{self.user.discriminator} (ID: {self.user.id})")
        logger.info("Command Center Prototype is active and monitoring...")
        
        if not self.web_server_started:
            self.loop.create_task(self.start_web_server())
            self.web_server_started = True

    async def on_message(self, message: discord.Message):
        # Route to processing pipeline
        await process_message(self, message)

def main():
    if not DISCORD_TOKEN:
        logger.error("Cannot start bot without DISCORD_TOKEN. Please check your .env file.")
        return

    logger.info("Starting Discord Command Center...")
    client = CommandCenterClient()
    
    try:
        # Use run() for discord.py-self
        client.run(DISCORD_TOKEN)
    except discord.errors.LoginFailure:
        logger.error("Improper token has been passed. Check your DISCORD_TOKEN.")
    except Exception as e:
        logger.error(f"Critical error: {e}")

if __name__ == "__main__":
    main()
