# Go Remote Agent

This project is a remote agent written in Go that communicates with a central server to receive and execute commands on the agent's host system. The agent supports both Linux and Windows operating systems. It registers itself with the central server, fetches tasks, executes them, and reports the results back to the server.

## Features

- **Central Server Communication**: Connects to a central server to fetch tasks and report results.
- **Cross-Platform**: Supports both Linux and Windows environments.
- **Dynamic Configuration**: Initial setup allows configuration of the central server URL and agent ID.
- **Health Check**: Verifies connection to the central server and prompts for reconnection if needed.
- **Automatic Execution**: Continuously fetches and executes tasks from the central server.

## Prerequisites

- Go 1.16+
- Network access to the central server.
- Valid central server URL and API endpoints.

## Installation

1. **Clone the Repository**
    
    ```
    git clone <https://github.com/NerdyNot/RunAIOps.git>
    cd RunAIOps/agent/go_agent
    
    ```
    
2. **Build the Agent**
    
    Ensure you have Go installed on your system. You can download it from [golang.org](https://golang.org/dl/).
    
    ```
    go build -o go_agent main.go
    
    ```
    
    This will create an executable named `go_agent`.
    

## Configuration

The agent uses a configuration file `agent_config.json` to store the central server URL and the agent ID. During the initial setup, the agent will prompt you to provide these details.

### Example Configuration

The configuration file should look like this:

```json
{
  "CentralServerURL": "<http://localhost:5001>",
  "AgentID": "YOUR_AGENT_ID"
}

```

The initial setup will guide you through creating this file.

## Usage

1. **Initial Setup**
    
    When you run the agent for the first time, it will prompt you to enter the central server URL and the agent ID. This information will be saved in `agent_config.json`.
    
    ```
    ./go_agent
    
    ```
    
    Follow the prompts to complete the setup.
    
2. **Running the Agent**
    
    After the initial setup, you can simply start the agent using:
    
    ```
    ./go_agent
    
    ```
    
    The agent will then register itself with the central server, continuously fetch tasks, execute them, and report the results.
    
3. **Reconnecting to the Central Server**
    
    If the connection to the central server is lost, the agent will prompt you to enter a new central server URL or retry the connection.
    

### Important Notices

1. **Health Check and Reconnection**
    - The agent checks the connection to the central server at startup and continuously during operation.
    - If the connection fails, you will be prompted to either retry the connection or provide a new central server URL.
2. **Script Execution**
    - The agent executes scripts provided by the central server. Ensure that scripts are carefully reviewed to prevent unintended actions.
3. **User Responsibility**
    - The use of this software is at the user's own risk.
    - The developers are not responsible for any damages or losses that may occur from the use of this software.
    - It is the user's responsibility to ensure that the commands and scripts executed by this tool are appropriate and safe for their environment.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Libraries and Dependencies

### Go Resty

[Resty](https://github.com/go-resty/resty)

- **Description**: A Go HTTP client library that is simple, fast, and easy to use.
- **License**: MIT
- **Usage**: Used for HTTP requests to communicate with the central server.

### Viper

[Viper](https://github.com/spf13/viper)

- **Description**: A complete configuration solution for Go applications.
- **License**: MIT
- **Usage**: Used for managing configuration files and environment variables.

---

# Go 원격 에이전트

이 프로젝트는 Go로 작성된 원격 에이전트로, 중앙 서버와 통신하여 에이전트의 호스트 시스템에서 명령을 받고 실행합니다. 이 에이전트는 Linux 및 Windows 운영 체제를 지원합니다. 중앙 서버에 등록되고, 작업을 받아 실행하며, 결과를 서버에 보고합니다.

## 기능

- **중앙 서버 통신**: 중앙 서버에 연결하여 작업을 받고 결과를 보고합니다.
- **크로스 플랫폼**: Linux 및 Windows 환경을 지원합니다.
- **동적 구성**: 초기 설정에서 중앙 서버 URL 및 에이전트 ID를 구성할 수 있습니다.
- **상태 확인**: 중앙 서버와의 연결을 확인하고 필요시 재연결을 시도합니다.
- **자동 실행**: 중앙 서버에서 작업을 계속 받아서 실행합니다.

## 사전 요구 사항

- Go 1.16+
- 중앙 서버에 대한 네트워크 접근
- 유효한 중앙 서버 URL 및 API 엔드포인트

## 설치

1. **리포지토리 클론**
    
    ```
    git clone <https://github.com/NerdyNot/RunAIOps.git>
    cd RunAIOps/agent/go_agent
    
    ```
    
2. **에이전트 빌드**
    
    시스템에 Go가 설치되어 있는지 확인합니다. [golang.org](https://golang.org/dl/)에서 다운로드할 수 있습니다.
    
    ```
    go build -o go_agent main.go
    
    ```
    
    이렇게 하면 `go_agent`라는 실행 파일이 생성됩니다.
    

## 구성

에이전트는 `agent_config.json` 구성 파일을 사용하여 중앙 서버 URL과 에이전트 ID를 저장합니다. 초기 설정 중에 에이전트가 이 정보를 제공하도록 요청합니다.

### 구성 예시

구성 파일은 다음과 같은 구조여야 합니다:

```json
{
  "CentralServerURL": "YOUR_CENTRAL_SERVER_URL",
  "AgentID": "YOUR_AGENT_ID"
}

```

초기 설정이 이 파일을 만드는 과정을 안내합니다.

## 사용법

1. **초기 설정**
    
    에이전트를 처음 실행할 때 중앙 서버 URL과 에이전트 ID를 입력하라는 프롬프트가 표시됩니다. 이 정보는 `agent_config.json`에 저장됩니다.
    
    ```
    ./go_agent
    
    ```
    
    프롬프트에 따라 설정을 완료합니다.
    
2. **에이전트 실행**
    
    초기 설정 후에는 간단히 다음 명령어로 에이전트를 시작할 수 있습니다:
    
    ```
    ./go_agent
    
    ```
    
    에이전트는 중앙 서버에 등록되고, 지속적으로 작업을 받아 실행하며, 결과를 보고합니다.
    
3. **중앙 서버에 재연결**
    
    중앙 서버와의 연결이 끊어지면, 에이전트는 새로운 중앙 서버 URL을 입력하거나 연결을 재시도하라는 프롬프트를 표시합니다.
    

### 중요한 공지 사항

1. **상태 확인 및 재연결**
    - 에이전트는 시작 시와 작동 중에 중앙 서버와의 연결을 확인합니다.
    - 연결이 실패하면 새로운 중앙 서버 URL을 입력하거나 연결을 재시도하도록 프롬프트가 표시됩니다.
2. **스크립트 실행**
    - 에이전트는 중앙 서버에서 제공하는 스크립트를 실행합니다. 스크립트를 주의 깊게 검토하여 의도하지 않은 작업이 실행되지 않도록 하세요.
3. **사용자 책임**
    - 이 소프트웨어의 사용은 사용자의 책임입니다.
    - 이 소프트웨어 사용으로 인한 어떠한 손해나 손실에 대해 개발자는 책임지지 않습니다.
    - 이 도구로 실행되는 명령과 스크립트가 적절하고 안전한지 확인하는 것은 사용자의 책임입니다.

## 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하십시오.

## 기여

개선 사항이나 버그 수정을 위한 이슈를 열거나 풀 리퀘스트를 제출해 주세요.

## 라이브러리 및 의존성

### Go Resty

[Resty](https://github.com/go-resty/resty)

- **설명**: 간단하고 빠르고 사용하기 쉬운 Go HTTP 클라이언트 라이브러리.
- **라이센스**: MIT
- **사용 용도**: 중앙 서버와 통신하기 위한 HTTP 요청에 사용됩니다.

### Viper

[Viper](https://github.com/spf13/viper)

- **설명**: Go 애플리케이션을 위한 완전한 구성 솔루션.
- **라이센스**: MIT
- **사용 용도**: 구성 파일 및 환경 변수를 관리하는 데 사용됩니다.