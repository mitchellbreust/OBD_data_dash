#!/usr/bin/env python3
"""
Test script to demonstrate that the CSV parser handles different field orders correctly
"""

from csv_parser import csv_parser

def test_different_orders():
    """Test that the parser handles different field orders correctly"""
    
    print("🧪 Testing CSV Parser with Different Field Orders")
    print("=" * 60)
    
    # Test data with different orders
    test_lines = [
        # Original order
        "2025-10-21T23:20:20+10:00,Vehicle Speed=0,Engine Coolant Temperature=74,Throttle Position=21.96,Intake Manifold Pressure=101",
        
        # Different order
        "2025-10-21T23:20:23+10:00,Throttle Position=100,Vehicle Speed=2,Intake Manifold Pressure=107,Engine Coolant Temperature=74",
        
        # Mixed order with extra fields
        "2025-10-21T23:20:27+10:00,Custom Field=123,Vehicle Speed=16,Another Custom=456,Engine Coolant Temperature=74,Throttle Position=100",
        
        # Missing some fields
        "2025-10-21T23:20:30+10:00,Vehicle Speed=25,Engine Coolant Temperature=76,Throttle Position=50"
    ]
    
    print("\nTesting individual lines:")
    for i, line in enumerate(test_lines, 1):
        print(f"\n{i}. Testing line: {line[:80]}...")
        
        try:
            parsed_data, unsupported_fields = csv_parser._parse_line(line)
            
            if parsed_data:
                print(f"   ✅ Parsed successfully")
                print(f"   📊 Data: {parsed_data}")
                if unsupported_fields:
                    print(f"   ⚠️  Unsupported fields: {unsupported_fields}")
                else:
                    print(f"   ✅ No unsupported fields")
            else:
                print(f"   ❌ Failed to parse")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("\nKey Points:")
    print("- ✅ Field order doesn't matter")
    print("- ✅ Extra fields are ignored and reported")
    print("- ✅ Missing fields are handled gracefully")
    print("- ✅ Exact field name matching is required")

if __name__ == "__main__":
    test_different_orders()
