__author__ = 'mamad'

import redis
import threading

from pymongo import MongoClient
from pymongo import database
from bson.objectid import ObjectId
import gridfs
import time
import sys
import json
import numpy as np
import cv
import cv2

PEACH_CHANNEL_FACE_DETECT = 'peach-detect-face-jobs'
PEACH_CHANNEL_JOB_DONE = 'peach-jobs-done'
KILL_CMD = 'KILL'


class FaceDetector():
    def __init__(self, haar_cascades_file='/usr/local/share/OpenCV/haarcascades/haarcascade_frontalface_alt.xml'):
        self.cascade = cv.Load(haar_cascades_file)

    def detect_faces(self, image):
        try:
            image_size = cv.GetSize(image)
            gray_scale = cv.CreateImage(image_size, 8, 1)
            cv.CvtColor(image, gray_scale, cv.CV_BGR2GRAY)
            cv.EqualizeHist(gray_scale, gray_scale)
            storage = cv.CreateMemStorage(0)
            faces = cv.HaarDetectObjects(gray_scale, self.cascade, storage, 1.2, 2, cv.CV_HAAR_DO_CANNY_PRUNING)
            if faces:
                return faces
        except cv2.error as e:
            #print cv2.error
            print "OpenCV error({0}): {1}".format(e.errno, e.strerror)
            raise
        return None


class MongoImageManager():
    def __init__(self, mongo_client, db, collection='fs'):
        """
        Create new manager
        @param mongo_client: Mongo client
        @param db: name of MongoDB database
        @param collection: name of gridfs collection
        """
        self.client = mongo_client
        self.db = database.Database(mongo_client, db)
        self.gfs = gridfs.GridFS(self.db, collection)
        self.files_collection = self.db[collection + '.files']

    def get_gfs_file(self, gfs_file_id):
        """
        Read a gridfs file
        @param gfs_file_id: file id
        @return: GridOut instance
        """
        id1 = ObjectId(gfs_file_id)
        return self.gfs.get(id1)

    def update_metadata(self, gfs_file_id, metadata):
        id1 = ObjectId(gfs_file_id)
        lookup = self.files_collection.find_one({'_id': id1})
        existing_metadata = {}
        if lookup and lookup["metadata"] is not None:
            existing_metadata = lookup["metadata"]
        for k, v in metadata.items():
            existing_metadata[k] = v
        self.files_collection.update({'_id': id1}, {"$set": {"metadata": existing_metadata}}, upsert=False)
        pass


class FaceEngine():
    def __init__(self, mongo_image_manager, detector):
        """
        Create new face engine
        @param mongo_image_manager: mongo grid manager to read/writer images
        @param detector: open cv face detector, to detect faces
        """
        self.image_manager = mongo_image_manager
        self.face_detector = detector
        self.running = True

    def stop(self):
        self.running = False

    def handle(self, job):
        try:
            image_id = job["imageId"]
            image = self.image_manager.get_gfs_file(image_id)
            cv_img = self.to_opencv(image)
            faces = self.face_detector.detect_faces(cv_img)
            face_rects = []
            if faces:
                for f in faces:
                    face_rects.append({'x1': f[0][0], 'y1': f[0][1], 'x2': f[0][0] + f[0][2], 'y2': f[0][1] + f[0][3]})

            update_json = {"faces": faces, "processedTime": int(time.clock() * 1000)}
            self.image_manager.update_metadata(image_id, update_json)
            return True
        except:
            e = sys.exc_info()[0]
            print('failed to handle job', job, 'error:', e)
            return False

    @staticmethod
    def to_opencv(gfs_file):
        """
        Convert the gridfs file object to OpenCV image (Mat structure)
        @param gfs_file: input gridfs file
        @return: OpenCV image
        """
        img_array = np.asarray(bytearray(gfs_file.read()), dtype=np.uint8)
        img_data_ndarray = cv2.imdecode(img_array, cv2.CV_LOAD_IMAGE_COLOR)
        return cv.fromarray(img_data_ndarray)


    def start(self):
        print 'FaceEngine started.'
        while self.running:
            time.sleep(10)

        pass


class RedisChannelListener(threading.Thread):
    def __init__(self, redis_client, engine_manager, channels):
        threading.Thread.__init__(self)
        self.redis = redis_client
        self.engine = engine_manager
        self.pub_sub = self.redis.pubsub()
        self.pub_sub.subscribe(channels)
        print 'subscribed to channels:', channels

    def run(self):
        for item in self.pub_sub.listen():
            if item['data'] == KILL_CMD:
                self.pub_sub.unsubscribe()
                self.engine.stop()
                print self, 'killed'
                break
            elif item['type'] == 'message':
                job = json.loads(item['data'])
                if self.engine.handle(job):
                    response = {"imageId": job["imageId"], "userId": job["userId"], "submitDate": job["submitDate"]}
                    print response
                    jr = json.dumps(response)
                    print jr
                    self.redis.publish(PEACH_CHANNEL_JOB_DONE, jr)


def start_engine(mongo_db='peach-dev'):
    mongo_client = MongoClient()
    grid_manager = MongoImageManager(mongo_client, mongo_db)
    face_detector = FaceDetector()

    engine = FaceEngine(grid_manager, face_detector)
    redis_client = redis.Redis()
    listener = RedisChannelListener(redis_client, engine, [PEACH_CHANNEL_FACE_DETECT])
    listener.start()
    engine.start()


def stop_engine():
    redis_client = redis.Redis()
    #todo: send kill command to channel


if __name__ == "__main__":
    start_engine()