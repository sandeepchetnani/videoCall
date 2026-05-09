import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://videocall-41do.onrender.com";

const socket = io(BACKEND_URL, {
  autoConnect: false,
});

export default socket;
