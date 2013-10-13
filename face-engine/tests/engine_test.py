__author__ = 'mamad'
import unittest
from pymongo import MongoClient
from main.engine import *
import cv


class BaseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = MongoClient()
        cls.db_name = 'face-test'
        db = database.Database(cls.client, cls.db_name)
        cls.gfs = gridfs.GridFS(db, 'fs')
        f = open('./images/uwa-f2f.jpg', mode='rb')
        cls.image_id = cls.gfs.put(f, metadata={'test': 'yes', 'userId': 'test-user-id'})

    @classmethod
    def tearDownClass(cls):
        if cls.image_id and cls.gfs:
            cls.gfs.delete(cls.image_id)


class TestMongoImageManager(BaseTestCase):
    def setUp(self):
        self.image_manager = MongoImageManager(self.client, self.db_name)

    def test_read(self):
        image = self.image_manager.get_gfs_file(self.image_id)
        self.assertIsNotNone(image)
        print image.metadata

    def test_write(self):
        image = self.image_manager.get_gfs_file(self.image_id)
        self.assertIsNotNone(image)
        update_json = {"test": "test-string"}
        self.image_manager.update_metadata(self.image_id, update_json)
        image = self.image_manager.get_gfs_file(self.image_id)
        self.assertIsNotNone(image)
        self.assertIsNotNone(image.metadata)
        print image.metadata
        self.assertIsNotNone(image.metadata["test"])
        self.assertIsNotNone(image.metadata["userId"])
        self.assertEqual(image.metadata["test"], "test-string")


class TestFaceDetector(BaseTestCase):
    def setUp(self):
        self.face_detector = FaceDetector()

    def test_detect_faces(self):
        f = './images/uwa-f2f.jpg'
        image = cv.LoadImage(f)
        faces = self.face_detector.detect_faces(image)
        self.assertIsNotNone(faces)
        print(faces)

    def test_detect_faces_in_mongo_file(self):
        gfs_file = self.gfs.get(self.image_id)
        image = FaceEngine.to_opencv(gfs_file)
        faces = self.face_detector.detect_faces(image)
        self.assertIsNotNone(faces)



class TestFaceEngine(BaseTestCase):
    def setUp(self):
        self.mongo_image_manager = MongoImageManager(self.client, self.db_name)
        face_detector = FaceDetector()
        self.face_engine = FaceEngine(self.mongo_image_manager, face_detector)

    def test_handle(self):
        job = {"imageId": self.image_id}
        handled = self.face_engine.handle(job)
        self.assertTrue(handled)
        image = self.mongo_image_manager.get_gfs_file(self.image_id)
        self.assertIsNotNone(image)
        metadata = image.metadata
        print metadata
        self.assertIsNotNone(metadata)
        self.assertIsNotNone(metadata["faces"])


if __name__ == '__main__':
    unittest.main()