# Collaborative Study Room

A real-time collaborative study platform for students.

## Overview

Collaborative Study Room is a web platform designed to help students study together in shared online rooms. Users can create or join study rooms, communicate in real time, share study resources, work with coding problems, and run synchronized study sessions.

The project focuses on real-time collaboration, REST APIs, authentication, relational database design, and persistent application state.

## Features

### Authentication

- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Access token and refresh token flow
- Protected routes and APIs

### Study Rooms

- Create study rooms
- Join rooms using a unique room code
- View rooms the user is a member of
- View room members
- Leave a study room
- Update room information
- Delete rooms

### Real-Time Collaboration

- Real-time communication using Socket.IO
- Real-time chat
- Real-time study session synchronization
- Real-time resource sharing
- Real-time coding problem sharing
- Real-time room membership updates

### Study Sessions

- Start and end study sessions
- Synchronized session state across clients
- Live study session timer
- Only the session starter can end the session

### Resources

- Share external study resources
- Upload PDF resources
- View and download shared PDFs
- Persistent resource metadata
- Real-time resource updates

### Coding Problems

- Add coding and DSA problems to a study room
- Store problem title, URL, difficulty, and topic
- Persistent problem storage
- Real-time problem updates

### Chat

- Real-time room-based messaging
- Persistent message storage
- Load previous messages when entering a room

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Socket.IO Client

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- JWT
- bcrypt
- Multer

### Database

- PostgreSQL

### Tools

- Git
- GitHub
- npm

## Architecture

```text
                 React + TypeScript
                    /         \
                   /           \
             REST API        Socket.IO
                 /               \
                v                 v
        Node.js + Express    Real-Time Events
                |
                v
           PostgreSQL
```

## Project Structure
```
collaborative-study-room/
│
├── client/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       └── types/
│
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── db.ts
│   │   └── server.ts
│   │
│   ├── migrations/
│   └── uploads/
│
└── README.md
```
## Running the Project
### Prerequisites
Node.js\
npm\
PostgreSQL
### Backend
cd backend\
npm install\
npm run dev\
\
The backend runs on:\
\
http://localhost:5000

### Frontend
In a separate terminal:

cd client\
npm install\
npm run dev\
\
The frontend runs on:\
http://localhost:5173
### Database
Create a PostgreSQL database named:\
collaborative_study_room\
\
Configure the database credentials and JWT secret in the backend .env file.\
\
Run the migrations:\
\
cd backend\
npm run migrate -- up\
\
\
Current Progress\
 [x] Authentication\
 [x] Study rooms\
 [x] PostgreSQL integration\
 [x] Socket.IO integration\
 [x] Real-time chat\
 [x] Persistent chat history\
 [x] Study sessions and synchronized timer\
 [x] Resource sharing\
 [x] PDF upload\
 [x] Coding/DSA problem sharing\
 [x] Real-time problem synchronization\
 [ ] Problem completion tracking\
 [ ] Resource completion tracking\
 [ ] Polls and voting\
 [ ] Shared notes/whiteboard\
 [ ] Activity feed\
 [ ] Redis Pub/Sub\
 [ ] Testing\
 [ ] Docker and deployment
