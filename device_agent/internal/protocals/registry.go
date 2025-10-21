package protocals

import (
	"fmt"
	"strings"
)

type Pid struct {
    Name        string            // Human-readable name (e.g., "Engine RPM")
    PID         byte              // PID code (e.g., 0x0C for RPM)
    Unit        string            // Unit of measurement (e.g., "rpm", "km/h")
    Bytes       int               // Number of expected data bytes
    Formula     func([]byte) any  // Function to convert raw bytes to decoded value
}

type PidTroubleCode struct {
	Value		string
	Des			string
}

// StablePIDs - Reduced subset of most commonly supported PIDs
var StablePIDs = []Pid{
	// --- Most Common PIDs (almost always supported) ---
	{Name: "Engine RPM", PID: 0x0C, Unit: "rpm", Bytes: 2, Formula: func(data []byte) any {
		// Parse hex string like "41 0C 0E 09" -> extract 0E 09
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b) / 4.0
				}
			}
		}
		return 0
	}},
	{Name: "Vehicle Speed", PID: 0x0D, Unit: "km/h", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return int(value)
			}
		}
		return 0
	}},
	{Name: "Engine Coolant Temperature", PID: 0x05, Unit: "°C", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return int(value) - 40
			}
		}
		return 0
	}},
	{Name: "Calculated Engine Load", PID: 0x04, Unit: "%", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return float64(value) * 100.0 / 255.0
			}
		}
		return 0
	}},
	{Name: "Throttle Position", PID: 0x11, Unit: "%", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return float64(value) * 100.0 / 255.0
			}
		}
		return 0
	}},

	// --- Commonly Supported PIDs ---
	{Name: "Intake Manifold Pressure", PID: 0x0B, Unit: "kPa", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return int(value)
			}
		}
		return 0
	}},
	{Name: "Timing Advance", PID: 0x0E, Unit: "° BTDC", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return float64(value)/2.0 - 64.0
			}
		}
		return 0
	}},
	{Name: "Intake Air Temperature", PID: 0x0F, Unit: "°C", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return int(value) - 40
			}
		}
		return 0
	}},

	// --- Additional PIDs ---
	{Name: "MAF Air Flow Rate", PID: 0x10, Unit: "g/s", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b) / 100.0
				}
			}
		}
		return 0
	}},
	{Name: "Absolute Load Value", PID: 0x43, Unit: "%", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b) * 100.0 / 255.0
				}
			}
		}
		return 0
	}},
	{Name: "Fuel System Status", PID: 0x03, Unit: "", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			return fmt.Sprintf("%s %s", parts[2], parts[3])
		}
		return "00 00"
	}},
	{Name: "Fuel Level", PID: 0x2F, Unit: "%", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return float64(value) * 100.0 / 255.0
			}
		}
		return 0
	}},
	{Name: "Fuel Pressure", PID: 0x0A, Unit: "kPa", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return float64(value) * 3.0 // kPa = raw * 3
			}
		}
		return 0
	}},
	{Name: "O2 Sensor Voltage (Bank1 Sensor1)", PID: 0x14, Unit: "V", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					// O2 sensor: A = voltage (0-1.275V), B = short term fuel trim (-100% to +99.2%)
					voltage := float64(a) / 200.0
					fuelTrim := float64(b) / 1.28 - 100.0
					return fmt.Sprintf("Voltage: %.3fV, Fuel Trim: %.1f%%", voltage, fuelTrim)
				}
			}
		}
		return "0.000V, 0.0%"
	}},
	{Name: "O2 Sensor Voltage (Bank1 Sensor2)", PID: 0x15, Unit: "V", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					// O2 sensor: A = voltage (0-1.275V), B = short term fuel trim (-100% to +99.2%)
					voltage := float64(a) / 200.0
					fuelTrim := float64(b) / 1.28 - 100.0
					return fmt.Sprintf("Voltage: %.3fV, Fuel Trim: %.1f%%", voltage, fuelTrim)
				}
			}
		}
		return "0.000V, 0.0%"
	}},
	{Name: "Run Time Since Engine Start", PID: 0x1F, Unit: "s", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return int(a*256 + b)
				}
			}
		}
		return 0
	}},
	{Name: "Barometric Pressure", PID: 0x33, Unit: "kPa", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return int(value)
			}
		}
		return 0
	}},
	{Name: "Ambient Air Temperature", PID: 0x46, Unit: "°C", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return int(value) - 40
			}
		}
		return 0
	}},

	// --- Additional Useful PIDs ---
	{Name: "Commanded Secondary Air Status", PID: 0x12, Unit: "", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				statuses := []string{"Upstream", "Downstream of catalytic converter", "From the outside atmosphere or off", "Pump commanded on for diagnostics"}
				if int(value) < len(statuses) {
					return statuses[value]
				}
				return fmt.Sprintf("Unknown (%d)", value)
			}
		}
		return "Unknown"
	}},
	{Name: "Oxygen Sensors Present", PID: 0x13, Unit: "", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return fmt.Sprintf("Bank1: %d sensors, Bank2: %d sensors", (value>>4)&0xF, value&0xF)
			}
		}
		return "Unknown"
	}},
	{Name: "Catalyst Temperature Bank1 Sensor1", PID: 0x3C, Unit: "°C", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b)/10.0 - 40.0
				}
			}
		}
		return 0
	}},
	{Name: "Catalyst Temperature Bank2 Sensor1", PID: 0x3D, Unit: "°C", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b)/10.0 - 40.0
				}
			}
		}
		return 0
	}},
	{Name: "Control Module Voltage", PID: 0x42, Unit: "V", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b)/1000.0
				}
			}
		}
		return 0
	}},
	{Name: "Absolute Fuel Rail Pressure", PID: 0x59, Unit: "kPa", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b) * 10.0
				}
			}
		}
		return 0
	}},
	{Name: "Relative Accelerator Pedal Position", PID: 0x5A, Unit: "%", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return float64(value) * 100.0 / 255.0
			}
		}
		return 0
	}},
	{Name: "Hybrid Battery Pack Remaining Life", PID: 0x5B, Unit: "%", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return float64(value) * 100.0 / 255.0
			}
		}
		return 0
	}},
	{Name: "Engine Oil Temperature", PID: 0x5C, Unit: "°C", Bytes: 1, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 3 {
			var value uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &value); n == 1 && err == nil {
				return int(value) - 40
			}
		}
		return 0
	}},
	{Name: "Fuel Injection Timing", PID: 0x5D, Unit: "°", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b)/128.0 - 210.0
				}
			}
		}
		return 0
	}},
	{Name: "Engine Fuel Rate", PID: 0x5E, Unit: "L/h", Bytes: 2, Formula: func(data []byte) any {
		response := string(data)
		parts := strings.Fields(response)
		if len(parts) >= 4 {
			var a, b uint16
			if n, err := fmt.Sscanf(parts[2], "%X", &a); n == 1 && err == nil {
				if n, err := fmt.Sscanf(parts[3], "%X", &b); n == 1 && err == nil {
					return float64(a*256+b)/20.0
				}
			}
		}
		return 0
	}},
}
