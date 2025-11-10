"""
Script to sync MongoDB subscription plans with Razorpay
Creates Razorpay plans for each MongoDB plan if not already exists
"""
import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import razorpay

# Load environment variables
load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")


async def sync_plans():
    """Sync MongoDB plans with Razorpay"""
    # Initialize MongoDB
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    plans_collection = db.subscription_plans
    
    # Initialize Razorpay client
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    
    print("🔄 Starting Razorpay plan sync...")
    print(f"Using Razorpay Key: {RAZORPAY_KEY_ID}")
    
    # Fetch all active plans from MongoDB
    plans = await plans_collection.find({"is_active": True}).to_list(length=None)
    print(f"📋 Found {len(plans)} active plans in MongoDB")
    
    for plan in plans:
        plan_name = plan["plan_name"]
        plan_id = plan["plan_id"]
        
        print(f"\n📦 Processing plan: {plan_name} ({plan_id})")
        
        # Create monthly plan in Razorpay if not exists
        if not plan.get("razorpay_plan_id_monthly"):
            try:
                # Convert price to paise (Razorpay uses smallest currency unit)
                monthly_amount = int(plan["monthly_price"] * 100)
                
                razorpay_plan_data = {
                    "period": "monthly",
                    "interval": 1,
                    "item": {
                        "name": f"{plan_name} - Monthly",
                        "amount": monthly_amount,
                        "currency": plan["currency"],
                        "description": plan["description"]
                    }
                }
                
                print(f"  Creating monthly plan in Razorpay...")
                print(f"  Amount: ₹{plan['monthly_price']} ({monthly_amount} paise)")
                razorpay_plan = razorpay_client.plan.create(razorpay_plan_data)
                razorpay_plan_id_monthly = razorpay_plan["id"]
                
                # Update MongoDB with Razorpay plan ID
                await plans_collection.update_one(
                    {"plan_id": plan_id},
                    {"$set": {"razorpay_plan_id_monthly": razorpay_plan_id_monthly}}
                )
                
                print(f"  ✅ Monthly plan created: {razorpay_plan_id_monthly}")
            except Exception as e:
                print(f"  ❌ Error creating monthly plan: {e}")
        else:
            print(f"  ✓ Monthly plan already exists: {plan['razorpay_plan_id_monthly']}")
        
        # Create annual plan in Razorpay if not exists
        if not plan.get("razorpay_plan_id_annual"):
            try:
                # Convert price to paise
                annual_amount = int(plan["annual_price"] * 100)
                
                razorpay_plan_data = {
                    "period": "yearly",
                    "interval": 1,
                    "item": {
                        "name": f"{plan_name} - Annual",
                        "amount": annual_amount,
                        "currency": plan["currency"],
                        "description": f"{plan['description']} (Annual billing - Save 20%)"
                    }
                }
                
                print(f"  Creating annual plan in Razorpay...")
                print(f"  Amount: ₹{plan['annual_price']} ({annual_amount} paise)")
                razorpay_plan = razorpay_client.plan.create(razorpay_plan_data)
                razorpay_plan_id_annual = razorpay_plan["id"]
                
                # Update MongoDB with Razorpay plan ID
                await plans_collection.update_one(
                    {"plan_id": plan_id},
                    {"$set": {"razorpay_plan_id_annual": razorpay_plan_id_annual}}
                )
                
                print(f"  ✅ Annual plan created: {razorpay_plan_id_annual}")
            except Exception as e:
                print(f"  ❌ Error creating annual plan: {e}")
        else:
            print(f"  ✓ Annual plan already exists: {plan['razorpay_plan_id_annual']}")
    
    print("\n✨ Razorpay plan sync completed!")
    mongo_client.close()


if __name__ == "__main__":
    asyncio.run(sync_plans())
