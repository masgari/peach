__author__ = 'mamad'

from pymongo import MongoClient
from pymongo import database
import gridfs


client = MongoClient()
db = database.Database(client, 'face-test')
gfs = gridfs.GridFS(db, 'fs')

f = open('../tests/images/uwa-f2f.jpg', mode='rb')
image_id = gfs.put(f, metadata={'test': 'test'})
print image_id
img1 = gfs.get(image_id)
print img1.metadata
print img1.filename
print img1.upload_date

