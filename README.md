# RAG-Powered Travel Guide API 🌍🧠

A Retrieval-Augmented Generation (RAG) system for intelligent travel recommendations using:

- 🗺️ Geospatial search with MongoDB Atlas
- 🤖 OpenAI embeddings & GPT-4o
- 🔍 Vector similarity search

## Features

- **AI-Powered Recommendations**: Combines LLM understanding with structured venue data
- **Geospatial Filtering**: Finds relevant places within specific geographic bounds
- **Duplicate Prevention**: Smart checks during data ingestion
- **Response Transparency**: Returns sources with every recommendation

## Prerequisites

- Node.js v18+
- MongoDB Atlas cluster with vector search enabled
- OpenAI API key
- Place data in `data/places.json`

## Tech Stack

![Tech Stack](https://skillicons.dev/icons?i=nodejs,ts,mongodb,openai)

## Setup

1. Clone repo:

```bash
git clone git@github.com:colmanluiz/travel-guide-rag.git
cd travel-guide-rag
```

2. Install dependencies:

```bash
yarn install
```

3. Create `.env` file:

```env
MONGO_URI="your_mongodb_atlas_uri"
OPENAI_API_KEY="your_openai_key"
PORT=3001
```

4. Start server:

```bash
yarn dev
```

## Data Preparation

1. Create `data/places.json` with format:

```json
[
  {
    "name": "Museu do Amanhã",
    "description": "Science museum in Rio...",
    "location": {
      "lat": -22.8948,
      "lng": -43.1801
    },
    "keywords": ["museum", "family-friendly"]
  }
]
```

2. Load data:

```bash
curl -X POST http://localhost:3001/ingest
```

## API Reference

### POST `/ingest`

Load places data with embeddings generation

### GET `/search`

**Parameters** (JSON body):

```json
{
  "query": "quiet vegan café",
  "lat": -23.55,
  "lng": -46.63
}
```

## Example Usage

```bash
# Search request
curl -X GET "http://localhost:3001/search" \
-H "Content-Type: application/json" \
-d '{
  "query": "Find museums with interactive exhibits",
  "lat": -22.8948,
  "lng": -43.1801
}'
```

**Sample Response:**

```json
{
  "answer": "Based on your query, I recommend Museu do Amanhã...",
  "sources": [
    {
      "name": "Museu do Amanhã",
      "description": "Science museum in Rio...",
      "location": {
        "lat": -22.8948,
        "lng": -43.1801
      }
    }
  ]
}
```

## Design Decisions

| Component  | Choice                 | Rationale                                     |
| ---------- | ---------------------- | --------------------------------------------- |
| Vector DB  | MongoDB Atlas          | Native geospatial + vector search integration |
| Embeddings | text-embedding-3-small | Optimal accuracy/cost balance                 |
| LLM        | GPT-4o                 | Best multimodal understanding                 |
| Framework  | Express                | Lightweight & flexible                        |
