# GemDesk Backend

This is the backend server for GemDesk, providing WebRTC signaling and persistent storage using MongoDB.

## Features

- **WebRTC Signaling**: Facilitates peer-to-peer screen sharing sessions.
- **MongoDB Persistence**: Stores chat history and messages.
- **REST API**: Simple JSON endpoints for frontend interaction.

## Prerequisites

- Node.js (v18+)
- MongoDB Cluster (Atlas or local)

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    PORT=3001
    MONGODB_URI=your_mongodb_connection_string
    ```

## Running the Server

- **Development Mode** (with nodemon):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

## API Endpoints

- `GET /api/chats`: Retrieve all chat sessions.
- `POST /api/chats`: Create a new chat session.
- `GET /api/chats/:chatId/messages`: Get all messages for a specific chat.
- `POST /api/messages`: Save a new message to a chat.
