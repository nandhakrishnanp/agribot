import cv2
import numpy as np

cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 530)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 530)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Some MJPG frames come as BGR1 (or grayscale), try converting manually
    if len(frame.shape) == 2:  # grayscale
        frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)

    cv2.imshow("Color Feed", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
