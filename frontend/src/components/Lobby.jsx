import React, { useState } from "react";
import { Users, ArrowRight, Plus } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://videocall-41do.onrender.com";

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
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f9] px-4 py-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg shadow-[#0284c7]/30 bg-gradient-to-br from-[#0284c7] to-[#0ea5e9]">
            <span className="text-3xl leading-none select-none">🌊</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#0d1b2a] via-[#0284c7] to-[#38bdf8] bg-clip-text text-transparent">
            Wavely
          </h1>
          <p className="text-[#4a6080] mt-1 text-sm">Crystal-clear video calls, anytime</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-[#0d1b2a]/8 border border-[#e0f2fe]">

          {/* Tab switcher */}
          <div className="flex rounded-2xl bg-[#f0f4f9] p-1 mb-6">
            <button
              onClick={() => { setMode("join"); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                mode === "join"
                  ? "bg-white text-[#0284c7] shadow-sm border border-[#bae6fd]"
                  : "text-[#4a6080] hover:text-[#0d1b2a]"
              }`}
            >
              Join Room
            </button>
            <button
              onClick={() => { setMode("create"); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                mode === "create"
                  ? "bg-white text-[#0284c7] shadow-sm border border-[#bae6fd]"
                  : "text-[#4a6080] hover:text-[#0d1b2a]"
              }`}
            >
              Create Room
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4a6080] uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name…"
                className="w-full px-4 py-3 bg-[#f0f4f9] border border-[#bae6fd] rounded-xl text-[#0d1b2a] placeholder-[#94b4cc] focus:outline-none focus:ring-2 focus:ring-[#7dd3fc] focus:border-[#7dd3fc] transition text-sm"
                onKeyDown={(e) => e.key === "Enter" && (mode === "join" ? handleJoinRoom() : handleCreateRoom())}
              />
            </div>

            {mode === "join" && (
              <div>
                <label className="block text-xs font-semibold text-[#4a6080] uppercase tracking-wider mb-1.5">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID…"
                  className="w-full px-4 py-3 bg-[#f0f4f9] border border-[#bae6fd] rounded-xl text-[#0d1b2a] placeholder-[#94b4cc] focus:outline-none focus:ring-2 focus:ring-[#7dd3fc] focus:border-[#7dd3fc] transition font-mono tracking-widest text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                />
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {mode === "create" ? (
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md shadow-[#0284c7]/25 text-sm"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Creating…" : "Create Room"}
              </button>
            ) : (
              <button
                onClick={handleJoinRoom}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md shadow-[#0284c7]/25 text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                {loading ? "Joining…" : "Join Room"}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 text-[#94b4cc] text-xs">
          <Users className="w-3.5 h-3.5" />
          <span>Wavely supports up to 6+ participants</span>
        </div>
      </div>
    </div>
  );
}
