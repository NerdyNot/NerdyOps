// monitoring/monitoring.go
package monitoring

import (
	"log"
	"net/http"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/mem"
)

type ResourceUsage struct {
	AgentID     string  `json:"agent_id"`
	CPUUsage    float64 `json:"cpu_usage"`
	MemUsage    float64 `json:"mem_usage"`
	RunningTime float64 `json:"running_time"`
	Timestamp   int64   `json:"timestamp"`
}

var client = resty.New()

// ReportResourceUsage reports the CPU, memory usage, and running time of the agent to the central server
func ReportResourceUsage(centralServerURL, agentID string, startTime time.Time) {
	for {
		cpuUsage, _ := cpu.Percent(0, false)
		memUsage, _ := mem.VirtualMemory()
		runningTime := time.Since(startTime).Seconds()
		timestamp := time.Now().Unix()

		resourceUsage := ResourceUsage{
			AgentID:     agentID,
			CPUUsage:    cpuUsage[0],
			MemUsage:    memUsage.UsedPercent,
			RunningTime: runningTime,
			Timestamp:   timestamp,
		}

		resp, err := client.R().
			SetHeader("Content-Type", "application/json").
			SetBody(resourceUsage).
			Post(centralServerURL + "/report-resource-usage")

		if err != nil {
			log.Printf("Failed to report resource usage: %v", err)
		} else if resp.StatusCode() != http.StatusOK {
			log.Printf("Failed to report resource usage: %s\n", resp.String())
		} else {
			log.Println("Resource usage reported successfully")
		}

		time.Sleep(60 * time.Second) // Report resource usage every 60 seconds
	}
}
