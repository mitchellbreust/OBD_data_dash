"""
CSV Parser for OBD Data Upload
Handles flexible field ordering and naming conventions
"""

import csv
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import os

class OBDCSVParser:
    def __init__(self):
        # Mapping from exact CSV field names to our database column names
        # These are the exact field names as they appear in the CSV files
        self.field_mapping = {
            'Vehicle Speed': 'speed',
            'Engine Coolant Temperature': 'cool_temp',
            'Throttle Position': 'throttle_pos',
            'Intake Manifold Pressure': 'intake_mani_pres',
            'Intake Air Temperature': 'intake_air_temp',
            'MAF Air Flow Rate': 'maf_air_flow_rate',
            'Run Time Since Engine Start': 'run_time',
            'Barometric Pressure': 'baro_pressure',
            'Catalyst Temperature Bank1 Sensor1': 'catalyst_temp',
            'Control Module Voltage': 'control_module_voltage',
            # Newly supported commonly available PIDs
            'Calculated Engine Load': 'engine_load',
            'Fuel Level': 'fuel_level',
            'Fuel Pressure': 'fuel_pressure',
            'Ambient Air Temperature': 'ambient_air_temp',
            'Timing Advance': 'timing_advance'
        }
        
        # Optional fields that might be present in some files but not others
        self.optional_field_mapping = {
            'Engine RPM': 'rpm',
            'RPM': 'rpm',
            'Engine Speed': 'rpm'
        }
        
        # Combine both mappings
        self.all_field_mapping = {**self.field_mapping, **self.optional_field_mapping}
    
    def parse_csv_file(self, file_path: str) -> Tuple[List[Dict[str, Any]], List[str], List[str]]:
        """
        Parse a single CSV file and return structured data
        
        Returns:
            Tuple of (parsed_data, errors, unsupported_fields)
        """
        parsed_data = []
        errors = []
        unsupported_fields = set()
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                # Read the file line by line since it's not standard CSV format
                for line_num, line in enumerate(file, 1):
                    line = line.strip()
                    if not line:
                        continue
                    
                    try:
                        parsed_row, row_unsupported = self._parse_line(line)
                        if parsed_row:
                            parsed_data.append(parsed_row)
                            unsupported_fields.update(row_unsupported)
                    except Exception as e:
                        errors.append(f"Line {line_num}: {str(e)}")
                        continue
            
            return parsed_data, errors, list(unsupported_fields)
            
        except Exception as e:
            errors.append(f"File error: {str(e)}")
            return [], errors, []
    
    def _parse_line(self, line: str) -> Tuple[Optional[Dict[str, Any]], List[str]]:
        """
        Parse a single line of OBD data
        
        Format: timestamp,field1=value1,field2=value2,...
        
        Returns:
            Tuple of (parsed_data, unsupported_fields)
        """
        parts = line.split(',')
        if len(parts) < 2:
            raise ValueError("Invalid line format - must have timestamp and at least one data field")
        
        # Extract timestamp (first part)
        timestamp = parts[0].strip()
        
        # Validate timestamp format
        try:
            # Try to parse the timestamp to validate it
            datetime.fromisoformat(timestamp.replace('+', '+').replace('-', '-'))
        except ValueError:
            raise ValueError(f"Invalid timestamp format: {timestamp}")
        
        # Parse data fields
        data_fields = {}
        unsupported_fields = []
        
        for part in parts[1:]:
            if '=' not in part:
                continue  # Skip malformed parts
            
            field_name, value = part.split('=', 1)
            field_name = field_name.strip()
            value = value.strip()
            
            # Map field name to our database column
            db_column = self.all_field_mapping.get(field_name)
            if db_column:
                try:
                    # Convert value to appropriate type
                    if '.' in value:
                        data_fields[db_column] = float(value)
                    else:
                        data_fields[db_column] = int(value)
                except ValueError:
                    # If conversion fails, skip this field
                    continue
            else:
                # Track unsupported fields for reporting
                unsupported_fields.append(field_name)
        
        # Only return if we have at least timestamp and some data
        if data_fields:
            result = {'timestamp': timestamp}
            result.update(data_fields)
            return result, unsupported_fields
        
        return None, unsupported_fields
    
    def get_supported_fields_in_file(self, file_path: str) -> Dict[str, int]:
        """
        Analyze a file to see which supported fields are present
        
        Returns:
            Dict mapping field names to count of occurrences
        """
        field_counts = {}
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                for line_num, line in enumerate(file, 1):
                    if line_num > 100:  # Only check first 100 lines for efficiency
                        break
                    
                    line = line.strip()
                    if not line:
                        continue
                    
                    parts = line.split(',')
                    for part in parts[1:]:  # Skip timestamp
                        if '=' in part:
                            field_name = part.split('=', 1)[0].strip()
                            if field_name in self.all_field_mapping:
                                field_counts[field_name] = field_counts.get(field_name, 0) + 1
            
            return field_counts
            
        except Exception:
            return {}
    
    def validate_file_format(self, file_path: str) -> Tuple[bool, List[str]]:
        """
        Validate that a file has the expected format
        
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                # Check first few lines
                for line_num, line in enumerate(file, 1):
                    if line_num > 5:  # Only check first 5 lines
                        break
                    
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Check basic format
                    if ',' not in line:
                        errors.append(f"Line {line_num}: Missing comma separator")
                        continue
                    
                    parts = line.split(',')
                    if len(parts) < 2:
                        errors.append(f"Line {line_num}: Must have timestamp and at least one data field")
                        continue
                    
                    # Check timestamp format
                    timestamp = parts[0].strip()
                    try:
                        datetime.fromisoformat(timestamp.replace('+', '+').replace('-', '-'))
                    except ValueError:
                        errors.append(f"Line {line_num}: Invalid timestamp format: {timestamp}")
                    
                    # Check for at least one supported field
                    has_supported_field = False
                    for part in parts[1:]:
                        if '=' in part:
                            field_name = part.split('=', 1)[0].strip()
                            if field_name in self.all_field_mapping:
                                has_supported_field = True
                                break
                    
                    if not has_supported_field:
                        errors.append(f"Line {line_num}: No supported OBD fields found")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            return False, [f"File read error: {str(e)}"]

# Global parser instance
csv_parser = OBDCSVParser()
