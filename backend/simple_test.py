#!/usr/bin/env python3
"""
Simple test to demonstrate CSV parser handles different field orders
"""

from csv_parser import csv_parser

def test_orders():
    print("Testing CSV Parser with Different Field Orders")
    print("=" * 50)
    
    # Test different orders
    line1 = "2025-10-21T23:20:20+10:00,Vehicle Speed=0,Engine Coolant Temperature=74,Throttle Position=21.96"
    line2 = "2025-10-21T23:20:23+10:00,Throttle Position=100,Vehicle Speed=2,Engine Coolant Temperature=74"
    line3 = "2025-10-21T23:20:27+10:00,Custom Field=123,Vehicle Speed=16,Engine Coolant Temperature=74"
    
    lines = [line1, line2, line3]
    
    for i, line in enumerate(lines, 1):
        print(f"\nTest {i}: {line[:60]}...")
        
        try:
            parsed_data, unsupported_fields = csv_parser._parse_line(line)
            
            if parsed_data:
                print(f"SUCCESS: {parsed_data}")
                if unsupported_fields:
                    print(f"Unsupported: {unsupported_fields}")
            else:
                print("FAILED to parse")
                
        except Exception as e:
            print(f"ERROR: {e}")
    
    print("\n" + "=" * 50)
    print("Key Points:")
    print("- Field order doesn't matter")
    print("- Extra fields are ignored and reported")
    print("- Exact field name matching required")

if __name__ == "__main__":
    test_orders()
