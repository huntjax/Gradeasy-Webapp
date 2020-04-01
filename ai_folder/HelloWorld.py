import sys
import os
import json
import time
import cv2
import shutil


path = str(sys.argv[1])
#get file and a location to store pictures
#path = 'ai_folder/scanner_pictures/1_HunterPace_1.png'
try:
    os.mkdir("ai_folder/preprocessed_pictures")
except OSError as error:
    print(error)

#split file and place imgaes in the new folder

img = cv2.imread(path)
i=0
for r in range(50,img.shape[0],100):
    for c in range(75, 700, 625):
        cv2.imwrite(f"ai_folder/preprocessed_pictures/img_{i}.png",img[r:r+100,c:c+450,:])
        i=i+1

#put each new file into HTR
for i in range(10):
    testImg = "ai_folder/preprocessed_pictures/img_%s.png" %(i)
    if(os.path.isfile(testImg)):
        #shutil.move(testImg, "SimpleHTR/data/test.png")
        shutil.copy(testImg, "ai_folder/SimpleHTR/data/test.png")
        os.system('python3 ai_folder/SimpleHTR/src/main.py --wordbeamsearch')
#Need to get picture
#pass into AI
#AI print what it reads

#fake result for testing
#grade = ['a','a','a','Wrong','Wrong','test','test','test','test','test']
#for i in grade:
#    print(i)
""" try:
    shutil.rmtree("ai_folder/preprocessed_pictures")
except OSError as error:
    print("Error: %s :%s" % ("ai_folder/preprocessed_pictures", error.strerror)) """
sys.stdout.flush
