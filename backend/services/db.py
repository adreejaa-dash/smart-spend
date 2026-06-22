import os
import sys
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


def _build_client() -> AsyncIOMotorClient:
    """
    Build the Motor client with the correct TLS configuration per platform.

    macOS:
        Python (from python.org) does not link the ssl module to the macOS
        system keychain.  Without an explicit CA bundle the driver raises
        CERTIFICATE_VERIFY_FAILED.  We pass certifi's bundle to fix this.

    Linux (Render, Docker, CI):
        The system OpenSSL already has Atlas-trusted root CAs in its store.
        Passing tlsCAFile on Linux causes a TLS stack conflict between
        certifi's bundle path and the system OpenSSL build, which makes
        Atlas respond with TLSV1_ALERT_INTERNAL_ERROR and drops the
        handshake.  Omitting tlsCAFile lets the driver use the system CA
        store, which works correctly.
    """
    kwargs = {}
    if sys.platform == "darwin":
        import certifi
        kwargs["tlsCAFile"] = certifi.where()

    print(
        f"[DB] Connecting to MongoDB Atlas "
        f"(platform={sys.platform}, tlsCAFile={'certifi' if kwargs else 'system'})",
        flush=True,
    )
    return AsyncIOMotorClient(MONGODB_URI, **kwargs)


def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = _build_client()
    return client


def get_db():
    return get_client()[DB_NAME]["expenses"]
