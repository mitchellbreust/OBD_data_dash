package data

import (
	"github.com/mitchellbreust/OBD_data_dash/device_agent/internal/protocals"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)
// data/upload/live

type UploadData struct {
	DataType string `json:"data_type"`
	DataVal  string `json:"data_val"`
}

type JSONBody struct {
	Key  string       `json:"key"`
	Data []UploadData `json:"data"`
}

func passPidListToJsonStr(list []protocals.PidResponse) []UploadData {
	length := len(list)
	jsonData := make([]UploadData, length)

	for i, pid := range list {
		jsonData[i] = UploadData{
			DataType: pid.Pid.Name,
			DataVal:  fmt.Sprintf("%v", pid.Decoded),
		}
	}
	return jsonData
}

func AddToUploadQ(device_id string, ch <-chan []protocals.PidResponse) {
    // Live ingest endpoint (no browser CORS, device authenticates via body key)
    requestURL := "https://obd-data-dash.onrender.com/data/live"

	for batch := range ch {
		time.Sleep(300 * time.Millisecond)
		jsonData := passPidListToJsonStr(batch)

		body := JSONBody{
			Key: device_id,
			Data: jsonData,
		}

		jsonBytes, err := json.Marshal(body)
		if err != nil {
			fmt.Println("Error encoding JSON:", err)
			continue
		}

		req, err := http.NewRequest("POST", requestURL, bytes.NewBuffer(jsonBytes))
		if err != nil {
			fmt.Println("Error creating request:", err)
			continue
		}

		req.Header.Set("Content-Type", "application/json")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			fmt.Println("Error sending request:", err)
			continue
		}
		defer resp.Body.Close()

		fmt.Println("Upload status:", resp.Status)
	}
}