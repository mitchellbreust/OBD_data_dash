package protocals

type Pid struct {
    Name        string            // Human-readable name (e.g., "Engine RPM")
    PID         byte              // PID code (e.g., 0x0C for RPM)
    Unit        string            // Unit of measurement (e.g., "rpm", "km/h")
    Bytes       int               // Number of expected data bytes
    Formula     func([]byte) any  // Function to convert raw bytes to decoded value
}

// StablePIDs 
var StablePIDs = []Pid{
	// --- Engine and Air ---
	{Name: "Engine Coolant Temperature", PID: 0x05, Unit: "°C", Bytes: 1},
	{Name: "Intake Manifold Pressure", PID: 0x0B, Unit: "kPa", Bytes: 1},
	{Name: "Intake Air Temperature", PID: 0x0F, Unit: "°C", Bytes: 1},
	{Name: "MAF Air Flow Rate", PID: 0x10, Unit: "g/s", Bytes: 2},

	// --- Speed & RPM ---
	{Name: "Engine RPM", PID: 0x0C, Unit: "rpm", Bytes: 2},
	{Name: "Vehicle Speed", PID: 0x0D, Unit: "km/h", Bytes: 1},

	// --- Throttle / Load ---
	{Name: "Throttle Position", PID: 0x11, Unit: "%", Bytes: 1},
	{Name: "Calculated Engine Load", PID: 0x04, Unit: "%", Bytes: 1},
	{Name: "Absolute Load Value", PID: 0x43, Unit: "%", Bytes: 2},

	// --- Fuel System ---
	{Name: "Fuel System Status", PID: 0x03, Unit: "", Bytes: 2},
	{Name: "Fuel Level", PID: 0x2F, Unit: "%", Bytes: 1},
	{Name: "Fuel Pressure", PID: 0x0A, Unit: "kPa", Bytes: 1},

	// --- Timing & Sensors ---
	{Name: "Timing Advance", PID: 0x0E, Unit: "° BTDC", Bytes: 1},
	{Name: "O2 Sensor Voltage (Bank1 Sensor1)", PID: 0x14, Unit: "V", Bytes: 2},
	{Name: "O2 Sensor Voltage (Bank1 Sensor2)", PID: 0x15, Unit: "V", Bytes: 2},

	// --- Environmental / Misc ---
	{Name: "Run Time Since Engine Start", PID: 0x1F, Unit: "s", Bytes: 2},
	{Name: "Barometric Pressure", PID: 0x33, Unit: "kPa", Bytes: 1},
	{Name: "Ambient Air Temperature", PID: 0x46, Unit: "°C", Bytes: 1},
}
