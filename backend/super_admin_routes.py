"""
Super Admin Routes for Multi-Tenancy Management
Handles company creation, invitation system, and super admin operations
"""

from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from passlib.context import CryptContext
import os

# This will be set from server.py
db: Optional[AsyncIOMotorDatabase] = None
pwd_context: Optional[CryptContext] = None
User = None
Company = None
CompanyCreate = None
CompanyUpdate = None
Invitation = None
InvitationAccept = None
get_current_user = None

# Email configuration
SMTP_HOST = os.environ.get('SMTP_HOST')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
SMTP_FROM = os.environ.get('SMTP_FROM')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])


def require_super_admin(current_user = Depends(get_current_user)):
    """Dependency to ensure only super admin can access"""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user


async def send_invitation_email(email: str, company_name: str, admin_name: str, invitation_link: str):
    """Send invitation email to company admin"""
    try:
        message = MIMEMultipart("alternative")
        message["From"] = SMTP_FROM
        message["To"] = email
        message["Subject"] = f"Invitation to join {company_name} on Elevate Payroll"
        
        # HTML email body
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #4F46E5;">Welcome to Elevate Payroll!</h2>
                    
                    <p>Hello {admin_name},</p>
                    
                    <p>You have been invited to be the administrator for <strong>{company_name}</strong> on Elevate Payroll System.</p>
                    
                    <p>To accept this invitation and set up your account, please click the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{invitation_link}" 
                           style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Accept Invitation
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
                        {invitation_link}
                    </p>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                        This invitation will expire in 7 days.<br>
                        If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message.attach(MIMEText(html_body, "html"))
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        
        return True
    except Exception as e:
        print(f"Error sending invitation email: {e}")
        return False


@router.get("/companies")
async def get_companies(
    current_user = Depends(require_super_admin),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get all companies with optional search and filter"""
    query = {}
    
    if search:
        query["$or"] = [
            {"company_name": {"$regex": search, "$options": "i"}},
            {"contact_email": {"$regex": search, "$options": "i"}}
        ]
    
    if status_filter:
        query["status"] = status_filter
    
    companies = await db.companies.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(length=None)
    total = await db.companies.count_documents(query)
    
    return {
        "companies": companies,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/companies/{company_id}")
async def get_company(
    company_id: str,
    current_user = Depends(require_super_admin)
):
    """Get company details"""
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Get company statistics
    employee_count = await db.employees.count_documents({"company_id": company_id})
    user_count = await db.users.count_documents({"company_id": company_id})
    payroll_count = await db.payroll_runs.count_documents({"company_id": company_id})
    
    return {
        **company,
        "statistics": {
            "employee_count": employee_count,
            "user_count": user_count,
            "payroll_runs": payroll_count
        }
    }


@router.post("/companies")
async def create_company(
    company_data: CompanyCreate,
    current_user = Depends(require_super_admin)
):
    """Create a new company and send invitation to admin"""
    # Check if company with same email already exists
    existing_company = await db.companies.find_one({"contact_email": company_data.contact_email})
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this email already exists"
        )
    
    # Create company
    company_id = str(uuid.uuid4())
    company = {
        "company_id": company_id,
        "company_name": company_data.company_name,
        "company_logo_url": company_data.company_logo_url,
        "contact_email": company_data.contact_email,
        "phone": company_data.phone,
        "address": company_data.address,
        "admin_user_id": None,  # Will be set when admin accepts invitation
        "settings": company_data.settings.dict() if company_data.settings else {
            "working_days_config": {
                "sunday_off": True,
                "saturday_policy": "alternate",
                "week_start": "Monday"
            },
            "leave_policies": {
                "annual_leave": 15,
                "sick_leave": 10,
                "casual_leave": 8
            },
            "default_working_hours": {
                "start_time": "08:30",
                "end_time": "17:30",
                "total_hours": 9
            }
        },
        "status": "active",
        "subscription_info": {
            "plan": "basic",
            "start_date": datetime.now(timezone.utc).isoformat(),
            "status": "active"
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.companies.insert_one(company)
    
    # Create invitation
    invitation_token = str(uuid.uuid4())
    invitation = {
        "invitation_id": str(uuid.uuid4()),
        "company_id": company_id,
        "token": invitation_token,
        "email": company_data.admin_email,
        "admin_name": company_data.admin_name,
        "role": "admin",
        "status": "pending",
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "accepted_at": None
    }
    
    await db.invitations.insert_one(invitation)
    
    # Create invitation link
    invitation_link = f"{FRONTEND_URL}/accept-invitation?token={invitation_token}"
    
    # Try to send email
    email_sent = await send_invitation_email(
        company_data.admin_email,
        company_data.company_name,
        company_data.admin_name,
        invitation_link
    )
    
    return {
        "message": "Company created successfully",
        "company_id": company_id,
        "invitation_link": invitation_link,
        "email_sent": email_sent
    }


@router.put("/companies/{company_id}")
async def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    current_user = Depends(require_super_admin)
):
    """Update company details"""
    company = await db.companies.find_one({"company_id": company_id})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in company_data.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.companies.update_one(
            {"company_id": company_id},
            {"$set": update_data}
        )
    
    return {"message": "Company updated successfully"}


@router.delete("/companies/{company_id}")
async def deactivate_company(
    company_id: str,
    current_user = Depends(require_super_admin)
):
    """Deactivate a company (soft delete)"""
    company = await db.companies.find_one({"company_id": company_id})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    await db.companies.update_one(
        {"company_id": company_id},
        {"$set": {"status": "inactive", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Company deactivated successfully"}


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user = Depends(require_super_admin)):
    """Get super admin dashboard statistics"""
    total_companies = await db.companies.count_documents({"status": "active"})
    total_users = await db.users.count_documents({"role": {"$in": ["admin", "employee"]}})
    total_employees = await db.employees.count_documents({})
    total_payroll_runs = await db.payroll_runs.count_documents({})
    
    # Get recent companies
    recent_companies = await db.companies.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(length=None)
    
    return {
        "total_companies": total_companies,
        "total_users": total_users,
        "total_employees": total_employees,
        "total_payroll_runs": total_payroll_runs,
        "recent_companies": recent_companies
    }
