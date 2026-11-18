# AI Knowledge Inbox

A lightweight AI-powered knowledge management application that allows users to save notes and web pages, search their saved knowledge semantically, and ask questions using Retrieval-Augmented Generation (RAG).

## Features

- **Save notes:** Add text-based notes to your personal knowledge library.
- **Save web pages:** Submit a URL and extract readable webpage content.
- **Knowledge library:** View, edit, and delete saved notes and web pages.
- **Semantic search:** Retrieve relevant content based on meaning rather than exact keyword matches.
- **AI-powered Q&A:** Ask questions about saved content and receive context-aware answers.
- **Source citations:** View supporting source snippets alongside generated answers.

## Tech Stack

| Layer          | Technologies                              |
| -------------- | ----------------------------------------- |
| Frontend       | React 19, Vite                            |
| Backend        | Node.js, Express 5                        |
| AI / LLM       | Google Gemini API                         |
| Embeddings     | Gemini Embedding (`gemini-embedding-001`) |
| Database       | SQLite (`better-sqlite3`)                 |
| Web extraction | Cheerio                                   |
| Development    | Nodemon                                   |

## Project Structure

```text
turium-ai-knowledge-inbox/
├── client/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── server/
│   ├── controllers/
│   │   ├── itemController.js
│   │   └── queryController.js
│   ├── database/
│   │   └── db.js
│   ├── routes/
│   │   └── itemRoutes.js
│   ├── services/
│   │   ├── answerService.js
│   │   ├── chunkingService.js
│   │   ├── embeddingService.js
│   │   ├── indexingService.js
│   │   ├── searchService.js
│   │   └── urlService.js
│   ├── .gitignore
│   └── server.js
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Google Gemini API key

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd turium-ai-knowledge-inbox
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5001
```

Start the backend:

```bash
npm run dev
```

The backend will run at:

`http://localhost:5001`

### 3. Set up the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and communicates with the backend at `http://localhost:5001`.

## API Documentation

### Save a text note

**POST** `/ingest`

Request:

```json
{
  "title": "Example Note",
  "content": "This is an example knowledge note."
}
```

### Save a webpage

**POST** `/ingest/url`

Request:

```json
{
  "url": "https://example.com"
}![alt text](image.png)
```

The backend extracts webpage content, saves it, and generates embeddings for semantic retrieval.

### Retrieve saved items

**GET** `/items`

Returns the saved notes and webpages.

### Ask a question

**POST** `/query`

Request:

```json
{
  "question": "What information is available about my saved topic?"
}
```

```json
{
  "success": true,
  "question": "What information is available?",
  "answer": "The answer based on your saved content. [1]",
  "sources": [
    {
      "citation": 1,
      "itemId": 1,
      "title": "Example Note",
      "sourceType": "note",
      "sourceUrl": null,
      "snippet": "Relevant content from the saved note.",
      "similarity": 0.85
    }
  ]
}
```

The response includes the generated answer and supporting source information.

### Update a saved item

**PUT** `/items/:id`

Request:

```json
{
  "title": "Updated Note",
  "content": "Updated note content."
}
```

The item's searchable chunks and embeddings are rebuilt.

### Delete a saved item

**DELETE** `/items/:id`

Deletes the saved item and its associated chunks.

## How RAG Works

The application uses Retrieval-Augmented Generation to answer questions using the user's saved knowledge.

1. **Content ingestion:** Notes and webpage content are stored in SQLite with source metadata.
2. **Text chunking:** Content is divided into chunks of approximately 1,000 characters, with a 150-character overlap to preserve context between adjacent chunks.
3. **Embedding generation:** Gemini generates 768-dimensional embeddings using `gemini-embedding-001`.
4. **Vector storage:** Embeddings are serialized and stored alongside their corresponding text chunks in SQLite.
5. **Semantic retrieval:** The user's question is converted into an embedding. Cosine similarity is calculated against stored chunk embeddings, and the five highest-scoring chunks are retrieved.
6. **Relevance filtering:** Retrieved chunks with a similarity score below 0.60 are excluded.
7. **Answer generation:** Relevant chunks and the user's question are passed to Gemini, which generates an answer using the provided context and numbered source citations.

The application instructs the AI to use only the retrieved sources and avoid inventing unsupported information.

## Database Design

The application uses two SQLite tables:

- **items:** Stores saved notes and webpages, including title, content, source type, URL, and creation timestamp.
- **chunks:** Stores individual text chunks and their associated embeddings. Each chunk references its original item.

Foreign key cascading ensures that deleting an item also deletes its associated chunks.

## Design Decisions

- **SQLite:** Chosen for lightweight local persistence and straightforward setup without requiring a separate database server.
- **Chunking with overlap:** Helps preserve context when information spans multiple chunks.
- **Gemini embeddings:** Provides semantic representations for both saved content and user questions.
- **Cosine similarity:** Enables similarity-based retrieval without requiring a separate vector database for this prototype.
- **Separation of concerns:** Routes, controllers, database operations, and AI services are organized into separate modules.

## Limitations and Future Improvements

- Replace the current cosine similarity search, which loads stored embeddings from SQLite and compares them in JavaScript, with a dedicated vector search solution as the knowledge base grows.
- Add authentication and user-specific knowledge libraries.
- Introduce background indexing for larger documents and URLs.
- Improve URL ingestion security and resilience for production environments.
- Add automated tests and structured application logging.
- Introduce pagination and filtering for larger knowledge libraries.

## Running Locally

Run the frontend and backend in separate terminals. Configure the Gemini API key in `server/.env` before starting the backend.

**Note:** Never commit API keys, `.env` files, or generated database files to GitHub.