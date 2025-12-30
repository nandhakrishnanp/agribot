import cv2
from ultralytics import YOLO

model = YOLO("best.pt")

def runmodel(frame, model_obj):
    detections = []
    results = model_obj(frame)

    if len(results) > 0 and len(results[0].boxes) > 0:
        for box in results[0].boxes:
            class_id = int(box.cls[0].item())
            class_name = model_obj.names[class_id]
            confidence = box.conf[0].item()
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            area = (x2 - x1) * (y2 - y1)

            # Draw
            color = (0, 255, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{class_name} {confidence:.2f}", (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            detections.append({
                "class": class_name,
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2],
                "area": area
            })

        cv2.imwrite("output.jpg", frame)
    
    return detections

# Main loop
cap = cv2.VideoCapture(0)
ret, frame = cap.read()
if ret:
    results_array = runmodel(frame, model)
    print(results_array)
cap.release()
