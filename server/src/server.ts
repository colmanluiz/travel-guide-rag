import { OpenAIEmbeddings } from "@langchain/openai";
import express, { Express } from "express";
import mongoose from "mongoose";
import placesData from "./data/places.json";
import dotenv from "dotenv";
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const mongoURI: string =
  "mongodb+srv://colmanluiz:s465YDziTHZYpUmI@travel-guide-rag.2vlemlp.mongodb.net/?retryWrites=true&w=majority&appName=travel-guide-rag";

// connecting to mongodb
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB."))
  .catch((err) => console.log("Failed to connect to MongoDB, error: ", err));

const placeSchema = new mongoose.Schema({
  name: String,
  description: String,
  location: { lat: Number, lng: Number },
  keywords: [String],
  embedding: [Number],
});
const Place = mongoose.model("Place", placeSchema);

// create embeddings instance
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY,
});

// creating a post endpoint to receive a place data and embed him.
app.post("/ingest", async (req, res) => {
  try {
    const results: {
      ingested: string[];
      skipped: string[];
    } = {
      ingested: [],
      skipped: [],
    };

    for (const place of placesData) {
      // generate embeddings for each place description
      const embeddedDocument = await embeddings.embedQuery(place.description);

      // check if place already exist
      const existingPlace = await Place.findOne({
        name: place.name,
        "location.lat": place.location.lat,
        "location.lng": place.location.lng,
      });

      if (existingPlace) {
        console.log(
          `Skipping ${place.name} because already exists in the Database.`
        );
        results.skipped.push(place.name);
      } else {
        // save to MongoDB
        await Place.create({
          ...place,
          embedding: embeddedDocument,
        });
        results.ingested.push(place.name);
      }
    }

    res.json({
      message: "Processing complete",
      ingested: results.ingested.length,
      skipped: results.skipped.length,
      details: results,
    });
  } catch (err) {
    res.status(500);
    res.json({ message: "There was an error" });
    console.log(err);
  }
});

app.get("/search", async (req, res) => {
  try {
    const { query, lat, lng } = req.body;
  } catch (err) {
    res.status(500);
    res.json({ message: "There was an error" });
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
