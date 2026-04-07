#!/usr/bin/env python3
"""Helper to send commands to Blender via the MCP socket."""
import socket
import json
import sys
import time

def send_to_blender(code, timeout=10):
    """Send Python code to Blender and return the result."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    s.connect(('localhost', 9876))

    cmd = json.dumps({'type': 'execute_code', 'params': {'code': code}})
    s.sendall(cmd.encode() + b'\n')

    time.sleep(0.5)
    data = b''
    while True:
        try:
            chunk = s.recv(8192)
            if not chunk:
                break
            data += chunk
            # Check if we got a complete JSON response
            try:
                json.loads(data.decode())
                break
            except:
                continue
        except socket.timeout:
            break

    s.close()

    if data:
        result = json.loads(data.decode())
        return result
    return None

if __name__ == '__main__':
    if len(sys.argv) > 1:
        code = ' '.join(sys.argv[1:])
    else:
        code = sys.stdin.read()

    result = send_to_blender(code)
    print(json.dumps(result, indent=2))
