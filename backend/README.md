# OBD Data Dashboard Backend

A Flask-based REST API for managing OBD (On-Board Diagnostics) data with user authentication and session management.

## Features

- ✅ User registration and authentication
- ✅ Session management with secure tokens
- ✅ SQLite database for data storage
- ✅ OBD data retrieval with date filtering
- ✅ Support for multiple data types
- ✅ Secure password hashing
- ✅ Input validation and error handling

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python api.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

#### POST `/register`
Register a new user.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "message": "User registered successfully"
}
```

#### POST `/login`
Login and get session token.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "message": "Login successful",
    "session_token": "your-session-token-here"
}
```

#### POST `/logout`
Logout and invalidate session.

**Headers:**
```
Authorization: Bearer your-session-token-here
```

### Data Retrieval

#### GET `/data`
Retrieve OBD data for authenticated user.

**Headers:**
```
Authorization: Bearer your-session-token-here
```

**Query Parameters:**
- `date` (optional): Filter by date in format `dd-mm-yyyy` (e.g., `21-10-2025`)
- `data_types` (optional): Filter specific data types (can be used multiple times)
- `limit` (optional): Maximum number of records to return (default: 1000, max: 1000)

**Example Requests:**
```
GET /data
GET /data?date=21-10-2025
GET /data?data_types=speed&data_types=rpm
GET /data?date=21-10-2025&data_types=speed&data_types=cool_temp&limit=500
```

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "timestamp": "2025-10-21T23:20:20+10:00",
            "speed": 0,
            "cool_temp": 74,
            "rpm": 1200
        }
    ],
    "count": 1,
    "limit": 1000,
    "date_filter": "21-10-2025",
    "data_types_filter": ["speed", "rpm"]
}
```

### Data Upload

#### POST `/data/upload`
Upload OBD data CSV files.

**Headers:**
```
Authorization: Bearer your-session-token-here
Content-Type: multipart/form-data
```

**Request Body:**
- `files`: One or more CSV files (or ZIP files containing CSV files)

**File Requirements:**
- **File Format**: CSV files with OBD data
- **Naming Convention**: `DD-Month-YYYY.csv` (e.g., `21-October-2025.csv`)
- **Data Format**: `timestamp,field1=value1,field2=value2,...`
- **Maximum Files**: 20 files per upload
- **Maximum File Size**: 50MB per file

**Supported Field Names (exact match required):**
- `Vehicle Speed`
- `Engine Coolant Temperature`
- `Throttle Position`
- `Intake Manifold Pressure`
- `Intake Air Temperature`
- `MAF Air Flow Rate`
- `Run Time Since Engine Start`
- `Barometric Pressure`
- `Catalyst Temperature Bank1 Sensor1`
- `Control Module Voltage`

**Example CSV Format:**
```
2025-10-21T23:20:20+10:00,Vehicle Speed=0,Engine Coolant Temperature=74,Throttle Position=21.96,Intake Manifold Pressure=101,Intake Air Temperature=37,MAF Air Flow Rate=7.41,Run Time Since Engine Start=262,Barometric Pressure=101,Catalyst Temperature Bank1 Sensor1=1000,Control Module Voltage=13.92
```

**Note**: Files may contain additional fields not listed above. These will be ignored during processing, and a list of unsupported fields will be returned in the response.

**Response:**
```json
{
    "message": "File upload completed",
    "summary": {
        "total_files_processed": 2,
        "total_rows_processed": 1500,
        "successful_files": 2,
        "failed_files": 0
    },
    "success": [
        {
            "file": "21-October-2025.csv",
            "rows_processed": 750,
            "date": "2025-10-21",
            "unsupported_fields": ["Custom Field", "Another Custom Field"]
        },
        {
            "file": "22-October-2025.csv",
            "rows_processed": 750,
            "date": "2025-10-22",
            "unsupported_fields": []
        }
    ],
    "errors": []
}
```

#### POST `/data/upload/preview`
Preview CSV file contents before upload.

**Headers:**
```
Authorization: Bearer your-session-token-here
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: Single CSV file to preview

**Response:**
```json
{
    "filename": "21-October-2025.csv",
    "is_valid": true,
    "validation_errors": [],
    "supported_fields_found": {
        "Vehicle Speed": 10,
        "Engine Coolant Temperature": 10,
        "Throttle Position": 10
    },
    "sample_data": [
        {
            "timestamp": "2025-10-21T23:20:20+10:00",
            "speed": 0,
            "cool_temp": 74,
            "throttle_pos": 21.96
        }
    ],
    "parse_errors": [],
    "estimated_rows": 5
}
```

### Utility Endpoints

#### GET `/health`
Health check endpoint.

#### GET `/supported-data`
Get list of supported OBD data types.

**Response:**
```json
{
    "supported_data_types": [
        "rpm",
        "speed",
        "cool_temp",
        "throttle_pos",
        "intake_mani_pres",
        "intake_air_temp",
        "maf_air_flow_rate",
        "run_time",
        "baro_pressure",
        "catalyst_temp",
        "control_module_voltage"
    ],
    "description": "Available OBD data types that can be requested"
}
```

## Supported Data Types

The API supports the following OBD data types:

- `rpm` - Engine RPM
- `speed` - Vehicle Speed
- `cool_temp` - Engine Coolant Temperature
- `throttle_pos` - Throttle Position
- `intake_mani_pres` - Intake Manifold Pressure
- `intake_air_temp` - Intake Air Temperature
- `maf_air_flow_rate` - MAF Air Flow Rate
- `run_time` - Run Time Since Engine Start
- `baro_pressure` - Barometric Pressure
- `catalyst_temp` - Catalyst Temperature
- `control_module_voltage` - Control Module Voltage

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - Hashed password with salt
- `created_at` - Account creation timestamp

### Sessions Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `session_token` - Unique session token
- `created_at` - Session creation timestamp
- `expires_at` - Session expiration timestamp

### OBD Data Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `timestamp` - Data timestamp
- Individual columns for each supported data type
- `created_at` - Record creation timestamp

## Testing

Run the test script to verify API functionality:

```bash
python test_api.py
```

Make sure the API server is running before executing the test script.

## Security Features

- Password hashing with SHA-256 and salt
- Session-based authentication with secure tokens
- Input validation and sanitization
- SQL injection protection with parameterized queries
- CORS-ready (can be configured as needed)

## Future Enhancements

- Data upload endpoint for bulk OBD data
- Data aggregation and analytics endpoints
- Real-time data streaming
- Data export functionality
- Advanced filtering and search capabilities
