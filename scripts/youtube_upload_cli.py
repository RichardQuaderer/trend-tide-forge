#!/usr/bin/env python3
import argparse
import json
import os
import sys
import webbrowser
from pathlib import Path

# Dependencies: google-api-python-client, google-auth-oauthlib, google-auth-httplib2, httplib2
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError
import google_auth_oauthlib.flow
import google_auth_httplib2
import httplib2

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def find_client_secret() -> str:
    root = Path.cwd()
    root_file = root / "client_secret.json"
    if root_file.exists():
        return str(root_file)
    print(json.dumps({"error": "client_secret.json not found in project root or .ci"}))
    sys.exit(2)


def authenticate(client_secret_path: str):
    flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
        client_secret_path, scopes=SCOPES
    )
    creds = None
    try:
        creds = flow.run_local_server(port=0, prompt="consent")
    except Exception:
        # Fallback to manual flow
        try:
            auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline", include_granted_scopes="true")
            try:
                webbrowser.open(auth_url)
            except Exception:
                pass
            print("Please open this URL and authorize:")
            print(auth_url)
            redirect_response = input("Paste the full redirect URL here: ").strip()
            flow.fetch_token(authorization_response=redirect_response)
            creds = flow.credentials
        except Exception as e:
            print(json.dumps({"error": f"OAuth failed: {e}"}))
            sys.exit(3)

    http = httplib2.Http(timeout=300)
    authed_http = google_auth_httplib2.AuthorizedHttp(creds, http=http)
    return build("youtube", "v3", http=authed_http)


def upload_simple(youtube, file_path: str, title: str, description: str, tags: list[str]):
    request_body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
        },
        "status": {"privacyStatus": "public"},
    }
    media_file = MediaFileUpload(file_path, resumable=False)
    request = youtube.videos().insert(part="snippet,status", body=request_body, media_body=media_file)
    try:
        response = request.execute(num_retries=3)
    except HttpError as err:
        print(json.dumps({"error": str(err)}))
        sys.exit(4)
    return response


def main():
    parser = argparse.ArgumentParser(description="Upload a video to YouTube")
    parser.add_argument("--file", required=True, help="Path to video file")
    parser.add_argument("--title", required=True, help="Video title")
    parser.add_argument("--description", default="", help="Video description")
    parser.add_argument("--tags", default="", help="Comma-separated hashtags/tags")
    args = parser.parse_args()

    file_path = os.path.abspath(args.file)
    if not os.path.exists(file_path):
        print(json.dumps({"error": "file not found"}))
        sys.exit(2)

    tags = [t.strip() for t in args.tags.split(",") if t.strip()] if args.tags else []

    client_secret = find_client_secret()
    yt = authenticate(client_secret)
    resp = upload_simple(yt, file_path, args.title, args.description, tags)
    vid = resp.get("id")
    if not vid:
        print(json.dumps({"error": "no video id returned"}))
        sys.exit(5)
    print(json.dumps({"videoId": vid}))


if __name__ == "__main__":
    main() 