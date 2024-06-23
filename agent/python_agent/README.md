# RunAIOps Python Agent

This project is a Python-based remote agent that communicates with a central server to fetch tasks, execute scripts, and report results. The agent supports both Windows and Linux systems and can automatically handle connection issues with the central server.

## Features

- Fetch tasks from a central server and execute them on the agent machine.
- Report the results of the executed scripts back to the central server.
- Handle disconnections and attempt to reconnect or update the central server URL.
- Support for both Windows (via PowerShell) and Linux (via Bash).

## Prerequisites

- Python 3.8+
- Required Python libraries: `requests`, `configparser`, `logging`

## Installation

1. Clone the repository:
    
    ```
    git clone <https://github.com/NerdyNot/RunAIOps.git>
    cd RunAIOps/agent/python_agent
    
    ```
    
2. Set up your virtual environment and install the required packages:
    
    ```
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\\Scripts\\activate`
    pip install requirements.txt
    
    ```
    

## Configuration

During the initial setup, the agent will prompt for the central server URL and the agent ID. These settings are saved in `agent_config.ini`.

### Example Configuration

```
[DEFAULT]
CentralServerURL = Your Central Server URL
AgentID = my_agent_id_1234

```

The configuration file will be automatically generated after the initial setup.

## Usage

1. **Start the Agent**
    
    Run the agent script:
    
    ```
    python agent.py
    
    ```
    
2. **During Execution**
    
    The agent will:
    
    - Fetch tasks from the central server.
    - Execute the fetched tasks.
    - Report the results back to the central server.
    - Handle connection issues by prompting the user to retry, change the server URL, or exit.

## Error Handling

- If the connection to the central server fails, the agent will prompt for retrying, changing the server URL, or exiting.
- During task execution, if an error occurs, the agent will log the error and continue running.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

---

# RunAIOps Python Agent

이 프로젝트는 중앙 서버와 통신하여 작업을 가져오고, 스크립트를 실행하고, 결과를 보고하는 Python 기반의 원격 에이전트입니다. 에이전트는 Windows 및 Linux 시스템을 지원하며 중앙 서버와의 연결 문제를 자동으로 처리할 수 있습니다.

## 기능

- 중앙 서버에서 작업을 가져와 에이전트 머신에서 실행합니다.
- 실행된 스크립트의 결과를 중앙 서버로 보고합니다.
- 연결이 끊어질 경우 재연결을 시도하거나 중앙 서버 URL을 업데이트할 수 있습니다.
- Windows(파워쉘) 및 Linux(Bash)를 지원합니다.

## 사전 요구 사항

- Python 3.8+
- 필요한 Python 라이브러리: `requests`, `configparser`, `logging`

## 설치

1. 리포지토리를 복제합니다:
    
    ```
    git clone <https://github.com/NerdyNot/RunAIOps.git>
    cd RunAIOps/agent/python_agent
    
    ```
    
2. 가상 환경을 설정하고 필요한 패키지를 설치합니다:
    
    ```
    python -m venv venv
    source venv/bin/activate  # Windows의 경우 `venv\\Scripts\\activate` 사용
    pip install -r requirements.txt
    
    ```
    

## 구성

초기 설정 중에 에이전트는 중앙 서버 URL과 에이전트 ID를 묻습니다. 이 설정은 `agent_config.ini`에 저장됩니다.

### 예시 구성

```
[DEFAULT]
CentralServerURL = Your Central Server URL
AgentID = my_agent_id_1234

```

설정 파일은 초기 설정 후 자동으로 생성됩니다.

## 사용법

1. **에이전트 시작**
    
    에이전트 스크립트를 실행합니다:
    
    ```
    python agent.py
    
    ```
    
2. **실행 중**
    
    에이전트는 다음 작업을 수행합니다:
    
    - 중앙 서버에서 작업을 가져옵니다.
    - 가져온 작업을 실행합니다.
    - 결과를 중앙 서버에 보고합니다.
    - 연결 문제를 처리하고, 재연결을 시도하거나 사용자에게 서버 URL 변경 또는 종료 여부를 묻습니다.

## 오류 처리

- 중앙 서버와의 연결이 실패하면 에이전트는 재연결 시도, 서버 URL 변경, 종료 여부를 묻습니다.
- 작업 실행 중 오류가 발생하면 에이전트는 오류를 기록하고 계속 실행합니다.

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 [**LICENSE**](LICENSE) 파일을 참조하십시오.

## 기여

개선 사항이나 버그 수정을 위한 이슈를 열거나 풀 리퀘스트를 제출해 주세요.
