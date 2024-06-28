# NerdyOps Backend

This project serves as the central server component of a remote agent task system. It allows users to input natural language commands for remote agents. These commands are converted into executable scripts using LangChain tools, queued, and dispatched to the agents. Agents execute these scripts and report the results back to the server, where the results are interpreted into natural language. Users can check the status and details of each task using the task ID.

## Features

- **Agent Management**: Register and manage remote agents (supports Linux, Windows, macOS).
- **Task Submission**: Convert natural language commands into scripts (Bash or PowerShell) and queue them for remote execution.
- **Result Interpretation**: Interpret and summarize the results of executed scripts into natural language.
- **Health Check**: Provides a health check endpoint for verifying server connectivity.

## Project Description

- **Natural Language Commands**: Users provide commands in natural language which are processed by the LangChain tool to generate corresponding scripts suitable for execution on the agents.
- **Task Queue**: The generated scripts are added to a task queue specific to each agent. Agents fetch these tasks, execute them, and return the results to the server.
- **Result Processing**: The server receives the execution results, interprets them using LangChain tools, and makes the interpreted results available to users.
- **Task Monitoring**: Users can track the status and details of tasks using their unique task IDs.

## Prerequisites

- Python 3.8+
- Flask
- Redis
- SQLite3
- LangChain
- OpenAI

## Installation

1. Clone the repository.
    
    ```
    git clone <https://github.com/NerdyNot/NerdyOps.git>
    cd NerdyOps/central_server
    
    ```
    
2. Create and activate a virtual environment.
    
    ```
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\\\\Scripts\\\\activate`
    
    ```
    
3. Install the required packages.
    
    ```
    pip install -r requirements.txt
    
    ```
    

## Configuration

- **Redis Configuration**: Located in `utils/config.py`.
    
    ```python
    REDIS_HOST = 'localhost'
    REDIS_PORT = 6379
    REDIS_DB = 0
    
    ```
    
- **Database Initialization**: The database is automatically initialized on the first request.

## Running the Server

1. Start the Flask server.
    
    ```
    python app.py
    
    ```
    
2. The server will run on `http://0.0.0.0:5001`.

## Usage

### Submitting a Task

Users submit a natural language command along with an agent ID to the server. The server converts this command into a script suitable for the agent's operating system (Linux, Windows, or macOS) using LangChain tools. The script is then added to the agent's task queue.

### Fetching and Executing Tasks

Agents fetch their respective tasks from the queue, execute the scripts, and report the results back to the server.

### Interpreting Results

The server processes and interprets the results returned by the agents. These interpreted results are then available for users to view.

### Monitoring Tasks

Users can check the status and details of each task using its unique task ID.

## API Endpoints

- **Health Check**: `GET /health`
    - Returns the health status of the server.
- **Submit Task**: `POST /tasks/submit-task`
    - Accepts a natural language command and an agent ID. Converts the command into a script and queues it for the agent.
    - Example payload:
        
        ```json
        {
          "command": "Show me the disk usage",
          "agent_id": "agent_123"
        }
        
        ```
        
- **Register Agent**: `POST /register-agent`
    - Registers a new agent with the server.
    - Example payload:
        
        ```json
        {
          "agent_id": "agent_123",
          "os_type": "linux",
          "computer_name": "server1",
          "private_ip": "192.168.1.10",
          "shell_version": "bash 5.0"
        }
        
        ```
        
- **Update Agent Status**: `POST /agent-status`
    - Updates the status of a registered agent.
    - Example payload:
        
        ```json
        {
          "agent_id": "agent_123",
          "status": "busy"
        }
        
        ```
        
- **Get Agents**: `GET /get-agents`
    - Retrieves the list of all registered agents.
- **Get Task**: `GET /tasks/get-task`
    - Fetches a task for a specific agent. The agent uses this to get its next task.
    - Example query:
        
        ```
        /tasks/get-task?agent_id=agent_123
        
        ```
        
- **Report Result**: `POST /tasks/report-result`
    - Reports the result of a task execution from an agent.
    - Example payload:
        
        ```json
        {
          "task_id": "task_456",
          "input": "Show me the disk usage",
          "command": "df -h",
          "output": "/dev/sda1  50G  20G  30G  40% /",
          "error": ""
        }
        
        ```
        
- **Task Status**: `GET /tasks/task-status/<task_id>`
    - Retrieves the status and details of a specific task.
    - Example URL:
        
        ```
        /tasks/task-status/task_456
        
        ```
        
- **Get Agent Tasks**: `GET /tasks/get-agent-tasks`
    - Retrieves all tasks for a specific agent.
    - Example query:
        
        ```
        /tasks/get-agent-tasks?agent_id=agent_123
        
        ```
        

## Project Structure

- [**app.py**](http://app.py/): Main server application file. Handles API endpoints and request processing.
- [**utils/config.py**](http://config.py/): Configuration settings for Redis.
- [**utils/db.py**](http://db.py/): SQLite database initialization and connection functions.
- **utils/langchain_integration.py**: Functions to convert commands into scripts and interpret task results using LangChain tools.
- **utils/redis_connection.py**: Helper to get a Redis connection.
- **endpoints/auth.py**: Authentication related endpoints.
- **endpoints/tasks.py**: Task management related endpoints.

## Logging

- The server logs key events and errors to the console. This helps in monitoring the server's activity and debugging issues.

## Libraries and Licenses

### Flask

[Flask](https://flask.palletsprojects.com/)

- **Description**: Flask is a lightweight WSGI web application framework in Python. It's designed to make getting started quick and easy, with the ability to scale up to complex applications.
- **License**: BSD-3-Clause
- **Usage**: Used to create and manage the API endpoints of the central server.

### Redis

[Redis](https://redis.io/)

- **Description**: Redis is an in-memory data structure store used as a database, cache, and message broker. It supports various data structures and provides high performance.
- **License**: BSD-3-Clause
- **Usage**: Used for task queuing and result storage.

### SQLite

[SQLite](https://sqlite.org/)

- **Description**: SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine.
- **License**: Public Domain
- **Usage**: Used to store agent information and manage task status.

### LangChain

[LangChain](https://github.com/hwchase17/langchain)

- **Description**: LangChain is a framework for developing applications powered by language models. It enables chaining together a sequence of LLM calls in a flexible and composable manner.
- **License**: MIT
- **Usage**: Used to convert natural language commands into scripts and interpret execution results.

### Requests

[Requests](https://requests.readthedocs.io/)

- **Description**: Requests is a simple, yet elegant, HTTP library. It allows you to send HTTP requests easily and is a core component in web scraping and API interactions.
- **License**: Apache License 2.0
- **Usage**: Used to send HTTP requests to agents and receive responses.

## License

This project is licensed under the MIT License. See the [LICENSE](notion://www.notion.so/LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

---

# NerdyOps Backend

이 프로젝트는 원격 에이전트 작업 시스템의 중앙 서버 구성 요소입니다. 사용자는 원격 에이전트를 위한 자연어 명령을 입력할 수 있습니다. 이러한 명령은 LangChain 도구를 사용하여 실행 가능한 스크립트로 변환되고, 큐에 추가되어 에이전트로 전달됩니다. 에이전트는 이러한 스크립트를 실행하고 결과를 서버에 보고하며, 서버는 이 결과를 자연어로 해석합니다. 사용자는 작업 ID를 사용하여 각 작업의 상태와 세부 정보를 확인할 수 있습니다.

## 기능

- **에이전트 관리**: 원격 에이전트 등록 및 관리 (Linux, Windows, macOS 지원).
- **작업 제출**: 자연어 명령을 스크립트(Bash 또는 PowerShell)로 변환하고 원격 실행

을 위해 큐에 추가합니다.

- **결과 해석**: 실행된 스크립트의 결과를 자연어로 해석하고 요약합니다.
- **상태 확인**: 서버 연결 상태를 확인하는 엔드포인트 제공.

## 프로젝트 설명

- **자연어 명령**: 사용자는 자연어로 명령을 제공하며, LangChain 도구를 통해 에이전트가 실행할 수 있는 해당 스크립트를 생성합니다.
- **작업 큐**: 생성된 스크립트는 각 에이전트에 특정된 작업 큐에 추가됩니다. 에이전트는 이러한 작업을 가져와 실행하고 결과를 서버로 반환합니다.
- **결과 처리**: 서버는 실행 결과를 수신하고 LangChain 도구를 사용하여 이를 해석하며, 해석된 결과를 사용자에게 제공합니다.
- **작업 모니터링**: 사용자는 고유한 작업 ID를 사용하여 작업의 상태와 세부 정보를 추적할 수 있습니다.

## 사전 요구 사항

- Python 3.8+
- Flask
- Redis
- SQLite3
- LangChain
- OpenAI

## 설치

1. 리포지토리를 복제합니다.
    
    ```
    git clone <https://github.com/NerdyNot/NerdyOps.git>
    cd NerdyOps/central_server
    
    ```
    
2. 가상 환경을 만들고 활성화합니다.
    
    ```
    python -m venv venv
    source venv/bin/activate  # Windows의 경우 `venv\\\\Scripts\\\\activate` 사용
    
    ```
    
3. 필요한 패키지를 설치합니다.
    
    ```
    pip install -r requirements.txt
    
    ```
    

## 구성

- **Redis 구성**: `utils/config.py`에 위치합니다.
    
    ```python
    REDIS_HOST = 'localhost'
    REDIS_PORT = 6379
    REDIS_DB = 0
    
    ```
    
- **데이터베이스 초기화**: 데이터베이스는 첫 요청 시 자동으로 초기화됩니다.

## 서버 실행

1. Flask 서버를 시작합니다.
    
    ```
    python app.py
    
    ```
    
2. 서버는 `http://0.0.0.0:5001`에서 실행됩니다.

## 사용법

### 작업 제출

사용자는 자연어 명령과 에이전트 ID를 서버에 제출합니다. 서버는 LangChain 도구를 사용하여 이 명령을 에이전트의 운영 체제(Linux, Windows 또는 macOS)에 적합한 스크립트로 변환합니다. 그런 다음 스크립트는 에이전트의 작업 큐에 추가됩니다.

### 작업 가져오기 및 실행

에이전트는 자신의 작업 큐에서 작업을 가져와 스크립트를 실행하고 결과를 서버에 보고합니다.

### 결과 해석

서버는 에이전트가 반환한 결과를 처리하고 해석합니다. 그런 다음 사용자가 결과를 볼 수 있도록 해석된 결과를 제공합니다.

### 작업 모니터링

사용자는 고유한 작업 ID를 사용하여 각 작업의 상태와 세부 정보를 확인할 수 있습니다.

## API 엔드포인트

- **상태 확인**: `GET /health`
    - 서버의 상태를 반환합니다.
- **작업 제출**: `POST /tasks/submit-task`
    - 자연어 명령과 에이전트 ID를 받아들여 명령을 스크립트로 변환하고 에이전트에게 큐에 추가합니다.
    - 예시 요청 본문:
        
        ```json
        {
          "command": "디스크 사용량을 보여줘",
          "agent_id": "agent_123"
        }
        
        ```
        
- **에이전트 등록**: `POST /register-agent`
    - 서버에 새로운 에이전트를 등록합니다.
    - 예시 요청 본문:
        
        ```json
        {
          "agent_id": "agent_123",
          "os_type": "linux",
          "computer_name": "server1",
          "private_ip": "192.168.1.10",
          "shell_version": "bash 5.0"
        }
        
        ```
        
- **에이전트 상태 업데이트**: `POST /agent-status`
    - 등록된 에이전트의 상태를 업데이트합니다.
    - 예시 요청 본문:
        
        ```json
        {
          "agent_id": "agent_123",
          "status": "busy"
        }
        
        ```
        
- **에이전트 목록 조회**: `GET /get-agents`
    - 모든 등록된 에이전트의 목록을 가져옵니다.
- **작업 가져오기**: `GET /tasks/get-task`
    - 특정 에이전트의 작업을 가져옵니다. 에이전트는 이를 사용하여 다음 작업을 가져옵니다.
    - 예시 쿼리:
        
        ```
        /tasks/get-task?agent_id=agent_123
        
        ```
        
- **결과 보고**: `POST /tasks/report-result`
    - 에이전트가 작업 실행 결과를 서버에 보고합니다.
    - 예시 요청 본문:
        
        ```json
        {
          "task_id": "task_456",
          "input": "디스크 사용량을 보여줘",
          "command": "df -h",
          "output": "/dev/sda1  50G  20G  30G  40% /",
          "error": ""
        }
        
        ```
        
- **작업 상태 조회**: `GET /tasks/task-status/<task_id>`
    - 특정 작업의 상태와 세부 정보를 가져옵니다.
    - 예시 URL:
        
        ```
        /tasks/task-status/task_456
        
        ```
        
- **에이전트 작업 조회**: `GET /tasks/get-agent-tasks`
    - 특정 에이전트의 모든 작업을 가져옵니다.
    - 예시 쿼리:
        
        ```
        /tasks/get-agent-tasks?agent_id=agent_123
        
        ```
        

## 프로젝트 구조

- [**app.py**](http://app.py/): 메인 서버 애플리케이션 파일. API 엔드포인트와 요청 처리를 담당합니다.
- [**utils/config.py**](http://config.py/): Redis 구성 설정.
- [**utils/db.py**](http://db.py/): SQLite 데이터베이스 초기화 및 연결 함수.
- **utils/langchain_integration.py**: LangChain 도구를 사용하여 명령을 스크립트로 변환하고 작업 결과를 해석하는 함수.
- **utils/redis_connection.py**: Redis 연결을 얻기 위한 도우미.
- **endpoints/auth.py**: 인증 관련 엔드포인트.
- **endpoints/tasks.py**: 작업 관리 관련 엔드포인트.

## 로깅

- 서버는 주요 이벤트와 오류를 콘솔에 기록합니다. 이를 통해 서버 활동을 모니터링하고 문제를 디버깅하는 데 도움이 됩니다.

## 사용된 라이브러리 및 라이센스

### Flask

[Flask](https://flask.palletsprojects.com/)

- **설명**: Flask는 Python의 가벼운 WSGI 웹 애플리케이션 프레임워크입니다. 빠르고 쉽게 시작할 수 있도록 설계되었으며, 복잡한 애플리케이션으로 확장할 수 있는 능력을 제공합니다.
- **라이센스**: BSD-3-Clause
- **사용 용도**: 중앙 서버의 API 엔드포인트를 생성하고 관리하는 데 사용됩니다.

### Redis

[Redis](https://redis.io/)

- **설명**: Redis는 인메모리 데이터 구조 저장소로, 데이터베이스, 캐시 및 메시지 브로커로 사용됩니다. 다양한 데이터 구조를 지원하며 높은 성능을 제공합니다.
- **라이센스**: BSD-3-Clause
- **사용 용도**: 작업 큐잉 및 결과 저장에 사용됩니다.

### SQLite

[SQLite](https://sqlite.org/)

- **설명**: SQLite는 작은, 빠른, 자체 포함, 고신뢰성, 전체 기능을 갖춘 SQL 데이터베이스 엔진을 구현하는 C 언어 라이브러리입니다.
- **라이센스**: Public Domain
- **사용 용도**: 에이전트 정보를 저장하고 작업 상태를 관리하는 데 사용됩니다.

### LangChain

[LangChain](https://github.com/hwchase17/langchain)

- **설명**: LangChain은 언어 모델을 기반으로 애플리케이션을 개발하기 위한 프레임워크입니다. 유연하고 조합 가능한 방식으로 일련의 LLM 호출을 체인으로 연결할 수 있습니다.
- **라이센스**: MIT
- **사용 용도**: 자연어 명령을 스크립트로 변환하고 실행 결과를 해석하는 데 사용됩니다.

### Requests

[Requests](https://requests.readthedocs.io/)

- **설명**: Requests는 간단하지만 우아한 HTTP 라이브러리입니다. 쉽게 HTTP 요청을 보낼 수 있으며 웹 스크래핑 및 API 상호작용의 핵심 구성 요소입니다.
- **라이센스**: Apache License 2.0
- **사용 용도**: 에이전트에 HTTP 요청을 보내고 응답을 받는 데 사용됩니다.

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세

한 내용은 [LICENSE](notion://www.notion.so/LICENSE) 파일을 참조하십시오.

## 기여

개선 사항이나 버그 수정을 위한 이슈를 열거나 풀 리퀘스트를 제출해 주세요.