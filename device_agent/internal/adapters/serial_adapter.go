package adapter

import (
	"go.bug.st/serial"

	"fmt"
	"log"
	"strings"
	"time"
)

type SerialAdapter struct {
	con serial.Port
}

// isOBD2Response checks if a response buffer looks like an OBD-II adapter response.
func isOBD2Response(buf []byte, portName string) bool {
	response := strings.ToUpper(string(buf))
	response = strings.ReplaceAll(response, "\r", "")
	response = strings.ReplaceAll(response, "\n", "")
	response = strings.TrimSpace(response)

	// Check for ELM or OBD keywords
	if strings.Contains(response, "ELM") ||
		strings.Contains(response, "OBD") ||
		strings.Contains(response, "STN") ||
		strings.Contains(response, "OK") {

		fmt.Printf("✅ Valid OBD-II adapter detected on %s: %q\n", portName, response)
		return true
	}

	return false
}

// OsConnectionHandler scans available serial ports and returns an open OBD-II connection if found.
func OsConnectionHandler() (serial.Port, error) {
	modes := []*serial.Mode{
		{BaudRate: 115200},
		{BaudRate: 38400},
		{BaudRate: 9600},
	}

	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, fmt.Errorf("failed to list ports: %v", err)
	}

	if len(ports) == 0 {
		log.Println("No serial ports found.")
		return nil, nil
	}

	for _, portName := range ports {
		fmt.Println("🔍 Scanning port:", portName)

		var port serial.Port
		for _, mode := range modes {
			port, err = serial.Open(portName, mode)
			if err == nil {
				fmt.Printf("Opened %s at %d baud\n", portName, mode.BaudRate)
				break
			}
		}

		if port == nil {
			fmt.Printf("❌ Could not open %s at any common baud rate\n", portName)
			continue
		}

		port.SetReadTimeout(2 * time.Second)
		port.ResetInputBuffer()
		port.ResetOutputBuffer()

		// Send "ATI" command (identify device)
		_, err = port.Write([]byte("ATI\r"))
		if err != nil {
			log.Printf("Write failed on %s: %v\n", portName, err)
			port.Close()
			continue
		}

		time.Sleep(500 * time.Millisecond)

		buf := make([]byte, 256)
		n, err := port.Read(buf)
		if err != nil {
			log.Printf("Read failed on %s: %v\n", portName, err)
			port.Close()
			continue
		}

		if isOBD2Response(buf[:n], portName) {
			fmt.Printf("🎯 Using %s as OBD-II adapter.\n", portName)
			return port, nil // ✅ keep it open and return it
		} else {
			fmt.Printf("⚪ %s responded, but not recognized as OBD-II adapter.\n", portName)
			port.Close()
		}
	}

	fmt.Println("❌ No OBD-II adapters detected.")
	return nil, nil
}

// Connect attempts to find and connect to an OBD-II adapter and store it in the struct.
func (s *SerialAdapter) Connect() error {
	res, err := OsConnectionHandler()
	if err != nil {
		return err
	}

	if res == nil {
		return fmt.Errorf("could not connect via serial connection")
	}

	s.con = res
	fmt.Println("✅ Serial connection established and stored in adapter.")
	return nil
}

// Connect attempts to find and connect to an OBD-II adapter and store it in the struct.
func (s *SerialAdapter) Close() error {
	err :=s.con.Close()
	if err != nil {
		return err
	}
}

// Write sends data (commands) to the OBD-II adapter.
func (s *SerialAdapter) Write(data string) error {
	if s.con == nil {
		return fmt.Errorf("no serial connection established")
	}

	// Write the data
	_, err := s.con.Write([]byte(data))
	if err != nil {
		return fmt.Errorf("failed to write to OBD adapter: %v", err)
	}

	fmt.Printf("➡️ Sent: %q\n", data)
	return nil
}

// Read reads the response from the OBD-II adapter.
func (s *SerialAdapter) Read() (string, error) {
	if s.con == nil {
		return "", fmt.Errorf("no serial connection established")
	}

	buf := make([]byte, 256)
	n, err := s.con.Read(buf)
	if err != nil {
		return "", fmt.Errorf("failed to read from OBD adapter: %v", err)
	}

	resp := strings.TrimSpace(string(buf[:n]))
	fmt.Printf("⬅️ Received: %q\n", resp)
	return resp, nil
}
