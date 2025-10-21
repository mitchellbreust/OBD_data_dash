package data

import (
    "fmt"
    "os"
    "strconv"
    "time"
    "bufio"
    "strings"

    "github.com/mitchellbreust/OBD_data_dash/device_agent/internal/protocals"
)

// Listen continuously receives slices of PID responses and writes them to CSV.
func Listen(ch <-chan []protocals.PidResponse) {
    for batch := range ch { // listen forever until channel is closed
        line := RawPidsToCsvLine(batch)
        if err := WriteToCSV(line); err != nil {
            fmt.Println("❌ CSV write failed:", err)
        }
    }
}

// Converts a slice of PidResponse to a single CSV line.
func RawPidsToCsvLine(pids []protocals.PidResponse) string {
    timestamp := time.Now().Format(time.RFC3339)
    line := timestamp

    for _, pid := range pids {
        line += fmt.Sprintf(",%s=%v", pid.Pid.Name, pid.Decoded)
    }
    return line
}

// Appends a single line to the daily CSV log.
func WriteToCSV(data string) error {
    day := strconv.Itoa(time.Now().Day())
    month := time.Now().Month().String()
    year := strconv.Itoa(time.Now().Year())
    filename := fmt.Sprintf("%s-%s-%s.csv", day, month, year)

    // Open file in append mode, create if not exists, write-only
    f, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    if err != nil {
        return err
    }
    defer f.Close()

    // Append line + newline
    if _, err := f.WriteString(data + "\n"); err != nil {
        return err
    }

    return nil
}

func WriteTroubleCodes(codes <-chan []protocals.PidTroubleCode) {
	for codeBatch := range codes {
		if err := writeTroubleCodesToFile(codeBatch); err != nil {
			fmt.Println("❌ Error codes CSV write failed:", err)
		}
	}
}

func writeTroubleCodesToFile(codes []protocals.PidTroubleCode) error {
	day := strconv.Itoa(time.Now().Day())
	month := time.Now().Month().String()
	year := strconv.Itoa(time.Now().Year())
	filename := fmt.Sprintf("%s-%s-%s-error-codes.csv", day, month, year)

	// ✅ Step 1: Read existing entries to avoid duplicates
	existing := make(map[string]bool)
	if _, err := os.Stat(filename); err == nil {
		file, err := os.Open(filename)
		if err != nil {
			return fmt.Errorf("failed to open existing error log: %v", err)
		}
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			existing[line] = true
		}
		file.Close()
	}

	// ✅ Step 2: Open file for appending (create if not exists)
	f, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open error log for writing: %v", err)
	}
	defer f.Close()

	// ✅ Step 3: Write only new, unique rows
	writer := bufio.NewWriter(f)
	for _, code := range codes {
		line := fmt.Sprintf("%s,%s", code.Value, code.Des)
		if !existing[line] {
			if _, err := writer.WriteString(line + "\n"); err != nil {
				return fmt.Errorf("failed to write error log: %v", err)
			}
			existing[line] = true // mark as written
		}
	}
	writer.Flush()
	return nil
}