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

	// Detect supported PIDs
	supported, err := protocals.DetectSupportedPids(&serialAdap)
	if err != nil {
		fmt.Println("❌ Stopping main program, error:", err)
		return
	}

	ch := make(chan []protocals.PidResponse)
	go data.Listen(ch)

	// Main loop: query data continuously
	for {
		res, err := protocals.QueryPids(&serialAdap, supported)
		if err != nil {
			fmt.Println("⚠️", err)
			continue
		}

		ch <- res
		time.Sleep(300 * time.Millisecond)
	}
}
