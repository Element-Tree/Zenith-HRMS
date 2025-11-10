"""
Invitation Routes for Multi-Tenancy System
Handles invitation verification and acceptance
"""

from fastapi import APIRouter, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from datetime import datetime, timezone
import uuid
from passlib.context import CryptContext

# This will be set from server.py
db: Optional[AsyncIOMotorDatabase] = None
pwd_context: Optional[CryptContext] = None
InvitationAccept = None
create_access_token = None
create_refresh_token = None

router = APIRouter(prefix="/invitations", tags=["Invitations"])


@router.get("/verify/{token}")
async def verify_invitation(token: str):
    """Verify invitation token and get invitation details"""
    invitation = await db.invitations.find_one({"token": token}, {"_id": 0})
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if invitation is expired
    expires_at = datetime.fromisoformat(invitation["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    # Check if invitation is already accepted
    if invitation["status"] == "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been accepted"
        )
    
    # Get company details
    company = await db.companies.find_one({"company_id": invitation["company_id"]}, {"_id": 0})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return {
        "invitation": {
            "email": invitation["email"],
            "admin_name": invitation["admin_name"],
            "company_name": company["company_name"],
            "company_logo_url": company.get("company_logo_url"),
            "expires_at": invitation["expires_at"]
        }
    }


@router.post("/accept")
async def accept_invitation(invitation_data: InvitationAccept):
    """Accept invitation and create admin user"""
    invitation = await db.invitations.find_one({"token": invitation_data.token}, {"_id": 0})
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if invitation is expired
    expires_at = datetime.fromisoformat(invitation["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    # Check if invitation is already accepted
    if invitation["status"] == "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been accepted"
        )
    
    # Check if user with this email already exists
    existing_user = await db.users.find_one({"email": invitation["email"]})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create admin user
    user_id = str(uuid.uuid4())
    # Generate username from email (before @)
    username = invitation["email"].split("@")[0] + "_" + invitation["company_id"][:8]
    
    admin_user = {
        "id": user_id,
        "username": username,
        "email": invitation["email"],
        "role": "admin",
        "company_id": invitation["company_id"],
        "employee_id": None,
        "hashed_password": pwd_context.hash(invitation_data.password),
        "pin": None,
        "is_active": True,
        "last_login": None,
        "last_login_ip": None,
        "last_login_device": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_user)
    
    # Update company with admin_user_id
    await db.companies.update_one(
        {"company_id": invitation["company_id"]},
        {"$set": {"admin_user_id": user_id}}
    )
    
    # Mark invitation as accepted
    await db.invitations.update_one(
        {"token": invitation_data.token},
        {"$set": {
            "status": "accepted",
            "accepted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create tokens for auto-login
    access_token = create_access_token(
        data={"sub": username, "role": "admin", "company_id": invitation["company_id"]}
    )
    refresh_token = create_refresh_token(
        data={"sub": username, "role": "admin", "company_id": invitation["company_id"]}
    )
    
    return {
        "message": "Invitation accepted successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": username,
            "email": invitation["email"],
            "role": "admin",
            "company_id": invitation["company_id"]
        }
    }


@router.post("/resend/{company_id}")
async def resend_invitation(company_id: str):
    """Resend invitation email for a company (super admin only)"""
    # Find pending invitation for this company
    invitation = await db.invitations.find_one(
        {"company_id": company_id, "status": "pending"},
        {"_id": 0}
    )
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending invitation found for this company"
        )
    
    # Get company details
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Create new invitation link
    invitation_link = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/accept-invitation?token={invitation['token']}"
    
    return {
        "message": "Invitation link generated",
        "invitation_link": invitation_link,
        "email": invitation["email"],
        "company_name": company["company_name"]
    }
