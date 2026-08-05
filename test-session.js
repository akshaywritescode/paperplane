const { Client, Account } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID); // fixed this!

const account = new Account(client);

async function run() {
    try {
        const session = await account.createEmailPasswordSession('akshay@example.com', 'password123'); // use your actual credentials or we can check fields
        console.log("Session fields:", Object.keys(session));
        console.log("Session:", session);
    } catch (e) {
        console.error("Error creating session:", e.type, e.message);
    }
}
run();
