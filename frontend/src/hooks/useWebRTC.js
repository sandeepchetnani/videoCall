import { useRef, useEffect } from "react";
import socket from "../socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC({ localStreamRef, peersRef, setPeers }) {
  const setPeersRef = useRef(setPeers);
  useEffect(() => { setPeersRef.current = setPeers; });

  const api = useRef(null);

  if (!api.current) {
    const createPeerConnection = (remoteSocketId) => {
      if (peersRef.current[remoteSocketId]) {
        peersRef.current[remoteSocketId].close();
        delete peersRef.current[remoteSocketId];
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { to: remoteSocketId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (!remoteStream) return;
        setPeersRef.current((prev) => {
          const existing = prev.find((p) => p.socketId === remoteSocketId);
          if (existing) {
            return prev.map((p) =>
              p.socketId === remoteSocketId ? { ...p, stream: remoteStream } : p
            );
          }
          return [...prev, { socketId: remoteSocketId, userName: remoteSocketId, stream: remoteStream }];
        });
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          delete peersRef.current[remoteSocketId];
          setPeersRef.current((prev) => prev.filter((p) => p.socketId !== remoteSocketId));
        }
      };

      peersRef.current[remoteSocketId] = pc;
      return pc;
    };

    const initiateCall = async (remoteSocketId) => {
      const pc = createPeerConnection(remoteSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: remoteSocketId, offer });
    };

    const handleOffer = async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("ICE candidate error:", e);
        }
      }
    };

    const removePeer = (socketId) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setPeersRef.current((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    api.current = { initiateCall, handleOffer, handleAnswer, handleIceCandidate, removePeer };
  }

  return api.current;
}
