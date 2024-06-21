import requests
import subprocess
import time
import platform
import socket
import os
import configparser
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)

# 설정 파일 경로
CONFIG_FILE = 'agent_config.ini'

# 초기 설정 함수
def initial_setup():
    config = configparser.ConfigParser()
    
    if not os.path.exists(CONFIG_FILE):
        logging.info("Initial setup required.")
        
        # 중앙 서버 주소 입력
        central_server_url = input("Enter the Central Server URL: ")
        
        # 기본 에이전트 ID 생성 또는 사용자 입력
        default_agent_id = get_default_agent_id()
        agent_id = input(f"Enter Agent ID (default: {default_agent_id}): ") or default_agent_id
        
        # 설정 저장
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

# 설정 파일 로드 함수
def load_config():
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    return config['DEFAULT']['CentralServerURL'], config['DEFAULT']['AgentID']

# 기본 에이전트 ID 생성 함수
def get_default_agent_id():
    hostname = socket.gethostname()
    private_ip = socket.gethostbyname(hostname)
    agent_id = f"{hostname}_{private_ip.replace('.', '-')}"
    return agent_id

# OS 정보 가져오기
def get_os_info():
    return platform.system().lower()

# Shell 버전 가져오기
def get_shell_version():
    if get_os_info() == 'windows':
        return subprocess.check_output(['powershell', '-Command', '$PSVersionTable.PSVersion']).decode().strip()
    else:
        return subprocess.check_output(['bash', '--version']).decode().strip()

# 에이전트 등록 함수
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

    response = requests.post(f"{central_server_url}/register-agent", json=agent_data)
    if response.status_code == 200:
        logging.info(f"Agent registered with ID: {agent_id}")
    else:
        logging.error(f"Failed to register agent: {response.json()}")

# 작업 가져오기
def fetch_task(central_server_url, agent_id):
    response = requests.get(f"{central_server_url}/get-task", params={"agent_id": agent_id})
    if response.status_code == 200:
        logging.info(f"Fetched task for agent ID {agent_id}: {response.json()}")
        return response.json()
    else:
        logging.info(f"No task found for agent ID {agent_id}")
    return None

# 결과 보고하기
def report_result(central_server_url, task_id, input_text, command, output, error):
    data = {
        "task_id": task_id,
        "input": input_text,
        "command": command,
        "output": output,
        "error": error
    }
    response = requests.post(f"{central_server_url}/report-result", json=data)
    if response.status_code == 200:
        logging.info("Result reported successfully")
    else:
        logging.error(f"Failed to report result: {response.json()}")

# 상태 보고하기
def report_status(central_server_url, agent_id, status):
    logging.info(f"Reporting status '{status}' for agent ID {agent_id}")
    response = requests.post(f"{central_server_url}/agent-status", json={"agent_id": agent_id, "status": status})
    return response.json()

# 스크립트 실행
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
    register_agent(central_server_url, agent_id)
    
    while True:
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

if __name__ == '__main__':
    main()