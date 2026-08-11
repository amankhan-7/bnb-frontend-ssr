"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/utils/useAuth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import RoomCard from "./Room";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Rooms({
  rooms = [],
  roomAvailability: externalAvailability,
  selectedRoom,
  setSelectedRoom,
  checkIn,
  checkOut,
  fromDate,
  toDate,
}) {
  const { user } = useAuth();
  const router = useRouter();

  // Safely parse room list from array or nested response object
  const roomList = useMemo(() => {
    if (Array.isArray(rooms)) return rooms;
    if (Array.isArray(rooms?.data)) return rooms.data;
    if (Array.isArray(rooms?.rooms)) return rooms.rooms;
    return [];
  }, [rooms]);

  const effectiveFromDate = checkIn || fromDate || getTodayString();
  const effectiveToDate = checkOut || toDate || getTomorrowString();

  // Fetch availability using the custom hook if externalAvailability is not passed
  const { roomAvailability: hookAvailability } = useRoomAvailability(
    externalAvailability ? [] : roomList,
    effectiveFromDate,
    effectiveToDate,
  );

  const mergedAvailability = externalAvailability || hookAvailability;


  const handleSelect = (room) => {
    setSelectedRoom((prev) => (prev?._id === room._id ? null : room));
  };

  return (
    <section className="pb-8 px-3">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="flex flex-col mb-10 pl-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Select Available Rooms
          </h2>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">
            Choose a luxury room type that fits your party&apos;s details.
          </p>
        </div>

        <div className="space-y-6">
          {roomList.map((room) => {
            const roomId = room._id || room.id;
            const availableCount =
              mergedAvailability?.[roomId] ??
              room.totalCount ??
              room.availableRooms ??
              1;

            return (
              <RoomCard
                key={roomId}
                room={room}
                isSelected={selectedRoom?._id === roomId}
                available={availableCount}
                user={user}
                router={router}
                toast={toast}
                setSelectedRoom={setSelectedRoom}
                handleSelect={handleSelect}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Rooms;

