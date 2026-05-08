import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'courtcast';

if (!uri) {
  throw new Error('Missing MONGODB_URI in environment. Copy .env.local.example to .env.local and fill it in.');
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
