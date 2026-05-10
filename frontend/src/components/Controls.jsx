import React, { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Phone, Copy, Check, RefreshCw, MonitorUp, MonitorOff } from "lucide-react";

const canScreenShare = typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices !== "undefined" &&
  typeof navigator.mediaDevices.getDisplayMedia === "function";

export default function Controls({ roomId, audioEnabled, videoEnabled, onToggleAudio, onToggleVideo, onLeave, onFlipCamera, isFlipping, onScreenShare, isSharingScreen }) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center gap-2 pb-safe pb-4 pt-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center gap-2 px-3 py-2 sm:px-6 sm:py-3">

        {/* Room ID chip */}
        <button
          onClick={copyRoomId}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e0f2fe]/90 border border-[#7dd3fc] text-[#0d1b2a] text-[10px] sm:text-xs font-mono hover:bg-[#bae6fd] transition backdrop-blur-sm shadow"
        >
          {copied ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#0284c7]" /> : <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#0284c7]" />}
          <span className="tracking-widest font-semibold">{roomId}</span>
        </button>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <button
            onClick={onToggleAudio}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
              audioEnabled
                ? "bg-[#e0f2fe]/90 hover:bg-[#bae6fd] text-[#0d1b2a]"
                : "bg-red-100 hover:bg-red-200 text-red-600"
            }`}
            title={audioEnabled ? "Mute" : "Unmute"}
          >
            {audioEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={onLeave}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/30"
            title="End Call"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6 rotate-[135deg]" />
          </button>

          <button
            onClick={onToggleVideo}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
              videoEnabled
                ? "bg-[#e0f2fe]/90 hover:bg-[#bae6fd] text-[#0d1b2a]"
                : "bg-red-100 hover:bg-red-200 text-red-600"
            }`}
            title={videoEnabled ? "Stop Video" : "Start Video"}
          >
            {videoEnabled ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={onFlipCamera}
            disabled={isFlipping}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-[#e0f2fe]/90 hover:bg-[#bae6fd] text-[#0d1b2a] disabled:opacity-40 transition-all shadow-md"
            title="Flip Camera"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isFlipping ? "animate-spin" : ""}`} />
          </button>

          {canScreenShare ? (
            <button
              onClick={onScreenShare}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
                isSharingScreen
                  ? "bg-[#0284c7] hover:bg-[#0369a1] text-white"
                  : "bg-[#e0f2fe]/90 hover:bg-[#bae6fd] text-[#0d1b2a]"
              }`}
              title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
            >
              {isSharingScreen ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          ) : (
            <button
              disabled
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-300 opacity-50 cursor-not-allowed shadow-md"
              title="Screen sharing is not supported on this device"
            >
              <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {isSharingScreen && (
          <p className="text-[#0284c7] text-[10px] sm:text-xs font-medium tracking-wide animate-pulse">
            Sharing screen…
          </p>
        )}
      </div>
    </div>
  );
}
