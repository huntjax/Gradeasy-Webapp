import numpy as np
import cv2


fnIn = '../data/test.png'
fnOut = '../data/out.png'

# read
img = cv2.imread(fnIn, cv2.IMREAD_GRAYSCALE)

# increase contrast
pxmin = np.min(img)
pxmax = np.max(img)
imgContrast = (img - pxmin) / (pxmax - pxmin) * 255

# increase line width
kernel = np.ones((3, 3), np.uint8)
imgMorph = cv2.erode(imgContrast, kernel, iterations = 1)

# write
cv2.imwrite(fnOut, imgMorph)