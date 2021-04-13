import mongoose from "mongoose";

let initDatabase = () => {
  let connection = mongoose.connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return connection;
};

export { initDatabase };
