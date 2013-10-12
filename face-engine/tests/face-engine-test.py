__author__ = 'mamad'

import time

import redis

from main.engine import PEACH_CHANNEL_FACE_DETECT


if __name__ == '__main__':
    r = redis.Redis()
    r.publish(PEACH_CHANNEL_FACE_DETECT, 'new-image-id')
    time.sleep(3)
    r.publish(PEACH_CHANNEL_FACE_DETECT, 'image-id2')
    time.sleep(4)
    r.publish(PEACH_CHANNEL_FACE_DETECT, 'KILL')

