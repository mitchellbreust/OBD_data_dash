#!/usr/bin/env python3
"""
Test script for OBD Data Upload API
This script demonstrates how to use the upload endpoints
"""

import requests
import json
import os
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:5000"

def test_upload_api():
    """Test the upload API endpoints"""
    
    print("🚀 Testing OBD Data Upload API")
    print("=" * 50)
    
    # First, login to get session token
    print("\n1. Logging in...")
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if response.status_code != 200:
        print("❌ Login failed. Please register first or check credentials.")
        return
    
    session_token = response.json()['session_token']
    headers = {"Authorization": f"Bearer {session_token}"}
    print("✅ Login successful")
    
    # Test 2: Preview upload (using existing CSV file)
    print("\n2. Testing file preview...")
    csv_file_path = "21-October-2025.csv"
    
    if os.path.exists(csv_file_path):
        with open(csv_file_path, 'rb') as f:
            files = {'file': (csv_file_path, f, 'text/csv')}
            response = requests.post(f"{BASE_URL}/data/upload/preview", 
                                   files=files, headers=headers)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            preview_data = response.json()
            print(f"✅ File preview successful")
            print(f"   - Valid: {preview_data['is_valid']}")
            print(f"   - Supported fields: {list(preview_data['supported_fields_found'].keys())}")
            print(f"   - Sample rows: {len(preview_data['sample_data'])}")
        else:
            print(f"❌ Preview failed: {response.json()}")
    else:
        print(f"❌ CSV file not found: {csv_file_path}")
    
    # Test 3: Upload single CSV file
    print("\n3. Testing single file upload...")
    if os.path.exists(csv_file_path):
        with open(csv_file_path, 'rb') as f:
            files = {'files': (csv_file_path, f, 'text/csv')}
            response = requests.post(f"{BASE_URL}/data/upload", 
                                   files=files, headers=headers)
        
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 207]:
            upload_data = response.json()
            print(f"✅ Upload successful")
            print(f"   - Files processed: {upload_data['summary']['total_files_processed']}")
            print(f"   - Rows processed: {upload_data['summary']['total_rows_processed']}")
            print(f"   - Successful files: {upload_data['summary']['successful_files']}")
            print(f"   - Failed files: {upload_data['summary']['failed_files']}")
            
            if upload_data['success']:
                for success in upload_data['success']:
                    print(f"   - {success['file']}: {success['rows_processed']} rows")
            
            if upload_data['errors']:
                for error in upload_data['errors']:
                    print(f"   - Error in {error['file']}: {error['errors']}")
        else:
            print(f"❌ Upload failed: {response.json()}")
    else:
        print(f"❌ CSV file not found: {csv_file_path}")
    
    # Test 4: Verify data was uploaded
    print("\n4. Verifying uploaded data...")
    response = requests.get(f"{BASE_URL}/data?date=21-10-2025", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Data retrieval successful")
        print(f"   - Records found: {data['count']}")
        if data['data']:
            print(f"   - Sample record: {data['data'][0]}")
    else:
        print(f"❌ Data retrieval failed: {response.json()}")
    
    # Test 5: Test multiple file upload (if we had multiple files)
    print("\n5. Testing multiple file upload...")
    test_files = []
    if os.path.exists(csv_file_path):
        test_files.append(('files', (csv_file_path, open(csv_file_path, 'rb'), 'text/csv')))
        # Add the same file twice to test multiple file handling
        test_files.append(('files', (f"copy_{csv_file_path}", open(csv_file_path, 'rb'), 'text/csv')))
    
    if test_files:
        response = requests.post(f"{BASE_URL}/data/upload", 
                               files=test_files, headers=headers)
        
        # Close files
        for _, (_, file_obj, _) in test_files:
            file_obj.close()
        
        print(f"Status: {response.status_code}")
        if response.status_code in [200, 207]:
            upload_data = response.json()
            print(f"✅ Multiple file upload successful")
            print(f"   - Files processed: {upload_data['summary']['total_files_processed']}")
            print(f"   - Rows processed: {upload_data['summary']['total_rows_processed']}")
        else:
            print(f"❌ Multiple file upload failed: {response.json()}")
    
    print("\n✅ Upload API testing completed!")

def create_test_csv():
    """Create a test CSV file for testing"""
    test_data = [
        "2025-10-22T10:00:00+10:00,Vehicle Speed=25,Engine Coolant Temperature=85,Throttle Position=45.5,Intake Manifold Pressure=120,Intake Air Temperature=40,MAF Air Flow Rate=15.2,Run Time Since Engine Start=300,Barometric Pressure=102,Catalyst Temperature Bank1 Sensor1=950,Control Module Voltage=14.1",
        "2025-10-22T10:00:03+10:00,Vehicle Speed=30,Engine Coolant Temperature=86,Throttle Position=50.0,Intake Manifold Pressure=125,Intake Air Temperature=41,MAF Air Flow Rate=18.5,Run Time Since Engine Start=303,Barometric Pressure=102,Catalyst Temperature Bank1 Sensor1=960,Control Module Voltage=14.2",
        "2025-10-22T10:00:06+10:00,Vehicle Speed=35,Engine Coolant Temperature=87,Throttle Position=55.5,Intake Manifold Pressure=130,Intake Air Temperature=42,MAF Air Flow Rate=22.1,Run Time Since Engine Start=306,Barometric Pressure=102,Catalyst Temperature Bank1 Sensor1=970,Control Module Voltage=14.3"
    ]
    
    with open("22-October-2025.csv", "w") as f:
        for line in test_data:
            f.write(line + "\n")
    
    print("✅ Created test CSV file: 22-October-2025.csv")

if __name__ == "__main__":
    # Create a test CSV file if it doesn't exist
    if not os.path.exists("22-October-2025.csv"):
        create_test_csv()
    
    test_upload_api()
