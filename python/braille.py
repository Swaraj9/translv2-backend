import cv2
from ultralytics import YOLO
import sys

def integer_to_6bit_binary(integer):
    # Convert integer to binary string and pad zeros to make it 6 bits long
    binary_str = bin(integer)[2:].zfill(6)
    return binary_str

def map_binary_to_letter(binary):
    letter_mapping = {
        '100000': 'a',
        '110000': 'b',
        '100100': 'c',
        '100110': 'd',
        '100010': 'e',
        '110100': 'f',
        '110110': 'g',
        '110010': 'h',
        '010100': 'i',
        '010110': 'j',
        '101000': 'k',
        '111000': 'l',
        '101100': 'm',
        '101110': 'n',
        '101010': 'o',
        '111100': 'p',
        '111110': 'q',
        '111010': 'r',
        '011100': 's',
        '011110': 't',
        '101001': 'u',
        '111001': 'v',
        '010111': 'w',
        '101101': 'x',
        '101111': 'y',
        '101011': 'z'
    }
    return letter_mapping.get(binary, None)


model = YOLO(sys.argv[1]) 

img = cv2.imread(sys.argv[2])

results = model(img)
outx = 0
for result in results:
    boxes = result.boxes
    for box in boxes:
        binary = integer_to_6bit_binary(int(box.cls.item()))
        letter = map_binary_to_letter(binary)
        x1, y1, x2, y2 = box.xyxy[0]
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        print(f"Label: {box.cls}, Confidence: {box.conf.item():.2f}, Bounding Box: ({x1}, {y1}) ({x2}, {y2})")
        cropped_image = img[y1:y2, x1:x2]
        cv2.imwrite(sys.argv[3]+str(outx)+'.jpg',cropped_image)
        outx += 1
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img, letter, (x1-1, y1-4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

cv2.imwrite(sys.argv[3]+'output.jpg',img)