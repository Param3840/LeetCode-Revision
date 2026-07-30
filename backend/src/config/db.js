const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB Connected");
    console.log("Database:", conn.connection.name);
  } catch (error) {
    console.error("❌ Full Error:");
    console.error(error); // <-- Important
    process.exit(1);
  }
};

module.exports = connectDB;
