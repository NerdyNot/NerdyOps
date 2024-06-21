import requests
import subprocess
import time
import config
import platform
import socket
import logging

logging.basicConfig(level=logging.INFO)

CENTRAL_SERVER_URL = config.CENTRAL_SERVER_URL

def get_os_type():
    """현재 시스템의 OS 타입을 반환합니다 ('windows' 또는 'linux')."""
    os_system = platform.system().lower()
    if os_system == 'windows':
        return 'windows'
    elif os_system == 'linux':
        return 'linux'
    else:
        return 'unknown'

def get_agent_id():
    """시스템의 호스트 이름과 사설 IP 주소를 기반으로 고유한 에이전트 ID를 생성합니다."""
    hostname = socket.gethostname()
    private_ip = socket.gethostbyname(hostname)
    agent_id = f"{hostname}_{private_ip.replace('.', '-')}"
    return agent_id

def register_agent():
    """중앙 서버에 에이전트를 등록"""
    agent_id = get_agent_id()
    os_type = get_os_type()
    if os_type == 'unknown':
        logging.error("Unsupported OS type. Exiting.")
        return
    
    response = requests.post(f"{CENTRAL_SERVER_URL}/register-agent", json={"agent_id": agent_id, "os_type": os_type})
    logging.info(f"Agent registered with ID: {agent_id}, OS: {os_type}")
    return response.json()

def fetch_task():
    """중앙 서버에서 작업을 요청"""
    agent_id = get_agent_id()
    response = requests.get(f"{CENTRAL_SERVER_URL}/get-task", params={"agent_id": agent_id})
    if response.status_code == 200:
        logging.info(f"Fetched task for agent ID {agent_id}: {response.json()}")
        return response.json()
    else:
        logging.info(f"No task found for agent ID {agent_id}")
    return None

def report_result(task_id, input_text, command, output, error):
    """작업 결과를 중앙 서버에 보고"""
    data = {
        "task_id": task_id,
        "input": input_text,
        "command": command,
        "output": output,
        "error": error
    }
    response = requests.post(f"{CENTRAL_SERVER_URL}/report-result", json=data)
    if response.status_code == 200:
        print("Result reported successfully")
    else:
        print(f"Failed to report result: {response.json()}")

def report_status(status):
    """에이전트의 상태를 중앙 서버에 보고"""
    agent_id = get_agent_id()
    logging.info(f"Reporting status '{status}' for agent ID {agent_id}")
    response = requests.post(f"{CENTRAL_SERVER_URL}/agent-status", json={"agent_id": agent_id, "status": status})
    return response.json()

def execute_script(script_code):
    """스크립트를 실행"""
    logging.info(f"Executing script: {script_code}")
    try:
        # 현재 OS가 Windows인지 Linux인지 확인
        if get_os_type() == 'windows':
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
    register_agent()
    
    while True:
        task = fetch_task()
        if task:
            task_id = task['task_id']
            input = task["input"]
            script_code = task['script_code']
            logging.info(f"Received task with ID {task_id}. Executing script...")
            output, error = execute_script(script_code)
            
            report_result(task_id, input, script_code, output, error)
            report_status("idle")
        else:
            report_status("idle")
            time.sleep(10)

if __name__ == '__main__':
    main()
