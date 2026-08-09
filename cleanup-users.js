import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const MONGODB_URI = "mongodb+srv://kirtanagrawal169_db_user:Kirtan%40svnit25-29@scopeguard-cluster.eou5ord.mongodb.net/?appName=scopeguard-cluster";

async function clearUsers() {
  try {
    console.log("Connecting to MongoDB Atlas for user cleanup...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const result = await mongoose.connection.collection("users").deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} user accounts from MongoDB Atlas.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
}

clearUsers();
