# AI Knowledge Inbox

A lightweight AI-powered knowledge management application that lets users save personal notes and web pages, search their knowledge semantically, and ask questions using Retrieval-Augmented Generation (RAG

🚀 **[Live Application – Try it here](https://turium-ai-knowledge-inbox.vercel.app/)**

💻 **[GitHub Repository](https://github.com/Keerthivallabhaneni2k3/turium-ai-knowledge-inbox)**

## Features

- **Save notes:** Add text-based notes to a personal knowledge library.
- **Save web pages:** Submit URLs and extract readable webpage content.
- **Manage knowledge:** View, edit, and delete saved notes and web pages.
- **Semantic search:** Retrieve relevant information based on meaning rather than exact keyword matches.
- **AI-powered Q&A:** Ask questions about saved content and receive context-aware answers.
- **Source citations:** View supporting source snippets alongside generated answers.
- **Persistent storage:** Store knowledge items, text chunks, and embeddings in SQLite.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8 |
| Backend | Node.js, Express 5 |
| AI / LLM | Google Gemini API |
| Embedding model | `gemini-embedding-001` |
| Answer generation | `gemini-3.5-flash-lite` |
| Database | SQLite, `better-sqlite3` |
| Web extraction | Cheerio |
| Development | Nodemon | Oxlint

## Project Structure

```text
turium-ai-knowledge-inbox/
├── client/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── hero.png
│   │   ├── components/
│   │   │   ├── ChatPanel.jsx
│   │   │   ├── EditModal.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── LibraryStats.jsx
│   │   │   ├── Notification.jsx
│   │   │   ├── SaveKnowledge.jsx
│   │   │   └── SavedKnowledge.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── database/
│   │   └── db.js
│   ├── routes/
│   ├── services/
│   ├── utils/
│   │   └── logger.js
│   ├── indexExistingItems.js
│   ├── testSearch.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- A Google Gemini API key

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

The backend runs at:

`http://localhost:5001`

### 3. Set up the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
npm run dev
```

The frontend runs at:

`http://localhost:5173`

The frontend communicates with the backend at `http://localhost:5001` by default.

## API Documentation

All endpoints are served by the Express backend.

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
}
```

The backend fetches the webpage, extracts its readable content, stores the item, and generates searchable chunks and embeddings.

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

Example response:

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

The response contains the generated answer and supporting source information.

### Update a saved item

**PUT** `/items/:id`

Request:

```json
{
  "title": "Updated Note",
  "content": "Updated note content."
}
```

The item is updated and its searchable chunks and embeddings are regenerated.

### Delete a saved item

**DELETE** `/items/:id`

Deletes the selected item and its associated chunks.

## How RAG Works

The application uses Retrieval-Augmented Generation (RAG) to answer questions using the user's saved knowledge.

1. **Content ingestion:** Notes and extracted webpage content are stored in SQLite along with their source metadata.
2. **Text chunking:** Content is divided into manageable chunks of approximately 1,000 characters, with an overlap of approximately 150 characters to preserve context between adjacent chunks.
3. **Embedding generation:** Gemini's `gemini-embedding-001` model generates 768-dimensional embeddings for each chunk.
4. **Vector storage:** Embeddings are serialized and stored in SQLite alongside their corresponding text chunks.
5. **Query embedding:** When a user asks a question, the same embedding model converts the question into a vector.
6. **Semantic retrieval:** Cosine similarity is calculated between the question embedding and stored chunk embeddings. The five highest-scoring chunks are considered.
7. **Relevance filtering:** Chunks with a similarity score below 0.60 are excluded from the retrieved context.
8. **Answer generation:** The remaining relevant chunks and the question are passed to Gemini's `gemini-3.5-flash-lite` model to generate an answer with numbered source citations.

The answer-generation prompt instructs the model to use the retrieved content as its source of information and avoid unsupported answers.

## Database Design

The application uses two SQLite tables:

- **`items`:** Stores saved notes and webpages, including title, content, source type, URL, and creation timestamp.
- **`chunks`:** Stores individual text chunks and their associated embeddings. Each chunk references its original item.

Foreign key cascading ensures that deleting an item also deletes its associated chunks.

## Design Decisions

- **SQLite:** Chosen for lightweight local persistence without requiring a separate database server.
- **Chunking with overlap:** Helps preserve context when information spans multiple chunks.
- **Gemini embeddings:** Provides semantic representations of saved content and user questions.
- **Cosine similarity:** Enables similarity-based retrieval without introducing a separate vector database.
- **Separation of concerns:** Routes, controllers, database operations, and AI services are organized into separate modules.
- **Structured logging:** Application events and errors are logged in a consistent structured format.

## Limitations and Future Improvements

- **Retrieval scalability:** The current implementation loads stored embeddings from SQLite and calculates cosine similarity in JavaScript. A dedicated vector database or indexed vector search solution would be more suitable for larger knowledge bases.
- **Authentication:** Add user authentication and separate knowledge libraries for multiple users.
- **Background processing:** Introduce background jobs for indexing larger documents and web pages.
- **URL ingestion security:** Strengthen protection against server-side request forgery (SSRF), including DNS/IP validation and redirect validation.
- **Automated testing:** Add unit, integration, and end-to-end tests.
- **Library scalability:** Introduce pagination and filtering for larger collections.

## Running Locally

Run the frontend and backend in separate terminals. Make sure the Gemini API key is configured in `server/.env` before starting the backend.

**Security note:** Never commit API keys, `.env` files, or generated database files to GitHub. These files should remain excluded through `.gitignore`.
