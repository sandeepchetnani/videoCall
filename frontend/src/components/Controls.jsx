import React, { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Phone, Copy, Check, RefreshCw, MonitorUp, MonitorOff } from "lucide-react";

export default function Controls({ roomId, audioEnabled, videoEnabled, onToggleAudio, onToggleVideo, onLeave, onFlipCamera, isFlipping, onScreenShare, isSharingScreen }) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-8 pt-4 flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
      <button
        onClick={copyRoomId}
        className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/20 text-white/80 text-xs font-mono transition hover:bg-black/70"
      >
        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        <span className="tracking-widest">{roomId}</span>
      </button>

      <div className="pointer-events-auto flex items-center justify-center gap-6">
        <button
          onClick={onToggleAudio}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl bg-white/20 hover:bg-white/30"
          title={audioEnabled ? "Mute" : "Unmute"}
        >
          {audioEnabled
            ? <Mic className="w-6 h-6 text-white" />
            : <MicOff className="w-6 h-6 text-red-400" />}
        </button>

        <button
          onClick={onLeave}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-400 text-white transition-all shadow-2xl"
          title="End Call"
        >
          <Phone className="w-7 h-7 rotate-[135deg]" />
        </button>

        <button
          onClick={onToggleVideo}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-all shadow-xl"
          title={videoEnabled ? "Stop Video" : "Start Video"}
        >
          {videoEnabled
            ? <Video className="w-6 h-6 text-white" />
            : <VideoOff className="w-6 h-6 text-red-400" />}
        </button>

        <button
          onClick={onFlipCamera}
          disabled={isFlipping}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 disabled:opacity-50 transition-all shadow-xl"
          title="Flip Camera"
        >
          <RefreshCw className={`w-6 h-6 text-white ${isFlipping ? "animate-spin" : ""}`} />
        </button>

        <button
          onClick={onScreenShare}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl ${
            isSharingScreen
              ? "bg-green-500 hover:bg-green-400"
              : "bg-white/20 hover:bg-white/30"
          }`}
          title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
        >
          {isSharingScreen
            ? <MonitorOff className="w-6 h-6 text-white" />
            : <MonitorUp className="w-6 h-6 text-white" />}
        </button>
      </div>

      {isSharingScreen && (
        <p className="pointer-events-none text-green-400 text-xs font-medium tracking-wide animate-pulse">
          Sharing screen…
        </p>
      )}
    </div>
  );
}
