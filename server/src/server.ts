import { OpenAIEmbeddings } from "@langchain/openai";
import express, { Express } from "express";
import mongoose from "mongoose";
import placesData from "./data/places.json";
import dotenv from "dotenv";
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const mongoURI: string = `${process.env.MONGO_URI}`;

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
    if (req.body) {
      const { query, lat, lng } = req.body;

      // 1- transformar query em embedding
      const embeddedQuery = await embeddings.embedQuery(query);
      console.log(embeddedQuery);

      // 2- retornar embeddings que tem a ver com a minha query usando vectorSearch, além disso estou filtrando a vectorSearch para retornar resultados atraves da localização geoespacial do mongodb. o nome desse processo todo é chamado de aggregation pipeline.
      const similiarPlacesEmbedds = await Place.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: embeddedQuery,
            numCandidates: 100,
            limit: 5,
            filter: {
              "location.lat": { $gte: lat - 0.045, $lte: lat + 0.045 },
              "location.lng": { $gte: lng - 0.045, $lte: lng + 0.045 },
            },
          },
        },
        {
          $project: {
            name: 1,
            description: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]);

      console.log(similiarPlacesEmbedds);
      res.json({
        message: "Processing complete",
        results: similiarPlacesEmbedds,
      });

      // 3- retornar os resultados
    } else {
    }
  } catch (err) {
    res.status(500);
    res.json({ message: "There was an error" });
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
