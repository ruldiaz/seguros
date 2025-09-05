const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully 🚀");
  } catch (error) {
    console.error("DB connection failed ❌", error);
    throw error;
  }
};

module.exports = { connectDB }; 
