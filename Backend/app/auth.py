import os
import time

import httpx
from fastapi import Header, HTTPException
from typing import TypedDict


class AuthenticatedUser(TypedDict):
    email: str
    name: str
    exp: int


_cache: dict[str, AuthenticatedUser] = {}


async def current_user(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    token = (authorization or "").removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(401, "Login required")

    cached = _cache.get(token)
    if cached and cached["exp"] > time.time():
        return cached
    _cache.pop(token, None)

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(503, "Google authentication is not configured")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": token},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(503, "Google token verification is unavailable") from exc

    try:
        data = response.json() if response.status_code == 200 else {}
        if not isinstance(data, dict):
            raise ValueError("Google returned a non-object token response")
        expires_at = int(data.get("exp", 0))
    except (ValueError, TypeError):
        raise HTTPException(503, "Google token verification returned an invalid response")
    email = data.get("email")
    if (
        data.get("aud") != client_id
        or data.get("iss") not in ("accounts.google.com", "https://accounts.google.com")
        or str(data.get("email_verified")).lower() != "true"
        or not isinstance(email, str)
        or not email.strip()
        or expires_at <= time.time()
    ):
        raise HTTPException(401, "Invalid Google token")

    user = {
        "email": email.strip().casefold(),
        "name": str(data.get("name") or ""),
        "exp": expires_at,
    }
    if len(_cache) > 1000:
        _cache.clear()
    _cache[token] = user
    return user
