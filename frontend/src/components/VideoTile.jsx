import React, { useEffect, useRef } from "react";
import { MicOff, User } from "lucide-react";

export function RemoteVideoTile({ stream, userName, isMuted, isVideoOff, mirror }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showAvatar = !stream || isVideoOff;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        style={{ display: showAvatar ? "none" : "block", transform: mirror ? "scaleX(-1)" : undefined }}
      />
      {showAvatar && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="w-12 h-12 text-slate-400" />
          </div>
          <span className="text-white text-lg font-medium">{userName}</span>
        </div>
      )}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <span className="text-white font-semibold text-base drop-shadow">{userName}</span>
        {isMuted && (
          <span className="bg-black/50 rounded-full p-1.5">
            <MicOff className="w-4 h-4 text-white" />
          </span>
        )}
      </div>
    </div>
  );
}

export function PipVideoTile({ stream, userName, isMuted, isVideoOff, mirror = true }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showAvatar = !stream || isVideoOff;

  return (
    <div className="relative w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ display: showAvatar ? "none" : "block", transform: mirror ? "scaleX(-1)" : undefined }}
      />
      {showAvatar && (
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-300" />
          </div>
        </div>
      )}
      {isMuted && (
        <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-0.5">
          <MicOff className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
}

export default function VideoTile({ stream, userName, isMuted, isVideoOff, isLocal }) {
  return isLocal
    ? <PipVideoTile stream={stream} userName={userName} isMuted={isMuted} isVideoOff={isVideoOff} />
    : <RemoteVideoTile stream={stream} userName={userName} isMuted={isMuted} isVideoOff={isVideoOff} />;
}
