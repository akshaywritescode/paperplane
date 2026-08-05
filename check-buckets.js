const { Client, Storage } = require("node-appwrite");

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function run() {
  try {
    const buckets = await storage.listBuckets();
    console.log(JSON.stringify(buckets.buckets, null, 2));
  } catch (error) {
    console.error(error);
  }
}

run();
