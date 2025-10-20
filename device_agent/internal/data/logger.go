package data

import (
    "fmt"
    "os"
    "strconv"
    "time"

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