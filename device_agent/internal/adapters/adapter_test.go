package adapter

import (
	"testing"
)

// TestConnect tests that an OBD-II adapter can be detected and connected.
func TestConnect(t *testing.T) {
	a := SerialAdapter{}

	// Try connecting
	if err := a.Connect(); err != nil {
		t.Fatalf("❌ Failed to connect: %v", err)
	}
	defer a.Close()

	t.Log("✅ Connection established successfully.")
}

// TestBasicCommands tests communication with the adapter.
func TestBasicCommands(t *testing.T) {
	a := SerialAdapter{}

	// Establish connection
	if err := a.Connect(); err != nil {
		t.Fatalf("❌ Failed to connect: %v", err)
	}
	defer a.Close()

	// List of safe AT commands to test without a car
	commands := []string{
		"ATI\r",  // Identify adapter
		"ATZ\r",  // Reset
		"ATE0\r", // Turn echo off
		"ATL0\r", // Turn linefeeds off
	}

	for _, cmd := range commands {
		t.Logf("➡️ Sending: %q", cmd)
		if err := a.Write(cmd); err != nil {
			t.Errorf("❌ Write failed for %q: %v", cmd, err)
			continue
		}

		resp, err := a.Read()
		if err != nil {
			t.Errorf("❌ Read failed for %q: %v", cmd, err)
			continue
		}

		t.Logf("⬅️ Response for %q: %q", cmd, resp)
	}

	t.Log("✅ Basic AT command test completed.")
}
