import React, { useState } from "react";
import { Video, Users, ArrowRight, Plus } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://video-call-f8cz.vercel.app";

export default function Lobby({ onJoin }) {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState("join");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/create-room`, { method: "POST" });
      const data = await res.json();
      onJoin(data.roomId, userName.trim());
    } catch {
      setError("Failed to create room. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!roomId.trim()) {
      setError("Please enter a room ID.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/room/${roomId.trim().toUpperCase()}`);
      const data = await res.json();
      if (!data.exists) {
        setError("Room not found. Check the room ID.");
        setLoading(false);
        return;
      }
      onJoin(roomId.trim().toUpperCase(), userName.trim());
    } catch {
      setError("Failed to join room. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">VideoCall</h1>
          <p className="text-slate-400 mt-2">Connect with anyone, anywhere</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
          <div className="flex rounded-xl bg-slate-900 p-1 mb-6">
            <button
              onClick={() => { setMode("join"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "join"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Join Room
            </button>
            <button
              onClick={() => { setMode("create"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "create"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Room
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                onKeyDown={(e) => e.key === "Enter" && (mode === "join" ? handleJoinRoom() : handleCreateRoom())}
              />
            </div>

            {mode === "join" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {mode === "create" ? (
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25"
              >
                <Plus className="w-5 h-5" />
                {loading ? "Creating..." : "Create Room"}
              </button>
            ) : (
              <button
                onClick={handleJoinRoom}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25"
              >
                <ArrowRight className="w-5 h-5" />
                {loading ? "Joining..." : "Join Room"}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-slate-500 text-sm">
          <Users className="w-4 h-4" />
          <span>Supports up to 6+ participants</span>
        </div>
      </div>
    </div>
  );
}
