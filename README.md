# VideoCall App

Multi-user video call app using WebRTC + Socket.io.

## Stack
- **Backend**: Node.js, Express, Socket.io (signaling server)
- **Frontend**: React, Vite, TailwindCSS, WebRTC (mesh topology)

## Setup

### Backend
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:5000

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Runs on http://localhost:3000

## Features
- Create or join rooms with a room ID
- Multi-user mesh WebRTC (peer-to-peer)
- Mute/unmute audio
- Enable/disable video
- Copy room ID to invite others
- Live participant count
- Visual indicators for muted/video-off peers
