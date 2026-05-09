import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'courtcast';

if (!uri) {
  throw new Error(
    'Missing MongoDB connection string. Add MONGODB_URI (or MONGO_URI / DATABASE_URL) to your environment variables.'
  );
}

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // Reuse the connection across hot-reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const c = await clientPromise;
  return c.db(dbName);
}

export default clientPromise;
