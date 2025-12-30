from flask import Flask, request, jsonify, send_file
import requests
import json
import threading
import time
from detect import handleModelRun

# Create a Flask application instance
app = Flask(__name__)
BASE_URL_ESP = "http://agribot.local:3001"

# Global control for background loop
auto_loop_thread = None
auto_loop_running = False

def handleStateChange(data):
    """
    Send JSON data as URL-encoded form data with key 'body'.
    Returns the response JSON if successful, or None if error.
    """
    try:
        payload = {'body': json.dumps(data)}
        response = requests.post(BASE_URL_ESP+'/cmd', data=payload, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print("? Request timed out.")
    except requests.exceptions.ConnectionError:
        print("? Failed to connect to the server.")
    except requests.exceptions.HTTPError as e:
        print(f"? HTTP error: {e}")
    except ValueError:
        print("? Response is not valid JSON.")
    except Exception as e:
        print(f"? Unexpected error: {e}")
    return None


def auto_loop():
    """Background loop that runs every 5 seconds until stopped."""
    global auto_loop_running
    while auto_loop_running:
        state = {'0': 'reverse'}
        print(">>> Auto loop: Sending state", state, flush=True)
        handleStateChange(state)

        result = handleModelRun()
        print(">>> Auto loop: Model result =", result, flush=True)
        if len(result)>0:
            i=result[0][0]
            j=result[0][1]
            state1 = {'3': i}
            handleStateChange(state1)
            state2 ={'4':j}
            handleStateChange(state2)
            time.sleep(2)
            state3 ={'5':1}
            handleStateChange(state3)
        time.sleep(5)


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@app.route("/get-image", methods=["GET"])
def get_image():
    image_path = "output.jpg"
    try:
        return send_file(image_path, mimetype="image/jpeg")
    except FileNotFoundError:
        return {"error": "Image not found"}, 404


@app.route("/json", methods=["POST"])
def handle_json():
    global auto_loop_thread, auto_loop_running

    data = request.get_json()
    print(">>>> DEBUG: Got request <<<<", flush=True)
    print("Received JSON:", data, flush=True)

    # Check for cmd pattern like { '0': 'auto' }
    cmd = data.get("cmd")

    if cmd == {'0': 'auto'}:
        if not auto_loop_running:
            auto_loop_running = True
            auto_loop_thread = threading.Thread(target=auto_loop, daemon=True)
            auto_loop_thread.start()
            print(">>> Auto loop started", flush=True)

    elif cmd == {'0': 'stop'}:
        auto_loop_running = False
        handleStateChange(cmd)

        print(">>> Auto loop stopped", flush=True)

    else:
        handleStateChange(cmd)

    return jsonify({"status": "success", "received": data})


@app.route("/detect", methods=["GET"])
def detect():
    res = handleModelRun()
    return jsonify({"response": res})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
