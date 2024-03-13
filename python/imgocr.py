import pytesseract
from pytesseract import Output
from PIL import Image
import cv2

img_path1 = './ocr3.jpeg'
# img = cv2.imread(img_path1)
# img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# img = cv2.resize(img, (560, 900))
# img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 41, 5)
# cv2.imshow("Res", img)
# cv2.waitKey(0)
# cv2.destroyAllWindows()

text = pytesseract.image_to_string(img_path1, lang='eng')
print(text)
