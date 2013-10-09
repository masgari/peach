__author__ = 'mamad'

import redis
import threading

from pymongo import MongoClient
from pymongo import database
from bson.objectid import ObjectId
import gridfs
import time

PEACH_CHANNEL_FACE_DETECT = 'peach-detect-face-jobs'
PEACH_CHANNEL_JOB_DONE = 'peach-jobs-done'
KILL_CMD = 'KILL'

class MongoImageManager():
    def __init__(self, client, dbName, gfsCollectionName):
        self.client = client
        self.db = database.Database(client, dbName)
        self.gfs = gridfs.GridFS(self.db, gfsCollectionName)


class FaceEngine():
    def __init__(self, manager):
        self.manager = manager
        self.running = True

    def stop(self):
        self.running = False

    def handle(self, item):
        print item['channel'], ":", item['data']
        return True

    def start(self):
        print 'FaceEngine started.'
        while self.running:
            time.sleep(10)

        pass

class RedisChannelListener(threading.Thread):
    def __init__(self, redis, engine, channels):
        threading.Thread.__init__(self)
        self.redis = redis
        self.engine = engine
        self.pubsub = self.redis.pubsub()
        self.pubsub.subscribe(channels)
        print 'subscribed to channels:', channels

    def run(self):
        for item in self.pubsub.listen():
            if item['data'] == KILL_CMD:
                self.pubsub.unsubscribe()
                self.engine.stop()
                print self, 'killed'
                break
            elif item['type'] == 'message':
                if self.engine.handle(item):
                    self.redis.publish(PEACH_CHANNEL_JOB_DONE, item)


if __name__ == "__main__":
    client = MongoClient()
    manager = MongoImageManager(client, 'peach-dev', 'fs')

    engine = FaceEngine(manager)
    redis = redis.Redis()
    listener = RedisChannelListener(redis, engine, [PEACH_CHANNEL_FACE_DETECT])
    listener.start()
    engine.start()