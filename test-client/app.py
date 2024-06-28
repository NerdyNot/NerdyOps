import streamlit as st
import requests
import pandas as pd
import time

# Title of the app
st.title("NerdyOps Test Client")

# Input for Central Server URL
central_server_url = st.text_input("Enter Central Server URL:", "http://localhost:5001")

def fetch_agents(url):
    """
    Fetch the list of agents from the central server.
    Args:
        url (str): The central server URL.
    Returns:
        list: List of agents or an empty list if the request fails.
    """
    response = requests.get(f"{url}/get-agents")
    if response.status_code == 200:
        return response.json()
    else:
        st.error("Failed to retrieve agents.")
        return []

def submit_task(command, agent_id, url):
    """
    Submit a new task to the central server for a specific agent.
    Args:
        command (str): The command in natural language.
        agent_id (str): The ID of the target agent.
        url (str): The central server URL.
    Returns:
        dict: Response from the server or None if the request fails.
    """
    payload = {
        "command": command,
        "agent_id": agent_id
    }
    response = requests.post(f"{url}/submit-task", json=payload)
    if response.status_code == 200:
        return response.json()
    else:
        st.error(f"Error: {response.json().get('error', 'Unknown error')}")
        return None

def check_task_status(task_id, url):
    """
    Check the status of a specific task.
    Args:
        task_id (str): The ID of the task to check.
        url (str): The central server URL.
    Returns:
        dict: Status of the task or None if the request fails.
    """
    response = requests.get(f"{url}/task-status/{task_id}")
    if response.status_code == 200:
        return response.json()
    else:
        st.error(f"Error: {response.json().get('error', 'Unknown error')}")
        return None

def fetch_agent_tasks(agent_id, url):
    """
    Fetch the list of tasks for a specific agent.
    Args:
        agent_id (str): The ID of the agent.
        url (str): The central server URL.
    Returns:
        list: List of tasks or an empty list if the request fails.
    """
    response = requests.get(f"{url}/get-agent-tasks", params={"agent_id": agent_id})
    if response.status_code == 200:
        return response.json()
    else:
        st.error(f"Failed to retrieve tasks for agent {agent_id}.")
        return []

st.header("Submit a New Task")

# Fetch and display agents if URL is provided
if central_server_url:
    agents = fetch_agents(central_server_url)
    if agents:
        # Convert the list of agents to a DataFrame
        agent_df = pd.DataFrame(agents)
        st.dataframe(agent_df)

        st.write("Select an Agent and Enter a Command:")
        selected_agent_id = st.selectbox("Select Agent ID:", agent_df['agent_id'])
        command = st.text_input("Enter your command in natural language:")

        if st.button("Submit Task"):
            if command and selected_agent_id:
                task_result = submit_task(command, selected_agent_id, central_server_url)
                if task_result:
                    st.success(f"Task Submitted: {task_result}")

st.header("Task Status")

task_id = st.text_input("Enter the Task ID to check its status:")

if st.button("Check Status"):
    if task_id and central_server_url:
        result = check_task_status(task_id, central_server_url)
        if result:
            st.write(result)

st.header("Agent Status")

if st.button("Refresh Agent Status"):
    if central_server_url:
        agents = fetch_agents(central_server_url)
        if agents:
            agent_df = pd.DataFrame(agents)
            st.dataframe(agent_df)

st.header("Live Agent Status")

poll_interval = 10

def poll_agents(url):
    """
    Continuously fetch and display agent status every poll_interval seconds.
    Args:
        url (str): The central server URL.
    """
    while True:
        agents = fetch_agents(url)
        if agents:
            agent_df = pd.DataFrame(agents)
            st.write("Updated Agent Status:")
            st.dataframe(agent_df)
        time.sleep(poll_interval)

if st.button("Start Live Update"):
    st.write("Live update started. Status will refresh every 10 seconds.")
    if central_server_url:
        poll_agents(central_server_url)

st.header("Agent-specific Task Status")

# Check if central_server_url is provided
if central_server_url:
    agent_for_tasks = st.selectbox("Select Agent to View Tasks:", agent_df['agent_id'])

    if st.button("Fetch Tasks for Agent"):
        if agent_for_tasks:
            tasks = fetch_agent_tasks(agent_for_tasks, central_server_url)
            if tasks:
                task_df = pd.DataFrame(tasks)
                st.dataframe(task_df)
