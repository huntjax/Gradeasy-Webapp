import cv2
import sys
import os
import json
import time
import shutil
# import newSimpleHTR.src.main as ai
import cropped

# ai.main()

# path = str(sys.argv[1])
#get file and a location to store pictures
# path = 'ai_folder/scanner_pictures/1_HunterPace_1.png'
path = os.getcwd() + '/scanner_pictures/1_HunterPace_1.png'
if not os.path.exists("/preprocessed_pictures"):
    try:
        os.mkdir("/preprocessed_pictures")
    except OSError as error:
        print(error)
else:
    print("Path already exists")

#split file and place imgaes in the new folder

img = cv2.imread(path)
i=0
for r in range(50,img.shape[0],100):
    for c in range(75, 700, 625):
        cv2.imwrite(f"/preprocessed_pictures/img_{i}.png",img[r:r+100,c:c+450,:])
        i=i+1

# Crops the images in preprocessed_pictures
proc_dict = os.getcwd() + "/preprocessed_pictures"
crop_dict = os.getcwd() + "/cropped"
for filename in os.listdir(proc_dict):
    print(filename)
    if filename.endswith(".png"):
        try:
            cropped.box_extraction(proc_dict, filename, crop_dict)
        except:
            print("error")

print("AI Starting")
#put each new file into HTR
for i in range(10):
    testImg = os.getcwd() + "/cropped/img_%s.png" %(i)
    print(testImg)
    if (os.path.isfile(testImg)):
        # shutil.move(testImg, "SimpleHTR/data/test.png")
        shutil.copy(testImg, os.getcwd() + "/newSimpleHTR/data/test.png")
        os.system('python3 ./newSimpleHTR/src/main.py --wordbeamsearch')


# for filename in os.listdir(os.getcwd() + "/preprocessed_pictures"):
#     if filename.endswith(".png"):
#         ai.main(proc_dict+filename)


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
# sys.stdout.flush
