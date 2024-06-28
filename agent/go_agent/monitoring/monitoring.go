package monitoring

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
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

type MonitoringSettings struct {
	CheckSchedule  int    `json:"check_schedule"`
	CheckPing      string `json:"check_ping"`
	RunningProcess string `json:"running_process"`
	ListenPort     string `json:"listen_port"`
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

// sendSlackNotification sends a notification to Slack
func sendSlackNotification(centralServerURL, message, notificationType, agentID, pat string) {
	notification := map[string]string{
		"message": message,
		"type":    notificationType,
	}

	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Authorization", "Bearer "+pat).
		SetBody(notification).
		Post(centralServerURL + "/add-slack-notification")

	if err != nil {
		log.Printf("Failed to send slack notification for agent %s: %v", agentID, err)
	} else if resp.StatusCode() != http.StatusOK {
		log.Printf("Failed to send slack notification for agent %s: %s\n", agentID, resp.String())
	} else {
		log.Printf("Slack notification sent successfully for agent %s", agentID)
	}
}

// CheckRunningProcess checks if the specified processes are running
func CheckRunningProcess(processes, centralServerURL, agentID, pat string) {
	for _, process := range strings.Split(processes, ",") {
		process = strings.TrimSpace(process)
		var cmd *exec.Cmd
		if runtime.GOOS == "windows" {
			cmd = exec.Command("powershell", "-Command", fmt.Sprintf("Get-Process -Name %s -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '%s' }", process, process))
		} else {
			cmd = exec.Command("pgrep", "-x", process)
		}
		var out bytes.Buffer
		cmd.Stdout = &out
		err := cmd.Run()
		if err != nil || out.String() == "" {
			message := fmt.Sprintf("*Running Process Error*\n - Process %s is not running for agent %s", process, agentID)
			sendSlackNotification(centralServerURL, message, "running_process", agentID, pat)
		}
	}
}

// CheckPing checks the connectivity to the specified hosts
func CheckPing(hosts, centralServerURL, agentID, pat string) {
	for _, host := range strings.Split(hosts, ",") {
		host = strings.TrimSpace(host)
		var cmd *exec.Cmd
		if runtime.GOOS == "windows" {
			cmd = exec.Command("ping", "-n", "1", host)
		} else {
			cmd = exec.Command("ping", "-c", "1", host)
		}
		var out bytes.Buffer
		cmd.Stdout = &out
		err := cmd.Run()
		if err != nil {
			message := fmt.Sprintf("*ICMP Error* \n - Ping to host %s failed for agent %s", host, agentID)
			sendSlackNotification(centralServerURL, message, "ping_check", agentID, pat)
		}
	}
}

// CheckListenPort checks if the specified ports are listening
func CheckListenPort(ports, centralServerURL, agentID, pat string) {
	for _, port := range strings.Split(ports, ",") {
		port = strings.TrimSpace(port)
		var cmd *exec.Cmd
		if runtime.GOOS == "windows" {
			cmd = exec.Command("powershell", "-Command", fmt.Sprintf("Test-NetConnection -Port %s", port))
		} else {
			cmd = exec.Command("netstat", "-an", "|", "grep", fmt.Sprintf(":%s", port))
		}
		var out bytes.Buffer
		cmd.Stdout = &out
		err := cmd.Run()
		if err != nil || out.String() == "" {
			message := fmt.Sprintf("*ListenPort Error* \n - Port %s is not listening for agent %s", port, agentID)
			sendSlackNotification(centralServerURL, message, "listen_port", agentID, pat)
		}
	}
}

// CheckIMDSSchedule checks the Azure IMDS schedule for maintenance events
func CheckIMDSSchedule(centralServerURL, agentID, pat string) {
	resp, err := client.R().
		SetHeader("Metadata", "true").
		Get("http://169.254.169.254/metadata/scheduledevents?api-version=2020-07-01")

	if err != nil {
		log.Printf("Failed to fetch IMDS schedule for agent %s: %v", agentID, err)
		return
	}

	if resp.StatusCode() == http.StatusOK {
		var result map[string]interface{}
		if err := json.Unmarshal(resp.Body(), &result); err != nil {
			log.Printf("Failed to parse IMDS schedule for agent %s: %v", agentID, err)
			return
		}
		if events, ok := result["Events"].([]interface{}); ok && len(events) > 0 {
			message := fmt.Sprintf("*IMDS maintenance events detected* for agent %s: \n%v", agentID, events)
			sendSlackNotification(centralServerURL, message, "imds_schedule", agentID, pat)
		}
	} else {
		log.Printf("Failed to fetch IMDS schedule for agent %s: %s\n", agentID, resp.String())
	}
}

// GetMonitoringSettings fetches the monitoring settings for the agent
func GetMonitoringSettings(centralServerURL, agentID, pat string) MonitoringSettings {
	resp, err := client.R().
		SetHeader("Authorization", "Bearer "+pat).
		SetQueryParam("agent_id", agentID).
		Get(centralServerURL + "/get-monitoring-settings")

	if err != nil {
		log.Printf("Failed to fetch monitoring settings for agent %s: %v", agentID, err)
		return MonitoringSettings{}
	}

	if resp.StatusCode() != http.StatusOK {
		log.Printf("Failed to fetch monitoring settings for agent %s: %s\n", agentID, resp.String())
		return MonitoringSettings{}
	}

	var settings MonitoringSettings
	if err := json.Unmarshal(resp.Body(), &settings); err != nil {
		log.Printf("Failed to parse monitoring settings for agent %s: %v", agentID, err)
		return MonitoringSettings{}
	}

	return settings
}

// MonitorAgent monitors the agent based on the settings
func MonitorAgent(centralServerURL, agentID, pat string) {
	for {
		settings := GetMonitoringSettings(centralServerURL, agentID, pat)
		if settings.CheckSchedule == 1 {
			CheckIMDSSchedule(centralServerURL, agentID, pat)
		}
		if settings.CheckPing != "" {
			CheckPing(settings.CheckPing, centralServerURL, agentID, pat)
		}
		if settings.RunningProcess != "" {
			CheckRunningProcess(settings.RunningProcess, centralServerURL, agentID, pat)
		}
		if settings.ListenPort != "" {
			CheckListenPort(settings.ListenPort, centralServerURL, agentID, pat)
		}

		time.Sleep(60 * time.Second)
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
