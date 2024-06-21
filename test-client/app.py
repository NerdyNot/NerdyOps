import streamlit as st
import requests
import pandas as pd
import time

CENTRAL_SERVER_URL = 'http://localhost:5000'

st.title("Remote Agent Task System")

def fetch_agents():
    response = requests.get(f"{CENTRAL_SERVER_URL}/get-agents")
    if response.status_code == 200:
        return response.json()
    else:
        st.error("Failed to retrieve agents.")
        return {}

def submit_task(command, agent_id):
    payload = {
        "command": command,
        "agent_id": agent_id
    }
    response = requests.post(f"{CENTRAL_SERVER_URL}/submit-task", json=payload)
    if response.status_code == 200:
        return response.json()
    else:
        st.error(f"Error: {response.json().get('error', 'Unknown error')}")
        return None

def check_task_status(task_id):
    response = requests.get(f"{CENTRAL_SERVER_URL}/task-status/{task_id}")
    if response.status_code == 200:
        return response.json()
    else:
        st.error(f"Error: {response.json().get('error', 'Unknown error')}")
        return None

def fetch_agent_tasks(agent_id):
    response = requests.get(f"{CENTRAL_SERVER_URL}/get-agent-tasks", params={"agent_id": agent_id})
    if response.status_code == 200:
        return response.json()
    else:
        st.error(f"Failed to retrieve tasks for agent {agent_id}.")
        return []

st.header("Submit a New Task")

agents = fetch_agents()
if agents:
    agent_df = pd.DataFrame(agents).T
    st.dataframe(agent_df)

    st.write("Select an Agent and Enter a Command:")
    selected_agent_id = st.selectbox("Select Agent ID:", agent_df.index)
    command = st.text_input("Enter your command in natural language:")

    if st.button("Submit Task"):
        if command and selected_agent_id:
            task_result = submit_task(command, selected_agent_id)
            if task_result:
                st.success(f"Task Submitted: {task_result}")

st.header("Task Status")

task_id = st.text_input("Enter the Task ID to check its status:")

if st.button("Check Status"):
    if task_id:
        result = check_task_status(task_id)
        if result:
            st.write(result)

st.header("Agent Status")

if st.button("Refresh Agent Status"):
    agents = fetch_agents()
    if agents:
        agent_df = pd.DataFrame(agents).T
        st.dataframe(agent_df)

st.header("Live Agent Status")

poll_interval = 10

def poll_agents():
    while True:
        agents = fetch_agents()
        if agents:
            agent_df = pd.DataFrame(agents).T
            st.write("Updated Agent Status:")
            st.dataframe(agent_df)
        time.sleep(poll_interval)

if st.button("Start Live Update"):
    st.write("Live update started. Status will refresh every 10 seconds.")
    poll_agents()

st.header("Agent-specific Task Status")

agent_for_tasks = st.selectbox("Select Agent to View Tasks:", agent_df.index)

if st.button("Fetch Tasks for Agent"):
    if agent_for_tasks:
        tasks = fetch_agent_tasks(agent_for_tasks)
        if tasks:
            task_df = pd.DataFrame(tasks)
            st.dataframe(task_df)