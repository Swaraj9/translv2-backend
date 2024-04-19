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
res_list = []
results = model(img)
outx = 0
done_list = []
for result in results:
    boxes = result.boxes
    for box in boxes:
        flag=0
        binary = integer_to_6bit_binary(int(box.cls.item()))
        letter = map_binary_to_letter(binary)
        x1, y1, x2, y2 = box.xyxy[0]
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        for done in done_list:
            if done[0]==x1 and done[1]==y1 and done[2]==x2 and done[3]==y2:
                flag=1
                break
        if flag==1:
            continue
        done_list.append([x1, y1, x2, y2])
        print(f"Label: {box.cls}, Confidence: {box.conf.item():.2f}, Bounding Box: ({x1}, {y1}) ({x2}, {y2})")
        cropped_image = img[y1:y2, x1:x2]
        cv2.imwrite(sys.argv[3]+str(outx)+'.jpg',cropped_image)
        res_list.append(sys.argv[3]+str(outx)+'.jpg')
        outx += 1
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        # cv2.putText(img, letter, (x1-1, y1-4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)




from PIL import Image
import torch
import torchvision.transforms as transforms
from torch import nn

class BrailleClassifier(nn.Module):
    def __init__(self, num_classes=26):
        super(BrailleClassifier, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        self.classifier = nn.Sequential(
            nn.Linear(128 * 8 * 8, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x

# Define a function for image inference using the best saved model
def predict_image_class(image_path, model_path=sys.argv[4]):
    # Load the model
    model = BrailleClassifier(num_classes=26).to('cpu')
    model.load_state_dict(torch.load(model_path,map_location=torch.device('cpu')))
    model.eval()

    # Load and preprocess the image
    image = Image.open(image_path).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((64, 64)),
        transforms.ToTensor()
    ])
    input_tensor = transform(image)
    input_batch = input_tensor.unsqueeze(0).to('cpu')

    # Perform inference
    with torch.no_grad():
        output = model(input_batch)
        _, predicted = torch.max(output, 1)
    
    # Map predicted class index back to character (assuming labels are 0-25 corresponding to 'a'-'z')
    predicted_char = chr(predicted.item() + ord('a'))

    return predicted_char

print(done_list)
pred_chars = []
# Example usage:
for r in res_list:
    image_path = r
    predicted_character = predict_image_class(image_path)
    pred_chars.append(predicted_character)
    print(f"Predicted character: {predicted_character}")
    
i=0
for item in done_list:
    x1, y1, x2, y2 = item[0], item[1], item[2], item[3]
    print(x1, y1, x2, y2)
    cv2.putText(img, pred_chars[i], (x1-1, y1-4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
    i += 1

cv2.imwrite(sys.argv[3]+'output.jpg',img)
