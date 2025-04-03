import express, { Express } from "express";
import mongoose from "mongoose";

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const mongoURI: string =
  "mongodb+srv://colmanluiz:s465YDziTHZYpUmI@travel-guide-rag.2vlemlp.mongodb.net/?retryWrites=true&w=majority&appName=travel-guide-rag";

mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB."))
  .catch((err) => console.log("Failed to connect to MongoDB, error: ", err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
