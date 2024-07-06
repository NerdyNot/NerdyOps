package pat

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"
)

var client = resty.New()

const configFile = "agent_config.json"

// LoadPAT loads the PAT from the configuration file.
func LoadPAT() string {
	viper.SetConfigFile(configFile)
	err := viper.ReadInConfig()
	if err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}
	return viper.GetString("PAT")
}

// SavePAT saves the PAT to the configuration file.
func SavePAT(pat string) {
	viper.SetConfigFile(configFile)
	viper.Set("PAT", pat)
	err := viper.WriteConfig()
	if err != nil {
		log.Fatalf("Error writing config file: %v", err)
	}
}

// InputPAT prompts the user to input the PAT.
func InputPAT() string {
	var pat string
	fmt.Print("Enter the PAT: ")
	fmt.Scanln(&pat)
	return pat
}

// VerifyPAT verifies the PAT with the central server.
func VerifyPAT(centralServerURL, pat string) bool {
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(map[string]string{"token": pat}).
		Post(fmt.Sprintf("%s/verify_pat", centralServerURL))

	if err != nil || resp.StatusCode() != http.StatusOK {
		return false
	}
	return true
}

// AuthenticatePAT handles the PAT authentication process.
func AuthenticatePAT(centralServerURL string) string {
	pat := LoadPAT()
	if pat != "" && VerifyPAT(centralServerURL, pat) {
		log.Println("PAT authentication was successfully completed.")
		return pat
	}

	for {
		fmt.Println("PAT is invalid or not found.")
		fmt.Print("Would you like to retry (r), enter a new PAT (y), or exit (n)? [r/y/n] (default: r): ")
		var input string
		fmt.Scanln(&input)

		switch strings.ToLower(input) {
		case "y":
			pat = InputPAT()
			if VerifyPAT(centralServerURL, pat) {
				SavePAT(pat)
				return pat
			}
			fmt.Println("PAT is invalid. Please try again.")
		case "n":
			fmt.Println("Exiting.")
			return ""
		default:
			if VerifyPAT(centralServerURL, pat) {
				return pat
			}
			fmt.Println("PAT is invalid. Trying again.")
		}
	}
}
