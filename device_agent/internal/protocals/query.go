package protocals

import (
	"fmt"
	"strings"
	"github.com/mitchellbreust/OBD_data_dash/device_agent/internal/adapters"
	"os"
	"strconv"
	"encoding/csv"
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
		// Check for valid response format: "41 0C" or "410C"
		expectedNoSpace := fmt.Sprintf("41%02X", pid.PID)
		expectedWithSpace := fmt.Sprintf("41 %02X", pid.PID)
		valid := strings.HasPrefix(resp, expectedNoSpace) || strings.HasPrefix(resp, expectedWithSpace)

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

func GetTroubleCodes(adapt *adapter.SerialAdapter) ([]PidTroubleCode, error) {
	// 1️⃣ Send Mode 03 command
	if err := adapt.Write("03\r"); err != nil {
		return nil, err
	}

	// 2️⃣ Read response
	res, err := adapt.Read()
	if err != nil {
		return nil, err
	}

	res = cleanResponse(res)
	if !strings.HasPrefix(res, "43") {
		return nil, fmt.Errorf("unexpected response: %s", res)
	}

	// 3️⃣ Remove spaces and "43" prefix
	res = strings.ReplaceAll(res, " ", "")
	res = strings.TrimPrefix(res, "43")

	// 4️⃣ Parse DTCs (2 bytes per code)
	var codes []string
	for i := 0; i+3 < len(res); i += 4 {
		b1, _ := strconv.ParseUint(res[i:i+2], 16, 8)
		b2, _ := strconv.ParseUint(res[i+2:i+4], 16, 8)
		if b1 == 0 && b2 == 0 {
			break
		}

		// Decode into readable OBD-II code
		firstNibble := (b1 & 0xC0) >> 6
		codeType := []string{"P", "C", "B", "U"}[firstNibble]
		code := fmt.Sprintf("%s%01X%02X", codeType, b1&0x3F, b2)
		codes = append(codes, code)
	}

	// 5️⃣ Load CSV map (create basic map if file doesn't exist)
	codeMap, err := LoadTroubleCodeMap("internal/protocals/obd_trouble_codes.csv")
	if err != nil {
		// If file doesn't exist, create a basic map
		codeMap = make(map[string]string)
		fmt.Printf("⚠️ Could not load trouble codes CSV: %v\n", err)
	}

	// 6️⃣ Match and build response list
	var dtcList []PidTroubleCode
	for _, c := range codes {
		desc := codeMap[c]
		if desc == "" {
			desc = "Unknown trouble code"
		}
		dtcList = append(dtcList, PidTroubleCode{
			Value: c,
			Des:   desc,
		})
	}

	return dtcList, nil
}

func LoadTroubleCodeMap(filename string) (map[string]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open %s: %v", filename, err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read csv: %v", err)
	}

	codeMap := make(map[string]string)
	for _, rec := range records {
		if len(rec) >= 2 {
			code := strings.Trim(rec[0], "\" ")
			desc := strings.Trim(rec[1], "\" ")
			codeMap[code] = desc
		}
	}
	return codeMap, nil
}