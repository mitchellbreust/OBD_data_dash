#!/usr/bin/env python3
"""
Test script for OBD Dashboard API
This script demonstrates how to use the API endpoints
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:5000"

def test_api():
    """Test the API endpoints"""
    
    print("🚀 Testing OBD Dashboard API")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API. Make sure the server is running.")
        return
    
    # Test 2: Get supported data types
    print("\n2. Getting supported data types...")
    response = requests.get(f"{BASE_URL}/supported-data")
    print(f"Status: {response.status_code}")
    print(f"Supported data types: {response.json()['supported_data_types']}")
    
    # Test 3: Register a new user
    print("\n3. Registering a new user...")
    register_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/register", json=register_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test 4: Login
    print("\n4. Logging in...")
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        session_token = response.json()['session_token']
        headers = {"Authorization": f"Bearer {session_token}"}
        
        # Test 5: Get data (should be empty for new user)
        print("\n5. Getting user data...")
        response = requests.get(f"{BASE_URL}/data", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test 6: Get data with date filter
        print("\n6. Getting data with date filter...")
        response = requests.get(f"{BASE_URL}/data?date=21-10-2025", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test 7: Get specific data types
        print("\n7. Getting specific data types...")
        response = requests.get(f"{BASE_URL}/data?data_types=speed&data_types=rpm", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test 8: Logout
        print("\n8. Logging out...")
        response = requests.post(f"{BASE_URL}/logout", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    
    print("\n✅ API testing completed!")

if __name__ == "__main__":
    test_api()
