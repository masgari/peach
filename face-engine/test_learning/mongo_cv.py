__author__ = 'mamad'
import cv
import cv2
from pymongo import MongoClient
from pymongo import database
from bson.objectid import ObjectId
import gridfs
import numpy as np

client = MongoClient()
db = database.Database(client, 'peach-dev')
gfs = gridfs.GridFS(db, 'fs')

id1 = ObjectId('524b77b43bbf498614000001')
img1 = gfs.get(id1)
print img1.metadata
print img1.filename
print img1.upload_date

img_array = np.asarray(bytearray(img1.read()), dtype=np.uint8)
img_data_ndarray = cv2.imdecode(img_array, 0)
frame = cv.fromarray(img_data_ndarray)
cv.ShowImage('mongo image ', frame)
while 1:
	# do forever
	# handle events
	k = cv.WaitKey(10)
	if k == 0x1b: # ESC
		print 'ESC pressed. Exiting ...'
		break
