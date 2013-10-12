import sys
import cv
import glob

def detect(image):
    image_size = cv.GetSize(image)

    # create grayscale version
    grayscale = cv.CreateImage(image_size, 8, 1)
    cv.CvtColor(image, grayscale, cv.CV_BGR2GRAY)

    # create storage
    storage = cv.CreateMemStorage(0)

    # equalize histogram
    cv.EqualizeHist(grayscale, grayscale)

    # show processed image
    #cv.ShowImage('Processed', grayscale)

    # detect objects
    cascade = cv.Load('/usr/local/share/OpenCV/haarcascades/haarcascade_frontalface_alt.xml')
    faces = cv.HaarDetectObjects(grayscale, cascade, storage, 1.2, 2, cv.CV_HAAR_DO_CANNY_PRUNING)

    if faces:
        for i in faces:
            cv.Rectangle(image,
                         (i[0][0], i[0][1]),
                         (i[0][0] + i[0][2], i[0][1] + i[0][3]),
                         (0, 0, 255),
                         1,
                         8,
                         0)
print 'face detection by opencv2'
src = 'images/*.jpg'
images = glob.glob(src)

for f in images:
	print f
	# create windows
	cv.NamedWindow(f, cv.CV_WINDOW_AUTOSIZE)
	#cv.NamedWindow('Processed', cv.CV_WINDOW_AUTOSIZE)
	#read image 
	frame = cv.LoadImage(f)
	# face detection
	detect(frame)
	# display image
	cv.ShowImage(f, frame)

while 1:
	# do forever
	# handle events
	k = cv.WaitKey(10)
	if k == 0x1b: # ESC
		print 'ESC pressed. Exiting ...'
		break
        
