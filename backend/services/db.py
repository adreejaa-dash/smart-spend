import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
if not MONGODB_URI:
    raise ValueError(
        "MONGODB_URI environment variable is not set. "
        "Add it to backend/.env for local dev or to Render environment variables for production."
    )
DB_NAME = "smartspend"

client: AsyncIOMotorClient = None


def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = AsyncIOMotorClient(MONGODB_URI, tlsCAFile=certifi.where())
    return client


def get_db():
    return get_client()[DB_NAME]["expenses"]
