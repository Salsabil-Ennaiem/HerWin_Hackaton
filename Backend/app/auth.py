from uuid import UUID

from fastapi import Header, HTTPException
from typing import TypedDict


class AuthenticatedUser(TypedDict):
    email: str
    name: str


async def current_user(guest_id: str | None = Header(default=None, alias="X-Guest-ID")) -> AuthenticatedUser:
    try:
        normalized_id = str(UUID(guest_id)) if guest_id else None
    except ValueError:
        normalized_id = None
    if normalized_id is None:
        raise HTTPException(400, "A valid X-Guest-ID is required")

    return {"email": f"guest-{normalized_id}@local.herwin", "name": "Guest"}
