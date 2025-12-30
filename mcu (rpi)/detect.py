from ultralytics import YOLO
import cv2
import numpy as np
import math
# 1. Load model
model = YOLO("best.pt")  # make sure best.pt is in your working dir


def getCords(centers, image_size=640, grid_size=8):
    """
    Maps pixel coordinates of centers to an 8x8 grid.

    Args:
        centers (list): A list of center coordinates, where each center is a 
                        list or tuple [x, y].
        image_size (int): The width and height of the square image in pixels.
        grid_size (int): The number of rows and columns in the grid.

    Returns:
        list: A list of grid coordinates, where each coordinate is a 
              list [i, j].
    """
    cords = []
    
    # Calculate the size of each grid cell.
    cell_size = image_size / grid_size  # Example: 640 / 8 = 80
    
    # Iterate through each center coordinate.
    for center in centers:
        x, y = center
        
        # Calculate the grid cell index using integer division.
        # The floor division `//` automatically handles this.
        # Add a small epsilon to avoid floating-point issues on boundaries
        # like `640.0`.
        i = int(math.floor(x / cell_size))
        j = int(math.floor(y / cell_size))
        
        # Ensure the coordinates stay within the valid grid range [0, 7].
        # For an 8x8 grid, the valid indices are 0 to 7.
        i = max(0, min(grid_size - 1, i))
        j = max(0, min(grid_size - 1, j))

        cords.append([i, j])
        
    return cords



def capture_image(cam_index=0):
    """
    Captures a single image from webcam and returns it.
    """
    cap = cv2.VideoCapture(cam_index)
    if not cap.isOpened():
        print("? Camera not accessible")
        return None

    ret, frame = cap.read()
    new_width = 530
    new_height = 530
    resized_frame = cv2.resize(frame, (new_width, new_height))

    cap.release()

    if not ret:
        print("? Failed to capture image")
        return None
    
    return resized_frame

# 2. Run inference on image
def runModel(frame):
    centers = []
    results = model(frame)
    for r in results:
        im0 = r.orig_img.copy()  # Original image

        if r.masks is not None:
            for mask, box in zip(r.masks.xy, r.boxes):
                points = np.int32([mask])

                # Semi-transparent light blue overlay
                overlay = im0.copy()
                cv2.fillPoly(overlay, [points], (255, 200, 0))  # light blue fill
                im0 = cv2.addWeighted(overlay, 0.1, im0, 0.9, 0)

                # Border (polyline)
                cv2.polylines(im0, [points], isClosed=True, color=(255, 0, 0), thickness=2)

                # ---- centroid of polygon (mask) ----
                M = cv2.moments(points)
                if M["m00"] != 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])
                    centers.append((cx, cy))
                    # draw center
                    #cv2.circle(im0, (cx, cy), 5, (0, 255, 0), -1)
    
        cv2.imwrite("output.jpg", im0)
    cords = getCords(centers);   
    return cords

def handleModelRun():
    frame =capture_image()
    res = runModel(frame)
    print(res)
    return res

