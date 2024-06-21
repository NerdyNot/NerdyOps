import streamlit as st
import requests

CENTRAL_SERVER_URL = 'http://localhost:5000' 

st.title("Remote Agent Task System")

st.header("Submit a New Task")

# 타겟 에이전트 선택을 위한 API 호출
agents_response = requests.get(f"{CENTRAL_SERVER_URL}/get-agents")
if agents_response.status_code == 200:
    agents = agents_response.json()
    agent_id_list = [agent_id for agent_id in agents.keys()]
else:
    agents = {}
    agent_id_list = []

command = st.text_input("Enter your command in natural language:")
target_agent_id = st.selectbox("Select Target Agent ID:", agent_id_list)

if st.button("Submit Task"):
    if command.strip() and target_agent_id:
        payload = {
            "command": command.strip(),
            "agent_id": target_agent_id
        }

        response = requests.post(f"{CENTRAL_SERVER_URL}/submit-task", json=payload)

        if response.status_code == 200:
            response_data = response.json()
            st.success(f"Task Submitted: {response_data}")
        else:
            st.error(f"Error: {response.json().get('error', 'Unknown error')}")
    else:
        st.error("Please enter a valid command and select an agent.")

st.header("Task Status")

task_id = st.text_input("Enter the Task ID to check its status:")

if st.button("Check Status"):
    if task_id.strip():
        result = requests.get(f"{CENTRAL_SERVER_URL}/task-status/{task_id.strip()}")
        if result.status_code == 200:
            result_data = result.json()
            if "error" in result_data and result_data['error']:
                st.error(f"Error: {result_data['error']}")
            else:
                st.write(f"Task ID: {task_id}")
                st.text_area("Input", value=result_data['input'], height=100)
                st.text_area("Command", value=result_data['command'], height=100)
                st.text_area("Output", value=result_data['output'], height=200)
                st.text_area("Error", value=result_data['error'], height=100)
                interpretation = result_data.get('interpretation', '')
                if interpretation:
                    st.markdown("### Interpretation")
                    st.markdown(interpretation)  
                else:
                    st.text_area("Interpretation", value=interpretation, height=150)
        else:
            st.error(f"Error: {result.json().get('error', 'Unknown error')}")
    else:
        st.error("Please enter a Task ID.")

st.header("Agent Status")

if st.button("Get Agent Status"):
    agents_response = requests.get(f"{CENTRAL_SERVER_URL}/get-agents")

    if agents_response.status_code == 200:
        agents = agents_response.json()
        st.write("Registered Agents:")
        for agent_id, status in agents.items():
            st.write(f"Agent ID: {agent_id}, Status: {status}")
    else:
        st.error("Failed to retrieve agents.")
