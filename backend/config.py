import os
from pathlib import Path
from dotenv import load_dotenv

# Get the project root directory
project_root = Path(__file__).parent.parent
backend_root = Path(__file__).parent

# Load environment variables from .env file
env_file = project_root / '.env'
if env_file.exists():
    load_dotenv(env_file)
    print(f"Loaded environment variables from {env_file}")
else:
    # Try to load from backend directory
    backend_env_file = backend_root / '.env'
    if backend_env_file.exists():
        load_dotenv(backend_env_file)
        print(f"Loaded environment variables from {backend_env_file}")
    else:
        print("No .env file found. Please create one with your API keys.")

# Verify important environment variables
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
if not YOUTUBE_API_KEY:
    print("Warning: YOUTUBE_API_KEY not found in environment variables")

print("Configuration loaded successfully")
