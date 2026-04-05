# GemDesk Backend - Signaling & Persistence Server

This is the core backend service for GemDesk, providing real-time WebRTC signaling, session orchestration, and persistent storage for collaboration history.

## 🚀 Key Features

### 📡 Real-time WebRTC Signaling
*   **Encrypted Handshakes**: Facilitates the exchange of SDP offers, answers, and ICE candidates for secure P2P connections.
*   **Session Management**: Handles host/viewer roles, session creation, and automatic cleanup on disconnect.
*   **Permission Control**: Real-time relay of 'Read-Only' vs 'Write' permissions from host to viewers.

### 💾 Persistent Data Storage
*   **Chat History**: Stores all text-based collaboration and AI interactions using MongoDB.
*   **Session Tracking**: Maintains internal state for active sessions to ensure reliability.

### ⌨️ Remote Command Relay
*   **Low-Latency Control**: Relays mouse and keyboard input events from authorized viewers to the host machine.
*   **Voice Status Sync**: Synchronizes microphone status across all participants in a session.

---

## 🛠️ Tech Stack

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Real-time**: [Socket.io](https://socket.io/)
*   **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
*   **Environment**: [dotenv](https://www.npmjs.com/package/dotenv)

---

## 🚦 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   MongoDB instance (Local or Atlas)

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/OluRemiFour/Gemdesk-backend.git
    cd gemdesk-backend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env` file in the root:
    ```env
    PORT=3001
    MONGODB_URI=your_mongodb_connection_string
    ```

### Running the Server
*   **Development**: `npm run dev` (uses nodemon)
*   **Production**: `npm start`

---

## 🔌 API Endpoints

### Chats
*   `GET /api/chats`: List all chat sessions.
*   `POST /api/chats`: Create a new chat session.
*   `PATCH /api/chats/:chatId`: Update chat title.
*   `DELETE /api/chats/:chatId`: Delete a chat and all its messages.

### Messages
*   `GET /api/chats/:chatId/messages`: Retrieve message history for a chat.
*   `POST /api/messages`: Save a new message (AI or User).

---

## 📡 Socket.io Events (Internal)

| Event | Direction | Description |
| :--- | :--- | :--- |
| `create-session` | Client -> Server | Host initializes a new session ID. |
| `join-session` | Client -> Server | Viewer requests to join a session. |
| `approve-request`| Client -> Server | Host approves/denies a viewer. |
| `signal` | Bi-directional | Relays WebRTC signaling data. |
| `control-command`| Client -> Server | Relays remote input (if authorized). |
| `toggle-permissions`| Client -> Server | Host changes viewer access level. |

---
*Powered by GemDesk Engineering*
