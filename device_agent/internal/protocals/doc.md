# 📡 Protocols Package — OBD-II Communication Layer

The `protocols` package defines the **communication logic, decoding rules, and data interpretation layer** for OBD-II telemetry.  
It acts as the bridge between the **low-level adapter layer** (which handles serial transport) and the **backend or telemetry storage layer** (which consumes structured vehicle data).

---

## 🧱 Overview

This package defines the **OBD-II protocol logic** for querying, detecting, and decoding data from automotive ECUs through interfaces such as ELM327-compatible adapters.

At a high level:
- `adapters` handle **physical I/O** (USB, Bluetooth, serial)
- `protocols` defines **how to talk** to the ECU (e.g. send PIDs, interpret responses)

The goal is to keep the `protocols` layer **hardware-agnostic**, so it works regardless of whether the connection comes from a laptop, Raspberry Pi, or ESP32.

---

## 🎯 Purpose and Design Goals

| Goal | Description |
|------|--------------|
| 🔌 **Modularity** | Each protocol element (detector, decoder, query logic) is split into independent files and structs. |
| 🧠 **Clarity** | All OBD-II logic (PID lists, formulas, decoders) lives in one place, isolated from low-level serial handling. |
| ⚙️ **Reusability** | The same logic can be reused both on the **device agent** and on the **backend server** for data decoding. |
| 🧩 **Extensibility** | New sensors, manufacturer-specific PIDs, or alternate standards (UDS, SAE J1939) can be added later. |

---

## 🗂 Directory Structure

```text
internal/protocols/
│
├── registry.go # Defines PID metadata and list of standard PIDs
├── decoder.go # Contains decoding formulas for interpreting raw bytes to actual values
├── detector.go # Scans which PIDs are supported by the vehicle
├── query.go # Sends PID requests and aggregates responses
└── utils.go # (optional) Helper functions for hex and parsing
```

## 🧰 Example Usage

```
adapter := &adapters.SerialAdapter{}
adapter.Connect()
defer adapter.Close()

// Detect supported PIDs
supported, _ := protocols.DetectSupportedPids(adapter)

// Query all supported PIDs
results, _ := protocols.QueryPids(adapter, supported)

for _, res := range results {
    fmt.Printf("%-25s | PID 0x%02X | %v %s\n",
        res.Pid.Name, res.Pid.PID, res.Decoded, res.Pid.Unit)
}

```