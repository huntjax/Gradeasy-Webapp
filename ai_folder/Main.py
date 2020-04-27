import cv2
import sys
import os
import json
import time
import shutil
# import newSimpleHTR.src.main as ai
import cropped
#import char_detect

# ai.main()

# path = str(sys.argv[1])
#get file and a location to store pictures
# path = 'scanner_pictures/1_HunterPace_1.png'
path1='../Gradeasy-Webapp/ai_folder/'
path = 'scanner_pictures/1_HunterPace_1.png'

try:
    os.mkdir("../Gradeasy-Webapp/ai_folder/preprocessed_pictures")
except OSError as error:
    #shutil.rmtree("preprocessed_pictures")
    #os.mkdir("preprocessed_pictures")
    print(error)
    #continue

try:
    os.mkdir("../Gradeasy-Webapp/ai_folder/cropped")
except OSError as error:
    #shutil.rmtree("cropped")
    #os.mkdir("cropped")
    print(error)
    #continue

#split file and place imgaes in the new folder

img = cv2.imread(path1+path)
i=0
for r in range(50,img.shape[0],100):
    for c in range(75, 700, 625):
        cv2.imwrite(path1+f"preprocessed_pictures/img_{i}.png",img[r:r+100,c:c+450,:])
        i=i+1

# Crops the images in preprocessed_pictures
proc_dict = path1+"preprocessed_pictures"
crop_dict = path1+"cropped"
for filename in os.listdir(proc_dict):
    #print(filename)
    if filename.endswith(".png"):
        try:
            cropped.box_extraction(proc_dict, filename, crop_dict)
        except:
            #print("error")
            continue
for filename in os.listdir(crop_dict):
    #print(filename)
    if filename.endswith(".png"):
        # try:
        cropped.crop_word(crop_dict + '/' + filename)
        # except:
        #     print("Error Cropping Word")

#print("AI Starting")
#put each new file into HTR
for i in range(10):
    testImg = path1+"cropped/img_%s.png" %(i)
    print(testImg)
    if (os.path.isfile(testImg)):
        # shutil.move(testImg, "SimpleHTR/data/test.png")
        shutil.copy(testImg, path1+"newSimpleHTR/data/test.png")
        os.system('python3 ../Gradeasy-Webapp/ai_folder/newSimpleHTR/src/main.py --wordbeamsearch')


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
try:
    shutil.rmtree(path1+"preprocessed_pictures")
except OSError as error:
    print("Error: %s :%s" % ("/preprocessed_pictures", error.strerror))

try:
    shutil.rmtree(path1+"cropped")
except OSError as error:
    print("Error: %s :%s" % ("/cropped", error.strerror))

