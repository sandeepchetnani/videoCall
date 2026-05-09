import React, { useState } from "react";
import Lobby from "./components/Lobby";
import Room from "./components/Room";

export default function App() {
  const [session, setSession] = useState(null);

  const handleJoin = (roomId, userName) => {
    setSession({ roomId, userName });
  };

  const handleLeave = () => {
    setSession(null);
  };

  if (session) {
    return (
      <Room
        roomId={session.roomId}
        userName={session.userName}
        onLeave={handleLeave}
      />
    );
  }

  return <Lobby onJoin={handleJoin} />;
}
