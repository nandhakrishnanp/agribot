from flask import Flask, request, jsonify , send_file
import requests
from detect import handleModelRun

# Create a Flask application instance
app = Flask(__name__)
BASE_URL_ESP ="http://agribot.local:3001/cmd"
# Define a route for the home page ("/")

import json

def handleStateChange(data):
    """
    Send JSON data as URL-encoded form data with key 'body'.
    Returns the response JSON if successful, or None if error.
    """
    try:
        # Encode the JSON into a string and wrap it in a dict with 'body' key
        payload = {'body': json.dumps(data)}
        
        response = requests.post(BASE_URL_ESP, data=payload, timeout=5)
        response.raise_for_status()   # Raise if status is 4xx/5xx
        
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

#def handleCaptureImage():
#def runModel():

#handleProcess();




@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

# Define a route to send & receive JSON
@app.route("/get-image", methods=["GET"])
def get_image():
    # Path to your local image
    image_path = "output.jpg"   # keep your image in project folder (e.g., ./static/sample.jpg)

    try:
        return send_file(image_path, mimetype="image/jpeg")
    except FileNotFoundError:
        return {"error": "Image not found"}, 404


@app.route("/json", methods=["POST"])
def handle_json():
    # Get the JSON data from the request
    data = request.get_json()
    print(">>>> DEBUG: Got request <<<<", flush=True)
    
    # Print the received data on the server console  
    print("Received JSON:", data, flush=True)
    
    # Call handleStateChange with the same key-value format
    handleStateChange(data['cmd'])
    
    # Send a JSON response back
    return jsonify({"status": "success", "received": data})


@app.route("/detect", methods=["GET"])
def detect():
    res = handleModelRun()
    return jsonify({"respose":res})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)