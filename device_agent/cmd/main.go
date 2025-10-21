package main

import (
	"fmt"
	"os"
	"time"

	"github.com/mitchellbreust/OBD_data_dash/device_agent/internal/adapters"
	"github.com/mitchellbreust/OBD_data_dash/device_agent/internal/data"
	"github.com/mitchellbreust/OBD_data_dash/device_agent/internal/protocals"
)

// main event loop — only using serial adapter while testing
func main() {
	serialAdap := adapter.SerialAdapter{}

	// Connect to adapter
	err := serialAdap.Connect()
	if err != nil {
		fmt.Println("❌ Stopping main program, error:", err)
		os.Exit(1)
	}

	// ✅ Ensure ELM327 reset + port closure on exit
	defer func() {
		fmt.Println("🔧 Cleaning up ELM327 adapter...")
		// Send a reset to release adapter state
		serialAdap.Write("ATZ\r")
		time.Sleep(1 * time.Second)
		serialAdap.Close()
		fmt.Println("✅ Adapter closed cleanly.")
	}()

	// Detect supported PIDs (now with smaller subset)
	fmt.Println("🔍 Detecting supported PIDs...")
	supported, err := protocals.DetectSupportedPids(&serialAdap)
	if err != nil {
		fmt.Println("❌ Stopping main program, error:", err)
		return
	}

	fmt.Printf("✅ Found %d supported PIDs\n", len(supported))
	for _, pid := range supported {
		fmt.Printf("  - %s (0x%02X)\n", pid.Name, pid.PID)
	}

	ch := make(chan []protocals.PidResponse)
	go data.Listen(ch)

	ch2 := make(chan []protocals.PidTroubleCode)
	go data.WriteTroubleCodes(ch2)

	// Set lastErrorRead to 90 seconds ago so error check runs immediately
	lastErrorRead := time.Now().Add(-90 * time.Second)
	fmt.Println("🚗 Starting continuous data collection...")
	for {
		res, err := protocals.QueryPids(&serialAdap, supported)
		if err != nil {
			fmt.Println("⚠️", err)
			continue
		}

		ch <- res
		time.Sleep(300 * time.Millisecond)

		// Check if 90 seconds have passed since last error code read
		if time.Since(lastErrorRead).Seconds() >= 90 {
			lastErrorRead = time.Now()
			fmt.Println("🔍 Checking for trouble codes...")
			res1, err := protocals.GetTroubleCodes(&serialAdap)
			if err != nil {
				fmt.Printf("⚠️ Error reading trouble codes: %v\n", err)
				continue
			}
			if len(res1) > 0 {
				fmt.Printf("🚨 Found %d trouble codes\n", len(res1))
				for _, code := range res1 {
					fmt.Printf("  - %s: %s\n", code.Value, code.Des)
				}
			} else {
				fmt.Println("✅ No trouble codes found")
			}
			ch2 <- res1
		}
	}
}
