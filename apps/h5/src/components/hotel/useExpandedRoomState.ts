import { useState } from "react";

export function useExpandedRoomState() {
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  return {
    expandedRoomId,
    toggleRoom: (roomId: string) => {
      setExpandedRoomId((current) => (current === roomId ? null : roomId));
    },
  };
}
