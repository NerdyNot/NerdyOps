# endpoints/webssh.py
from flask import Blueprint, request, jsonify
from flask_sock import Sock
import paramiko
import threading
import time
import logging

webssh_bp = Blueprint('webssh', __name__)
sock = Sock(webssh_bp)

@sock.route('/webssh')
def webssh(ws):
    def send_output(channel):
        while True:
            if channel.recv_ready():
                data = channel.recv(1024)
                ws.send(data.decode('utf-8'))
            time.sleep(0.1)

    try:
        # set ssh connection
        ssh_host = request.args.get('host')
        ssh_port = int(request.args.get('port', 22))
        ssh_username = request.args.get('username')
        ssh_password = request.args.get('password')

        if not ssh_host or not ssh_username or not ssh_password:
            ws.send("Missing required parameters")
            return

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ssh_host, port=ssh_port, username=ssh_username, password=ssh_password)

        # create ssh session
        channel = client.invoke_shell()
        threading.Thread(target=send_output, args=(channel,)).start()

        while True:
            data = ws.receive()
            if data:
                channel.send(data)
            else:
                break
    except Exception as e:
        logging.error(f"SSH connection error: {e}")
    finally:
        client.close()
        ws.close()
