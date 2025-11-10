#!/usr/bin/env python3

import os
import asyncio
from pymongo import MongoClient
from dotenv import load_dotenv

async def debug_auth():
    load_dotenv('backend/.env')
    mongo_url = os.getenv('MONGO_URL')
    client = MongoClient(mongo_url)
    db = client.hr_elevate
    
    username = "ET-MUM-00001"
    pin = "1234"
    
    print(f"Looking up user: {username}")
    user = db.users.find_one({"username": username})
    
    if not user:
        print("User not found!")
        return
    
    print(f"User found: {user}")
    print(f"User role: {user.get('role')}")
    
    if user.get("role") == "employee":
        print("User is employee")
        print(f"Stored PIN: {repr(user['pin'])}")
        print(f"Input PIN: {repr(pin)}")
        print(f"PIN match: {user['pin'] == pin}")
        
        # Check employee record
        employee_data = db.employees.find_one({"employee_id": user["employee_id"]})
        if not employee_data:
            print("Employee record not found!")
        else:
            print(f"Employee status: {employee_data.get('status', 'active')}")
    else:
        print(f"User role is not employee: {user.get('role')}")

if __name__ == "__main__":
    asyncio.run(debug_auth())