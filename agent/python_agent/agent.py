import requests
import subprocess
import time
import platform
import socket
import os
import configparser
import logging
from logo import print_logo

# Logging configuration
logging.basicConfig(level=logging.INFO)

# Path to the configuration file
CONFIG_FILE = 'agent_config.ini'

# Initial setup function to configure the agent
def initial_setup():
    config = configparser.ConfigParser()
    
    if not os.path.exists(CONFIG_FILE):
        logging.info("Initial setup required.")
        
        # Prompt the user to enter the Central Server URL
        central_server_url = input("Enter the Central Server URL: ")
        
        # Generate the default agent ID or prompt the user to enter a custom one
        default_agent_id = get_default_agent_id()
        agent_id = input(f"Enter Agent ID (default: {default_agent_id}): ") or default_agent_id
        
        # Save the configuration
        config['DEFAULT'] = {
            'CentralServerURL': central_server_url,
            'AgentID': agent_id
        }
        
        with open(CONFIG_FILE, 'w') as configfile:
            config.write(configfile)
        
        logging.info(f"Configuration saved to {CONFIG_FILE}")
    else:
        logging.info(f"Configuration file {CONFIG_FILE} already exists. Skipping initial setup.")
    
    return load_config()

# Load configuration from the configuration file
def load_config():
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    return config['DEFAULT']['CentralServerURL'], config['DEFAULT']['AgentID']

# Generate a default agent ID based on the hostname and private IP address
def get_default_agent_id():
    hostname = socket.gethostname()
    private_ip = socket.gethostbyname(hostname)
    agent_id = f"{hostname}_{private_ip.replace('.', '-')}"
    return agent_id

# Get the operating system type of the machine
def get_os_info():
    return platform.system().lower()

# Get the shell version installed on the machine
def get_shell_version():
    if get_os_info() == 'windows':
        return subprocess.check_output(['powershell', '-Command', '$PSVersionTable.PSVersion']).decode().strip()
    else:
        return subprocess.check_output(['bash', '--version']).decode().strip()

# Register the agent with the central server
def register_agent(central_server_url, agent_id):
    computer_name = socket.gethostname()
    private_ip = socket.gethostbyname(computer_name)
    os_type = get_os_info()
    shell_version = get_shell_version()

    agent_data = {
        "agent_id": agent_id,
        "computer_name": computer_name,
        "private_ip": private_ip,
        "os_type": os_type,
        "shell_version": shell_version
    }

    try:
        response = requests.post(f"{central_server_url}/register-agent", json=agent_data)
        if response.status_code == 200:
            logging.info(f"Agent registered with ID: {agent_id}")
        else:
            logging.error(f"Failed to register agent: {response.json()}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to register agent due to connection error: {e}")

# Fetch a task for the agent from the central server
def fetch_task(central_server_url, agent_id):
    try:
        response = requests.get(f"{central_server_url}/get-task", params={"agent_id": agent_id})
        if response.status_code == 200:
            logging.info(f"Fetched task for agent ID {agent_id}: {response.json()}")
            return response.json()
        else:
            logging.info(f"No task found for agent ID {agent_id}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to fetch task due to connection error: {e}")
    return None

# Report the result of the executed task back to the central server
def report_result(central_server_url, task_id, input_text, command, output, error):
    data = {
        "task_id": task_id,
        "input": input_text,
        "command": command,
        "output": output,
        "error": error
    }
    try:
        response = requests.post(f"{central_server_url}/report-result", json=data)
        if response.status_code == 200:
            logging.info("Result reported successfully")
        else:
            logging.error(f"Failed to report result: {response.json()}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to report result due to connection error: {e}")

# Report the current status of the agent to the central server
def report_status(central_server_url, agent_id, status):
    logging.info(f"Reporting status '{status}' for agent ID {agent_id}")
    try:
        response = requests.post(f"{central_server_url}/agent-status", json={"agent_id": agent_id, "status": status})
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to report status due to connection error: {e}")
    return None

# Execute the script provided by the central server
def execute_script(script_code):
    logging.info(f"Executing script: {script_code}")
    try:
        if get_os_info() == 'windows':
            result = subprocess.run(["powershell", "-Command", script_code], capture_output=True, text=True)
        else:
            result = subprocess.run(script_code, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        output = result.stdout
        error = result.stderr
    except subprocess.CalledProcessError as e:
        output = ''
        error = str(e)
        logging.error(f"Error executing script: {e}")
    
    logging.info(f"Script executed. Output: {output}\nError: {error}")
    return output, error

def main():
    central_server_url, agent_id = initial_setup()

    # Check server connection
    if not check_server_connection(central_server_url):
        central_server_url = reconnect_or_exit(central_server_url)

    register_agent(central_server_url, agent_id)
    
    while True:
        try:
            task = fetch_task(central_server_url, agent_id)
            if task:
                task_id = task['task_id']
                input_text = task["input"]
                script_code = task['script_code']
                logging.info(f"Received task with ID {task_id}. Executing script...")
                output, error = execute_script(script_code)
                
                report_result(central_server_url, task_id, input_text, script_code, output, error)
                report_status(central_server_url, agent_id, "idle")
            else:
                report_status(central_server_url, agent_id, "idle")
                time.sleep(10)
        except Exception as e:
            logging.error(f"An error occurred: {e}")
            time.sleep(10)

# Check the connection to the central server
def check_server_connection(central_server_url):
    try:
        response = requests.get(f"{central_server_url}/health")
        if response.status_code == 200:
            return True
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to connect to the server: {e}")
    return False

# Handle server reconnection or URL change when disconnected
def reconnect_or_exit(central_server_url):
    while True:
        print(f"Failed to connect to the Central Server at {central_server_url}.")
        print("Would you like to retry (r), change the server URL (y), or exit (n)? [r/y/n] (default: r): ")
        choice = input().strip().lower()

        if choice == 'y':
            central_server_url = input("Enter the new Central Server URL: ").strip()
            if check_server_connection(central_server_url):
                return central_server_url
            print("Failed to connect. Please check the URL and try again.")
        elif choice == 'n':
            print("Exiting.")
            os.Exit(0)
        else:  # Default action or 'r'
            if check_server_connection(central_server_url):
                return central_server_url
            print("Failed to reconnect. Trying again.")

if __name__ == '__main__':
    print_logo()
    main()
