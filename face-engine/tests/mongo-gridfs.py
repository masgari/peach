__author__ = 'mamad'

from pymongo import MongoClient
from pymongo import database
from bson.objectid import ObjectId
import gridfs

client = MongoClient()
db = database.Database(client, 'peach-dev')
gfs = gridfs.GridFS(db, 'fs')

id1 = ObjectId('524b77b43bbf498614000001')
img1 = gfs.get(id1)
print img1.metadata
print img1.filename
print img1.upload_date

