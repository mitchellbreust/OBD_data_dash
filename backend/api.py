from flask import Flask, request, jsonify
from functools import wraps
import re
import os
import zipfile
import tempfile
from werkzeug.utils import secure_filename
from datastore import datastore
from csv_parser import csv_parser

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'

# Upload configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB per file
MAX_FILES_PER_UPLOAD = 20  # Maximum number of files per upload
ALLOWED_EXTENSIONS = {'csv', 'zip'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ✅ List of supported data request types
SUPPORTED_DATA = [
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
]

def require_auth(f):
    """Decorator to require authentication for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        session_token = auth_header.split(' ')[1]
        user_id = datastore.validate_session(session_token)
        
        if not user_id:
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        # Add user_id to the request context
        request.user_id = user_id
        return f(*args, **kwargs)
    
    return decorated_function

def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_date_from_filename(filename):
    """Extract date from filename like '21-October-2025.csv'"""
    try:
        # Remove extension
        name = filename.rsplit('.', 1)[0]
        # Parse date format: DD-Month-YYYY
        from datetime import datetime
        date_obj = datetime.strptime(name, '%d-%B-%Y')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return None

def process_uploaded_files(files, user_id):
    """Process uploaded CSV files and return results"""
    results = {
        'success': [],
        'errors': [],
        'total_rows_processed': 0,
        'total_files_processed': 0
    }
    
    for file in files:
        if file and allowed_file(file.filename):
            try:
                # Save file temporarily
                filename = secure_filename(file.filename)
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                
                # Check if it's a ZIP file
                if filename.lower().endswith('.zip'):
                    # Process ZIP file
                    zip_results = process_zip_file(file_path, user_id)
                    results['success'].extend(zip_results['success'])
                    results['errors'].extend(zip_results['errors'])
                    results['total_rows_processed'] += zip_results['total_rows_processed']
                    results['total_files_processed'] += zip_results['total_files_processed']
                else:
                    # Process single CSV file
                    csv_results = process_single_csv(file_path, filename, user_id)
                    if csv_results:
                        if 'success' in csv_results:
                            results['success'].append(csv_results['success'])
                            results['total_rows_processed'] += csv_results['success']['rows_processed']
                            results['total_files_processed'] += 1
                        if 'error' in csv_results:
                            results['errors'].append(csv_results['error'])
                
                # Clean up temporary file
                os.remove(file_path)
                
            except Exception as e:
                results['errors'].append({
                    'file': file.filename,
                    'errors': [f'Processing error: {str(e)}']
                })
        else:
            results['errors'].append({
                'file': file.filename,
                'errors': ['Invalid file type. Only CSV and ZIP files are allowed.']
            })
    
    return results

def process_single_csv(file_path, filename, user_id):
    """Process a single CSV file"""
    try:
        # Validate file format
        is_valid, validation_errors = csv_parser.validate_file_format(file_path)
        if not is_valid:
            return {'error': {'file': filename, 'errors': validation_errors}}
        
        # Parse CSV file
        parsed_data, parse_errors, unsupported_fields = csv_parser.parse_csv_file(file_path)
        
        if parse_errors:
            return {'error': {'file': filename, 'errors': parse_errors}}
        
        if parsed_data:
            # Insert data into database
            success = datastore.insert_obd_data(user_id, parsed_data)
            if success:
                return {
                    'success': {
                        'file': filename,
                        'rows_processed': len(parsed_data),
                        'date': extract_date_from_filename(filename),
                        'unsupported_fields': unsupported_fields
                    }
                }
            else:
                return {'error': {'file': filename, 'errors': ['Failed to insert data into database']}}
        
        return None
        
    except Exception as e:
        return {'error': {'file': filename, 'errors': [f'Processing error: {str(e)}']}}

def process_zip_file(zip_path, user_id):
    """Process a ZIP file containing CSV files"""
    results = {
        'success': [],
        'errors': [],
        'total_rows_processed': 0,
        'total_files_processed': 0
    }
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_file:
            csv_files = [f for f in zip_file.namelist() if f.lower().endswith('.csv')]
            
            if not csv_files:
                results['errors'].append({
                    'file': os.path.basename(zip_path),
                    'errors': ['No CSV files found in ZIP archive']
                })
                return results
            
            # Extract and process each CSV file
            with tempfile.TemporaryDirectory() as temp_dir:
                for csv_filename in csv_files:
                    try:
                        # Extract CSV file
                        zip_file.extract(csv_filename, temp_dir)
                        csv_path = os.path.join(temp_dir, csv_filename)
                        
                        # Process the CSV file
                        csv_results = process_single_csv(csv_path, csv_filename, user_id)
                        if csv_results:
                            if 'success' in csv_results:
                                results['success'].append(csv_results['success'])
                                results['total_rows_processed'] += csv_results['success']['rows_processed']
                                results['total_files_processed'] += 1
                            if 'error' in csv_results:
                                results['errors'].append(csv_results['error'])
                        
                    except Exception as e:
                        results['errors'].append({
                            'file': csv_filename,
                            'errors': [f'Error processing file in ZIP: {str(e)}']
                        })
    
    except Exception as e:
        results['errors'].append({
            'file': os.path.basename(zip_path),
            'errors': [f'ZIP file processing error: {str(e)}']
        })
    
    return results

@app.route("/register", methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Create user
        success = datastore.create_user(email, password)
        if success:
            return jsonify({'message': 'User registered successfully'}), 201
        else:
            return jsonify({'error': 'Email already exists'}), 409
    
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route("/login", methods=['POST'])
def login():
    """Login user and create session"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Authenticate user
        user_id = datastore.authenticate_user(email, password)
        if user_id:
            # Create session
            session_token = datastore.create_session(user_id)
            return jsonify({
                'message': 'Login successful',
                'session_token': session_token
            }), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401
    
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route("/logout", methods=['POST'])
@require_auth
def logout():
    """Logout user by invalidating session"""
    try:
        auth_header = request.headers.get('Authorization')
        session_token = auth_header.split(' ')[1]
        
        success = datastore.logout_user(session_token)
        if success:
            return jsonify({'message': 'Logout successful'}), 200
        else:
            return jsonify({'error': 'Session not found'}), 404
    
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route("/data", methods=['GET'])
@require_auth
def get_data():
    """Retrieve OBD data for authenticated user"""
    try:
        # Get query parameters
        date = request.args.get('date')  # Format: dd-mm-yyyy
        data_types = request.args.getlist('data_types')  # List of data types to retrieve
        limit = request.args.get('limit', 1000, type=int)  # Pagination limit
        
        # Validate parameters
        if limit > 1000:
            limit = 1000  # Cap at 1000 for performance
        if limit < 1:
            limit = 100
        
        if data_types:
            invalid_types = [dt for dt in data_types if dt not in SUPPORTED_DATA]
            if invalid_types:
                return jsonify({
                    'error': f'Invalid data types: {invalid_types}',
                    'supported_types': SUPPORTED_DATA
                }), 400
        
        # Get data from datastore
        data = datastore.get_obd_data(
            user_id=request.user_id,
            date=date,
            data_types=data_types if data_types else None,
            limit=limit
        )
        
        return jsonify({
            'data': data,
            'count': len(data),
            'limit': limit,
            'date_filter': date,
            'data_types_filter': data_types if data_types else 'all'
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route("/data/upload", methods=['POST'])
@require_auth
def upload_data():
    """Upload OBD data CSV files"""
    try:
        # Check if files are present
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        
        # Validate file count
        if len(files) > MAX_FILES_PER_UPLOAD:
            return jsonify({
                'error': f'Too many files. Maximum {MAX_FILES_PER_UPLOAD} files per upload.'
            }), 400
        
        # Validate file sizes
        for file in files:
            if file.filename:
                # Check file size (this is approximate for multipart uploads)
                file.seek(0, 2)  # Seek to end
                file_size = file.tell()
                file.seek(0)  # Reset to beginning
                
                if file_size > MAX_FILE_SIZE:
                    return jsonify({
                        'error': f'File {file.filename} is too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'
                    }), 400
        
        # Process files
        results = process_uploaded_files(files, request.user_id)
        
        # Prepare response
        response_data = {
            'message': 'File upload completed',
            'summary': {
                'total_files_processed': results['total_files_processed'],
                'total_rows_processed': results['total_rows_processed'],
                'successful_files': len(results['success']),
                'failed_files': len(results['errors'])
            },
            'success': results['success'],
            'errors': results['errors']
        }
        
        # Determine response status
        if results['errors'] and not results['success']:
            status_code = 400  # All files failed
        elif results['errors']:
            status_code = 207  # Partial success
        else:
            status_code = 200  # All files successful
        
        return jsonify(response_data), status_code
    
    except Exception as e:
        return jsonify({'error': f'Upload processing error: {str(e)}'}), 500

@app.route("/health", methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'OBD Dashboard API is running'
    }), 200

@app.route("/supported-data", methods=['GET'])
def get_supported_data():
    """Get list of supported data types"""
    return jsonify({
        'supported_data_types': SUPPORTED_DATA,
        'description': 'Available OBD data types that can be requested'
    }), 200

@app.route("/data/upload/preview", methods=['POST'])
@require_auth
def preview_upload():
    """Preview CSV file contents before upload"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if not file or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only CSV files are allowed for preview.'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"preview_{filename}")
        file.save(file_path)
        
        try:
            # Analyze file
            field_counts = csv_parser.get_supported_fields_in_file(file_path)
            is_valid, validation_errors = csv_parser.validate_file_format(file_path)
            
            # Get sample data (first 5 rows)
            sample_data, parse_errors, unsupported_fields = csv_parser.parse_csv_file(file_path)
            sample_data = sample_data[:5] if sample_data else []
            
            # Clean up
            os.remove(file_path)
            
            return jsonify({
                'filename': filename,
                'is_valid': is_valid,
                'validation_errors': validation_errors,
                'supported_fields_found': field_counts,
                'unsupported_fields_found': list(set(unsupported_fields)),
                'sample_data': sample_data,
                'parse_errors': parse_errors[:10] if parse_errors else [],  # Limit errors
                'estimated_rows': len(sample_data) if sample_data else 0
            }), 200
            
        except Exception as e:
            # Clean up on error
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'Preview error: {str(e)}'}), 500
    
    except Exception as e:
        return jsonify({'error': f'Preview processing error: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
