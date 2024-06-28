package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/NerdyNot/NerdyOps.git/agent/go_agent/logo"
	"github.com/NerdyNot/NerdyOps.git/agent/go_agent/monitoring"
	"github.com/NerdyNot/NerdyOps.git/agent/go_agent/pat"
	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"
)

type AgentData struct {
	AgentID      string `json:"agent_id"`
	ComputerName string `json:"computer_name"`
	PrivateIP    string `json:"private_ip"`
	OSType       string `json:"os_type"`
	ShellVersion string `json:"shell_version"`
}

type Task struct {
	TaskID     string `json:"task_id"`
	Input      string `json:"input"`
	Command    string `json:"command"`
	ScriptCode string `json:"script_code"`
}

type Result struct {
	TaskID  string `json:"task_id"`
	Input   string `json:"input"`
	Command string `json:"command"`
	Output  string `json:"output"`
	Error   string `json:"error"`
}

var configFile = "agent_config.json"
var client = resty.New()
var startTime time.Time

func initialSetup() {
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		viper.SetConfigFile(configFile)

		fmt.Println("Initial setup required.")
		var centralServerURL string
		fmt.Print("Enter the Central Server URL: ")
		fmt.Scanln(&centralServerURL)

		defaultAgentID := getDefaultAgentID()
		fmt.Printf("Enter Agent ID (default: %s): ", defaultAgentID)
		var agentID string
		fmt.Scanln(&agentID)
		if agentID == "" {
			agentID = defaultAgentID
		}

		viper.Set("CentralServerURL", centralServerURL)
		viper.Set("AgentID", agentID)

		err := viper.WriteConfigAs(configFile)
		if err != nil {
			log.Fatalf("Error writing config file: %v", err)
		}
		fmt.Printf("Configuration saved to %s\n", configFile)
	} else {
		fmt.Printf("Configuration file %s already exists. Skipping initial setup.\n", configFile)
	}
}

func loadConfig() (string, string) {
	viper.SetConfigFile(configFile)
	err := viper.ReadInConfig()
	if err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}
	return viper.GetString("CentralServerURL"), viper.GetString("AgentID")
}

func getDefaultAgentID() string {
	hostname, _ := os.Hostname()
	privateIP := getPrivateIP()
	return fmt.Sprintf("%s_%s", hostname, strings.ReplaceAll(privateIP, ".", "-"))
}

func getPrivateIP() string {
	ifaces, err := net.Interfaces()
	if err != nil {
		log.Fatal(err)
	}

	for _, iface := range ifaces {
		addrs, err := iface.Addrs()
		if err != nil {
			log.Fatal(err)
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip != nil && ip.IsPrivate() {
				return ip.String()
			}
		}
	}
	return "127.0.0.1"
}

func getOSInfo() string {
	return strings.ToLower(runtime.GOOS)
}

func getShellVersion() string {
	if getOSInfo() == "windows" {
		out, _ := exec.Command("powershell", "-Command", "$PSVersionTable.PSVersion").Output()
		return strings.TrimSpace(string(out))
	} else {
		out, _ := exec.Command("bash", "--version").Output()
		return strings.TrimSpace(string(out))
	}
}

func registerAgent(centralServerURL, agentID, pat string) {
	computerName, _ := os.Hostname()
	privateIP := getPrivateIP()
	osType := getOSInfo()
	shellVersion := getShellVersion()

	agentData := AgentData{
		AgentID:      agentID,
		ComputerName: computerName,
		PrivateIP:    privateIP,
		OSType:       osType,
		ShellVersion: shellVersion,
	}

	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Authorization", "Bearer "+pat).
		SetBody(agentData).
		Post(fmt.Sprintf("%s/register-agent", centralServerURL))

	if err != nil {
		log.Fatalf("Failed to register agent: %v", err)
	}

	if resp.StatusCode() == http.StatusOK {
		log.Printf("Agent registered with ID: %s\n", agentID)
	} else {
		log.Printf("Failed to register agent: %s\n", resp.String())
	}
}

func checkServerConnection(centralServerURL string) bool {
	resp, err := client.R().Get(centralServerURL + "/health")
	if err != nil || resp.StatusCode() != http.StatusOK {
		return false
	}
	return true
}

func reconnectOrExit(centralServerURL string) string {
	for {
		fmt.Printf("Failed to connect to the Central Server at %s.\n", centralServerURL)
		fmt.Print("Would you like to retry (r), change the server URL (y), or exit (n)? [r/y/n] (default: r): ")
		var input string
		fmt.Scanln(&input)

		switch strings.ToLower(input) {
		case "y":
			fmt.Print("Enter the new Central Server URL: ")
			fmt.Scanln(&centralServerURL)
			if checkServerConnection(centralServerURL) {
				return centralServerURL
			}
			fmt.Println("Failed to connect. Please check the URL and try again.")
		case "n":
			fmt.Println("Exiting.")
			os.Exit(0)
		default:
			if checkServerConnection(centralServerURL) {
				return centralServerURL
			}
			fmt.Println("Failed to reconnect. Trying again.")
		}
	}
}

func fetchTask(centralServerURL, agentID, pat string) *Task {
	resp, err := client.R().
		SetHeader("Authorization", "Bearer "+pat).
		SetQueryParam("agent_id", agentID).
		Get(fmt.Sprintf("%s/get-task", centralServerURL))

	if err != nil {
		log.Printf("Error fetching task: %v", err)
		return nil
	}

	if resp.StatusCode() == http.StatusOK {
		var task Task
		err := json.Unmarshal(resp.Body(), &task)
		if err != nil {
			log.Printf("Error parsing task: %v", err)
			return nil
		}
		log.Printf("Fetched task for agent ID %s: %v\n", agentID, task)
		return &task
	}

	log.Printf("No task found for agent ID %s\n", agentID)
	return nil
}

func reportResult(centralServerURL, pat string, result Result) {
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Authorization", "Bearer "+pat).
		SetBody(result).
		Post(fmt.Sprintf("%s/report-result", centralServerURL))

	if err != nil {
		log.Printf("Failed to report result: %v", err)
		return
	}

	if resp.StatusCode() == http.StatusOK {
		log.Println("Result reported successfully")
	} else {
		log.Printf("Failed to report result: %s\n", resp.String())
	}
}

func reportStatus(centralServerURL, agentID, status, pat string) {
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Authorization", "Bearer "+pat).
		SetBody(map[string]string{"agent_id": agentID, "status": status}).
		Post(fmt.Sprintf("%s/agent-status", centralServerURL))

	if err != nil {
		log.Printf("Failed to report status: %v", err)
		return
	}

	if resp.StatusCode() == http.StatusOK {
		log.Printf("Status '%s' reported for agent ID %s\n", status, agentID)
	} else {
		log.Printf("Failed to report status: %s\n", resp.String())
	}
}

func executeScript(scriptCode string) (string, string) {
	log.Printf("Executing script: %s\n", scriptCode)
	var cmd *exec.Cmd
	if getOSInfo() == "windows" {
		cmd = exec.Command("powershell", "-Command", scriptCode)
	} else {
		cmd = exec.Command("bash", "-c", scriptCode)
	}

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		log.Printf("Error executing script: %v", err)
		return "", err.Error()
	}

	log.Printf("Script executed. Output: %s\nError: %s\n", out.String(), stderr.String())
	return out.String(), stderr.String()
}

func main() {
	// Initial setup and configuration
	initialSetup()
	logo.PrintLogo()
	centralServerURL, agentID := loadConfig()

	// PAT Authentication
	pat := pat.AuthenticatePAT(centralServerURL)
	if pat == "" {
		log.Fatalln("Failed to authenticate with PAT. Exiting.")
	}

	// Check server connection
	if !checkServerConnection(centralServerURL) {
		centralServerURL = reconnectOrExit(centralServerURL)
	}

	// Register the agent with the central server
	registerAgent(centralServerURL, agentID, pat)

	startTime = time.Now() // Record the start time

	go monitoring.ReportResourceUsage(centralServerURL, agentID, startTime) // Run resource usage reporting asynchronously
	go monitoring.MonitorAgent(centralServerURL, agentID, pat)              // Run agent monitoring based on settings

	// Main loop to fetch and execute tasks
	for {
		task := fetchTask(centralServerURL, agentID, pat)
		if task != nil {
			log.Printf("Received task with ID %s. Executing script...\n", task.TaskID)
			output, error := executeScript(task.ScriptCode)
			result := Result{
				TaskID:  task.TaskID,
				Input:   task.Input,
				Command: task.Command,
				Output:  output,
				Error:   error,
			}
			reportResult(centralServerURL, pat, result)
			reportStatus(centralServerURL, agentID, "idle", pat)
		} else {
			reportStatus(centralServerURL, agentID, "idle", pat)
			time.Sleep(10 * time.Second)
		}
	}
}
