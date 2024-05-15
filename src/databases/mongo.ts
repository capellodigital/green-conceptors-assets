import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { GridFSBucket } from 'mongodb';
import { logger } from '@/utils/logger';
import { DB_NAME, IMAGE_BUCKET_NAME, MONGODB_URI } from '@config';

const client = new MongoClient(MONGODB_URI);

const connect = async () => {
  try {
    await mongoose.connect(MONGODB_URI!);
    logger('success', '✓')('Connected to MongoDB');
  } catch (error) {
    logger('error', '✗')('Error connecting  MongoDB: ' + error);
  }
};

const database = client.db(DB_NAME);
const buckets = {
  images: new GridFSBucket(database, { bucketName: IMAGE_BUCKET_NAME }),
};
export { connect, database, buckets };
