package protocals

import (
	"fmt"
	"strings"
	"github.com/mitchellbreust/OBD_data_dash/device_agent/internal/adapters"
)

// PidResponse represents a single PID query result.
type PidResponse struct {
	Pid       Pid    // PID metadata (name, code, unit, etc.)
	RawData   string // Raw response string from ECU (e.g. "410C1AF8")
	Valid     bool   // True if response is valid and matches PID
	Decoded   any    // Optional decoded value (to fill later via decoder)
	ErrorText string // If invalid, reason why
}

// QueryPids sends a list of PIDs to the ECU and returns their responses in order.
func QueryPids(adapter *adapter.SerialAdapter, pids []Pid) ([]PidResponse, error) {
	var results []PidResponse
	for _, pid := range pids {
		cmd := fmt.Sprintf("01%02X\r", pid.PID)

		// Write request and return error PidResponse if throws
		if err := adapter.Write(cmd); err != nil {
			results = append(results, PidResponse{
				Pid:       pid,
				Valid:     false,
				ErrorText: fmt.Sprintf("write failed: %v", err),
			})
			continue
		}

		// Read ECU response
		resp, err := adapter.Read()
		if err != nil {
			results = append(results, PidResponse{
				Pid:       pid,
				Valid:     false,
				ErrorText: fmt.Sprintf("read failed: %v", err),
			})
			continue
		}
		
		resp = cleanResponse(resp)
		expected := fmt.Sprintf("41%02X", pid.PID)
		valid := strings.HasPrefix(resp, expected)

		results = append(results, PidResponse{
			Pid:     pid,
			RawData: resp,
			Valid:   valid,
			Decoded: pid.Formula([]byte(resp)),
			ErrorText: func() string {
				if valid {
					return ""
				}
				if resp == "" {
					return "empty response"
				}
				return "invalid or unsupported"
			}(),
		})
	}

	return results, nil
}

// cleanResponse removes whitespace, newlines, '>' prompt, etc.
func cleanResponse(resp string) string {
	resp = strings.ToUpper(resp)
	resp = strings.ReplaceAll(resp, "\r", "")
	resp = strings.ReplaceAll(resp, "\n", "")
	resp = strings.ReplaceAll(resp, ">", "")
	resp = strings.TrimSpace(resp)
	return resp
}
