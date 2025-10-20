package protocals

import "fmt"

// DecodeEngineCoolantTemp returns coolant temperature in °C (A - 40)
func DecodeEngineCoolantTemp(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]) - 40, nil
}

// DecodeIntakeManifoldPressure returns manifold pressure in kPa (A)
func DecodeIntakeManifoldPressure(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]), nil
}

// DecodeIntakeAirTemp returns intake air temp in °C (A - 40)
func DecodeIntakeAirTemp(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]) - 40, nil
}

// DecodeMAFAirFlow returns MAF in g/s ((256*A + B) / 100)
func DecodeMAFAirFlow(data []byte) (float64, error) {
	if len(data) < 2 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(int(data[0])*256+int(data[1])) / 100.0, nil
}

// DecodeEngineRPM returns RPM ((256*A + B) / 4)
func DecodeEngineRPM(data []byte) (float64, error) {
	if len(data) < 2 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(int(data[0])*256+int(data[1])) / 4.0, nil
}

// DecodeVehicleSpeed returns vehicle speed in km/h (A)
func DecodeVehicleSpeed(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]), nil
}

// DecodeThrottlePosition returns throttle % ((A*100)/255)
func DecodeThrottlePosition(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]) * 100.0 / 255.0, nil
}

// DecodeCalculatedLoad returns calculated load % ((A*100)/255)
func DecodeCalculatedLoad(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]) * 100.0 / 255.0, nil
}

// DecodeAbsoluteLoad returns absolute load % (((A*256)+B)*100/255)
func DecodeAbsoluteLoad(data []byte) (float64, error) {
	if len(data) < 2 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(int(data[0])*256+int(data[1])) * 100.0 / 255.0, nil
}

// DecodeFuelSystemStatus decodes the 2-byte status values
func DecodeFuelSystemStatus(data []byte) (string, error) {
	if len(data) < 2 {
		return "", fmt.Errorf("invalid data length")
	}
	return fmt.Sprintf("System1=%d, System2=%d", data[0], data[1]), nil
}

// DecodeFuelLevel returns fuel level % ((A*100)/255)
func DecodeFuelLevel(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]) * 100.0 / 255.0, nil
}

// DecodeFuelPressure returns fuel pressure in kPa (A*3)
func DecodeFuelPressure(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]) * 3.0, nil
}

// DecodeTimingAdvance returns advance °BTDC ((A/2) - 64)
func DecodeTimingAdvance(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0])/2.0 - 64.0, nil
}

// DecodeO2Sensor returns "X.XXV Trim Y%"
func DecodeO2Sensor(data []byte) (string, error) {
	if len(data) < 2 {
		return "", fmt.Errorf("invalid data length")
	}
	v := float64(data[0]) / 200.0
	trim := (float64(data[1]) - 128.0) * 100.0 / 128.0
	return fmt.Sprintf("%.2fV, Trim %.1f%%", v, trim), nil
}

// DecodeRunTime returns seconds ((A*256)+B)
func DecodeRunTime(data []byte) (int, error) {
	if len(data) < 2 {
		return 0, fmt.Errorf("invalid data length")
	}
	return int(data[0])*256 + int(data[1]), nil
}

// DecodeBarometricPressure returns baro pressure kPa (A)
func DecodeBarometricPressure(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]), nil
}

// DecodeAmbientAirTemp returns °C (A - 40)
func DecodeAmbientAirTemp(data []byte) (float64, error) {
	if len(data) < 1 {
		return 0, fmt.Errorf("invalid data length")
	}
	return float64(data[0]) - 40, nil
}
