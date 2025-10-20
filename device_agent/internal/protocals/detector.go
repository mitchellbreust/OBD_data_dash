package protocals

import (
	"github.com/mitchellbreust/OBD_data_dash/device_agent/internal/adapters"
	"fmt"
	"strings"
)

// DetectSupportedPids queries the ECU for each stable PID
// and returns a slice of those that respond successfully.
func DetectSupportedPids(adapter *adapter.SerialAdapter) ([]Pid, error) {
	var supported []Pid

	for _, pid := range StablePIDs {
		command := fmt.Sprintf("01%02X\r", pid.PID)

		if err := adapter.Write(command); err != nil {
			fmt.Printf("⚠️ Write failed for PID 0x%02X (%s): %v\n", pid.PID, pid.Name, err)
			continue
		}
		resp, err := adapter.Read()
		if err != nil {
			fmt.Printf("⚠️ Read error for PID 0x%02X: %v\n", pid.PID, err)
			continue
		}

		if isSupportedResponse(resp, pid.PID) {
			fmt.Printf("✅ PID 0x%02X (%s) supported.\n", pid.PID, pid.Name)
			supported = append(supported, pid)
		} else {
			fmt.Printf("❌ PID 0x%02X (%s) not supported.\n", pid.PID, pid.Name)
		}
	}
	return supported, nil
}

// isSupportedResponse checks if the response looks valid for a given PID.
func isSupportedResponse(resp string, pid byte) bool {
	resp = strings.ToUpper(resp)
	if strings.Contains(resp, "NO DATA") || 
		strings.Contains(resp, "?") || 
		strings.Contains(resp, "UNABLE") ||
		strings.Contains(resp, "SEARCHING") ||
		len(resp) == 0 {
		return false
	}

	// Typical valid response starts with "41" (Mode 01 reply)
	// and echoes back the PID code: e.g. "410C" for Engine RPM
	expected := fmt.Sprintf("41%02X", pid)
	return strings.Contains(resp, expected)
}
