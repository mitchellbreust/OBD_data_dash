# Device Agent Overview

The **Device Agent** is a lightweight, modular Go application designed to run on an external device (e.g. ESP32, Raspberry Pi, or laptop) that connects to a vehicle’s OBD-II interface through an adapter such as an ELM327.  
Its responsibilities are:
- Establish a connection with the OBD adapter (Bluetooth / USB / Wi-Fi)
- Request and parse OBD-II data (PIDs)
- Buffer and manage local data
- Transmit collected telemetry to the backend server

The goal of this structure is to keep each concern isolated and replaceable — new adapters, protocols, or transports can be added without changing core logic.

---

## 📂 Project Structure

## 🧭 Top-Level Directories

### `cmd/`
- Contains the application entry point (`main.go`).  
- This is where the agent is started — configuration is loaded, an adapter is chosen, and the main runtime loop begins.  
- Code in this package imports functionality from the `internal/` packages but should not contain business logic.

### `internal/`
- Houses all implementation details of the device agent.  
- Packages under `internal/` are **private to this module** and cannot be imported externally.  
- Each sub-package has a single responsibility:

#### `internal/adapters/`
- Manages **raw connections** to OBD-II devices (Bluetooth, USB, Wi-Fi, serial, or direct CAN).  
- Implements a generic `Adapter` interface:
```go
type Adapter interface {
    Connect() error
    Write(cmd string) error
    Read() (string, error)
    Close() error
}
```
Each adapter type (e.g. BluetoothAdapter, WiFiAdapter) provides its own implementation, allowing the rest of the system to remain agnostic to the physical connection.

#### internal/config/
- Handles loading and validation of configuration files or environment variables.
- Examples include serial port names, baud rates, server URLs, and upload intervals.
- This layer ensures runtime parameters are consistent across platforms.

#### internal/data/
- Provides local data buffering and optional storage (e.g. in-memory queue or SQLite).
- If the device loses connectivity, this layer ensures readings are safely cached until transmission resumes.
- It may also perform lightweight aggregation or timestamping.

#### internal/protocols/
- Implements OBD-II protocol logic — translating hexadecimal responses into meaningful sensor values.
For example:
- Sending PID requests like 010C (RPM) or 010D (Speed)
- Parsing responses such as 41 0C 1A F8 → RPM = 1726
- Managing command timing and standard PIDs defined by SAE J1979
- This layer is independent of the communication method — it only understands OBD-II messages.

#### internal/transport/
- Responsible for transmitting collected data to the backend service.
- Implements methods for different transport protocols such as HTTP, MQTT, or WebSockets.
- It abstracts away authentication, batching, retry logic, and offline queuing.