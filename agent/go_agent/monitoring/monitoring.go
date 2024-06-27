// monitoring/monitoring.go
package monitoring

import (
	"fmt"
	"io/ioutil"
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
	IMDS        string  `json:"imds"`
}

var client = resty.New()

const (
	CSPUnknown = iota
	CSPAWS
	CSPAzure
	CSPGCP
)

const (
	AWSIMDSEndpoint   = "http://169.254.169.254/latest/meta-data/"
	AzureIMDSEndpoint = "http://169.254.169.254/metadata/instance?api-version=2021-02-01"
	GCPIMDSEndpoint   = "http://169.254.169.254/computeMetadata/v1/"
)

// CheckCSP detects the CSP of the VM
func CheckCSP() int {
	client := &http.Client{
		Timeout: 2 * time.Second,
	}

	// Check AWS IMDS
	resp, err := client.Get(AWSIMDSEndpoint)
	if err == nil && resp.StatusCode == http.StatusOK {
		return CSPAWS
	}

	// Check Azure IMDS
	req, _ := http.NewRequest("GET", AzureIMDSEndpoint, nil)
	req.Header.Add("Metadata", "true")
	resp, err = client.Do(req)
	if err == nil && resp.StatusCode == http.StatusOK {
		return CSPAzure
	}

	// Check GCP IMDS
	req, _ = http.NewRequest("GET", GCPIMDSEndpoint, nil)
	req.Header.Add("Metadata-Flavor", "Google")
	resp, err = client.Do(req)
	if err == nil && resp.StatusCode == http.StatusOK {
		return CSPGCP
	}

	return CSPUnknown
}

// FetchIMDS fetches the instance metadata based on the detected CSP
func FetchIMDS(csp int) (string, error) {
	client := &http.Client{
		Timeout: 2 * time.Second,
	}

	switch csp {
	case CSPAWS:
		resp, err := client.Get(AWSIMDSEndpoint)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()
		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return "", err
		}
		return string(data), nil
	case CSPAzure:
		req, _ := http.NewRequest("GET", AzureIMDSEndpoint, nil)
		req.Header.Add("Metadata", "true")
		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()
		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return "", err
		}
		return string(data), nil
	case CSPGCP:
		req, _ := http.NewRequest("GET", GCPIMDSEndpoint, nil)
		req.Header.Add("Metadata-Flavor", "Google")
		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()
		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return "", err
		}
		return string(data), nil
	default:
		return "", fmt.Errorf("unknown CSP")
	}
}

// ReportResourceUsage reports the CPU, memory usage, and running time of the agent to the central server
func ReportResourceUsage(centralServerURL, agentID string, startTime time.Time) {
	csp := CheckCSP()
	imdsData, err := FetchIMDS(csp)
	if err != nil {
		log.Printf("Failed to fetch IMDS data: %v", err)
	}

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
			IMDS:        imdsData,
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
