import React, { useEffect, useRef, useState, useCallback } from "react";
import socket from "../socket";
import { useWebRTC } from "../hooks/useWebRTC";
import { RemoteVideoTile, PipVideoTile } from "./VideoTile";
import Controls from "./Controls";
import { Users, ArrowLeftRight } from "lucide-react";

export default function Room({ roomId, userName, onLeave }) {
  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  const [peers, setPeers] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [peerStates, setPeerStates] = useState({});
  const [localVideoKey, setLocalVideoKey] = useState(0);
  const [facingMode, setFacingMode] = useState("user");
  const [isFlipping, setIsFlipping] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const cameraTrackRef = useRef(null);
  const stopScreenShareRef = useRef(null);

  const { initiateCall, handleOffer, handleAnswer, handleIceCandidate, removePeer } =
    useWebRTC({ localStreamRef, peersRef, setPeers });

  // Single effect — runs once on mount, torn down on unmount
  useEffect(() => {
    let cancelled = false;

    const onRoomJoined = ({ participants }) => {
      participants.forEach(({ socketId, userName: peerName }) => {
        setPeers((prev) =>
          prev.find((p) => p.socketId === socketId)
            ? prev
            : [...prev, { socketId, userName: peerName, stream: null }]
        );
        initiateCall(socketId);
      });
    };

    const onUserJoined = ({ socketId, userName: peerName }) => {
      setPeers((prev) => {
        const existing = prev.find((p) => p.socketId === socketId);
        if (existing) {
          return prev.map((p) => p.socketId === socketId ? { ...p, userName: peerName } : p);
        }
        return [...prev, { socketId, userName: peerName, stream: null }];
      });
    };

    const onUserLeft = ({ socketId }) => {
      removePeer(socketId);
      setPeerStates((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    const onUserToggleAudio = ({ socketId, enabled }) => {
      setPeerStates((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], audioEnabled: enabled },
      }));
    };

    const onUserToggleVideo = ({ socketId, enabled }) => {
      setPeerStates((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], videoEnabled: enabled },
      }));
    };

    const onForceStopScreenShare = () => {
      stopScreenShareRef.current();
    };

    const setupAndJoin = async () => {
      // 1. Get media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalVideoKey((k) => k + 1);
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          localStreamRef.current = stream;
          setVideoEnabled(false);
          setLocalVideoKey((k) => k + 1);
        } catch {
          console.error("No media devices available");
        }
      }

      // 2. Register all socket listeners
      socket.on("room-joined", onRoomJoined);
      socket.on("user-joined", onUserJoined);
      socket.on("user-left", onUserLeft);
      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("ice-candidate", handleIceCandidate);
      socket.on("user-toggle-audio", onUserToggleAudio);
      socket.on("user-toggle-video", onUserToggleVideo);
      socket.on("force-stop-screen-share", onForceStopScreenShare);

      // 3. Connect and join room
      if (socket.connected) {
        socket.emit("join-room", { roomId, userName });
      } else {
        socket.once("connect", () => socket.emit("join-room", { roomId, userName }));
        socket.connect();
      }
    };

    setupAndJoin();

    return () => {
      cancelled = true;
      socket.disconnect();
      socket.off("room-joined", onRoomJoined);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-toggle-audio", onUserToggleAudio);
      socket.off("user-toggle-video", onUserToggleVideo);
      socket.off("force-stop-screen-share", onForceStopScreenShare);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      setPeers([]);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const enabled = !audioEnabled;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setAudioEnabled(enabled);
    socket.emit("toggle-audio", { roomId, enabled });
  }, [audioEnabled, roomId]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const enabled = !videoEnabled;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
    setVideoEnabled(enabled);
    setLocalVideoKey((k) => k + 1);
    socket.emit("toggle-video", { roomId, enabled });
  }, [videoEnabled, roomId]);

  const flipCamera = useCallback(async () => {
    if (!localStreamRef.current || isFlipping) return;
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setIsFlipping(true);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: nextFacing } },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldTrack) {
        localStreamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStreamRef.current.addTrack(newVideoTrack);
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(newVideoTrack);
      });
      setFacingMode(nextFacing);
      setLocalVideoKey((k) => k + 1);
    } catch {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing },
          audio: false,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          localStreamRef.current.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStreamRef.current.addTrack(newVideoTrack);
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(newVideoTrack);
        });
        setFacingMode(nextFacing);
        setLocalVideoKey((k) => k + 1);
      } catch (err) {
        console.error("Camera flip failed:", err);
      }
    } finally {
      setIsFlipping(false);
    }
  }, [facingMode, isFlipping]);

  const stopScreenShare = useCallback(async () => {
    if (!localStreamRef.current) return;
    const screenTrack = localStreamRef.current.getVideoTracks()[0];
    if (screenTrack) {
      localStreamRef.current.removeTrack(screenTrack);
      screenTrack.stop();
    }
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      const camTrack = camStream.getVideoTracks()[0];
      cameraTrackRef.current = camTrack;
      localStreamRef.current.addTrack(camTrack);
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
    } catch (err) {
      console.error("Restore camera failed:", err);
    }
    setIsSharingScreen(false);
    setLocalVideoKey((k) => k + 1);
    socket.emit("screen-share-stop", { roomId });
    socket.emit("toggle-video", { roomId, enabled: true });
  }, [facingMode, roomId]);

  // Keep ref in sync so the stable useEffect closure can call latest version
  useEffect(() => { stopScreenShareRef.current = stopScreenShare; }, [stopScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (!localStreamRef.current) return;

    if (isSharingScreen) {
      await stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];

      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        cameraTrackRef.current = oldVideoTrack;
        localStreamRef.current.removeTrack(oldVideoTrack);
      }
      localStreamRef.current.addTrack(screenTrack);

      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsSharingScreen(true);
      setLocalVideoKey((k) => k + 1);
      socket.emit("screen-share-start", { roomId });
      socket.emit("toggle-video", { roomId, enabled: true });
    } catch (err) {
      if (err.name !== "NotAllowedError") console.error("Screen share failed:", err);
    }
  }, [isSharingScreen, stopScreenShare, roomId]);

  const handleLeave = useCallback(() => {
    socket.disconnect();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    onLeave();
  }, [onLeave]);

  const [focusedPeerIndex, setFocusedPeerIndex] = useState(0);
  const clampedIndex = peers.length > 0 ? Math.min(focusedPeerIndex, peers.length - 1) : 0;
  const focusedPeer = peers[clampedIndex] ?? null;

  // PiP swap state: when true, local is fullscreen and remote is in PiP
  const [isSwapped, setIsSwapped] = useState(false);

  // PiP drag state
  const PIP_W = 110, PIP_H = 155;
  const [pipPos, setPipPos] = useState({ x: null, y: null }); // null = default top-right
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const pipRef = useRef(null);

  const getDefaultPos = useCallback(() => {
    return { x: window.innerWidth - PIP_W - 16, y: 16 };
  }, []);

  const resolvedPos = pipPos.x === null ? getDefaultPos() : pipPos;

  const onPipPointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      dragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: resolvedPos.x,
      origY: resolvedPos.y,
    };
    pipRef.current?.setPointerCapture(e.pointerId);
  }, [resolvedPos]);

  const onPipPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
    const newX = Math.max(0, Math.min(window.innerWidth - PIP_W, dragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - PIP_H, dragRef.current.origY + dy));
    setPipPos({ x: newX, y: newY });
  }, []);

  const onPipPointerUp = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (!dragRef.current.moved) {
      // tap = swap
      setIsSwapped((s) => !s);
    }
  }, []);

  // fullscreen content
  const fullscreenContent = isSwapped ? (
    <RemoteVideoTile
      key={`local-fullscreen-${localVideoKey}`}
      stream={localStreamRef.current}
      userName={userName}
      isMuted={!audioEnabled}
      isVideoOff={!videoEnabled}
      mirror
    />
  ) : focusedPeer ? (
    <RemoteVideoTile
      key={focusedPeer.socketId}
      stream={focusedPeer.stream}
      userName={focusedPeer.userName}
      isMuted={!(peerStates[focusedPeer.socketId]?.audioEnabled ?? true)}
      isVideoOff={!(peerStates[focusedPeer.socketId]?.videoEnabled ?? true)}
    />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-900">
      <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
        <Users className="w-10 h-10 text-slate-400" />
      </div>
      <p className="text-slate-400 text-sm">Waiting for others to join…</p>
    </div>
  );

  // pip content
  const pipContent = isSwapped && focusedPeer ? (
    <RemoteVideoTile
      key={`pip-remote-${focusedPeer.socketId}`}
      stream={focusedPeer.stream}
      userName={focusedPeer.userName}
      isMuted={!(peerStates[focusedPeer.socketId]?.audioEnabled ?? true)}
      isVideoOff={!(peerStates[focusedPeer.socketId]?.videoEnabled ?? true)}
    />
  ) : (
    <PipVideoTile
      key={`local-${localVideoKey}`}
      stream={localStreamRef.current}
      userName={userName}
      isMuted={!audioEnabled}
      isVideoOff={!videoEnabled}
      mirror={!isSharingScreen}
    />
  );

  // All tiles including local, in render order
  const allTiles = [
    {
      key: `local-${localVideoKey}`,
      stream: localStreamRef.current,
      userName,
      isMuted: !audioEnabled,
      isVideoOff: !videoEnabled,
      isLocal: true,
    },
    ...peers.map((peer) => ({
      key: peer.socketId,
      stream: peer.stream,
      userName: peer.userName,
      isMuted: !(peerStates[peer.socketId]?.audioEnabled ?? true),
      isVideoOff: !(peerStates[peer.socketId]?.videoEnabled ?? true),
      isLocal: false,
    })),
  ];

  const totalCount = allTiles.length;

  if (totalCount <= 2) {
    // ── WhatsApp PiP layout (1 or 2 users) ──
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        <div className="absolute inset-0">
          {fullscreenContent}
        </div>

        {(focusedPeer || isSwapped) && (
          <div
            ref={pipRef}
            onPointerDown={onPipPointerDown}
            onPointerMove={onPipPointerMove}
            onPointerUp={onPipPointerUp}
            className="absolute z-30 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 cursor-grab active:cursor-grabbing select-none"
            style={{ width: PIP_W, height: PIP_H, left: resolvedPos.x, top: resolvedPos.y, touchAction: "none" }}
          >
            {pipContent}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setIsSwapped((s) => !s); }}
              className="absolute top-1.5 left-1.5 z-40 bg-black/60 hover:bg-black/80 rounded-full p-1 transition"
              title="Swap view"
            >
              <ArrowLeftRight className="w-3 h-3 text-white" />
            </button>
          </div>
        )}

        <Controls
          roomId={roomId}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeave={handleLeave}
          onFlipCamera={flipCamera}
          isFlipping={isFlipping}
          onScreenShare={toggleScreenShare}
          isSharingScreen={isSharingScreen}
        />
      </div>
    );
  }

  if (totalCount === 3) {
    // ── 3-user layout: 2 on top row, 1 centered below ──
    return (
      <div className="fixed inset-0 bg-black flex flex-col gap-1 p-1 pb-24 overflow-hidden">
        <div className="flex gap-1 flex-1">
          {allTiles.slice(0, 2).map((t) => (
            <div key={t.key} className="relative flex-1 rounded-xl overflow-hidden">
              {t.isLocal
                ? <RemoteVideoTile stream={t.stream} userName={t.userName} isMuted={t.isMuted} isVideoOff={t.isVideoOff} mirror={!isSharingScreen} />
                : <RemoteVideoTile stream={t.stream} userName={t.userName} isMuted={t.isMuted} isVideoOff={t.isVideoOff} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center flex-1">
          <div className="relative w-1/2 rounded-xl overflow-hidden">
            {allTiles[2].isLocal
              ? <RemoteVideoTile stream={allTiles[2].stream} userName={allTiles[2].userName} isMuted={allTiles[2].isMuted} isVideoOff={allTiles[2].isVideoOff} mirror={!isSharingScreen} />
              : <RemoteVideoTile stream={allTiles[2].stream} userName={allTiles[2].userName} isMuted={allTiles[2].isMuted} isVideoOff={allTiles[2].isVideoOff} />}
          </div>
        </div>
        <Controls
          roomId={roomId}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeave={handleLeave}
          onFlipCamera={flipCamera}
          isFlipping={isFlipping}
          onScreenShare={toggleScreenShare}
          isSharingScreen={isSharingScreen}
        />
      </div>
    );
  }

  // ── 4+ users: 2-column grid ──
  return (
    <div className="fixed inset-0 bg-black p-1 pb-24 overflow-y-auto">
      <div className="grid grid-cols-2 gap-1 h-full" style={{ gridAutoRows: "calc(50vh - 3rem)" }}>
        {allTiles.map((t) => (
          <div key={t.key} className="relative rounded-xl overflow-hidden">
            {t.isLocal
              ? <RemoteVideoTile stream={t.stream} userName={t.userName} isMuted={t.isMuted} isVideoOff={t.isVideoOff} mirror={!isSharingScreen} />
              : <RemoteVideoTile stream={t.stream} userName={t.userName} isMuted={t.isMuted} isVideoOff={t.isVideoOff} />}
          </div>
        ))}
      </div>
      <Controls
        roomId={roomId}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeave}
        onFlipCamera={flipCamera}
        isFlipping={isFlipping}
        onScreenShare={toggleScreenShare}
        isSharingScreen={isSharingScreen}
      />
    </div>
  );
}
