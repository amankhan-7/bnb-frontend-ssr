"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { baseApi } from "@/lib/api/baseApi";

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

export function useRoomAvailability(rooms = [], checkIn, checkOut) {
  const dispatch = useDispatch();
  const [roomAvailability, setRoomAvailability] = useState({});
  const [loading, setLoading] = useState(false);

  const effectiveCheckIn = checkIn || getTodayString();
  const effectiveCheckOut = checkOut || getTomorrowString();

  // Safely extract rooms array from various API response formats
  const roomArray = useMemo(() => {
    if (Array.isArray(rooms)) return rooms;
    if (Array.isArray(rooms?.data)) return rooms.data;
    if (Array.isArray(rooms?.rooms)) return rooms.rooms;
    return [];
  }, [rooms]);

  // Stable dependency key (primitive string)
  const roomIdsKey = useMemo(() => {
    return roomArray
      .map((room) => room._id || room.id)
      .filter(Boolean)
      .sort()
      .join(",");
  }, [roomArray]);

  useEffect(() => {
    if (!roomIdsKey || !effectiveCheckIn || !effectiveCheckOut) {
      setRoomAvailability((prev) =>
        Object.keys(prev).length === 0 ? prev : {}
      );
      return;
    }

    let cancelled = false;

    const fetchAvailability = async () => {
      setLoading(true);

      try {
        const results = await Promise.all(
          roomArray.map((room) =>
            dispatch(
              baseApi.endpoints.getInventoryAvailability.initiate(
                {
                  roomId: room._id || room.id,
                  fromDate: effectiveCheckIn,
                  toDate: effectiveCheckOut,
                },
                { forceRefetch: true },
              ),
            ).unwrap(),
          ),
        );

        if (cancelled) return;

        const availabilityMap = {};

        roomArray.forEach((room, index) => {
          const roomId = room._id || room.id;
          const res = results[index];
          const count =
            typeof res === "number"
              ? res
              : res?.availableRooms ??
                res?.availableCount ??
                res?.data ??
                room.totalCount;
          availabilityMap[roomId] = count;
        });

        setRoomAvailability(availabilityMap);
      } catch (err) {
        if (!cancelled) {
          console.error("Inventory fetch failed", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAvailability();

    return () => {
      cancelled = true;
    };
  }, [roomIdsKey, effectiveCheckIn, effectiveCheckOut, dispatch]);

  return { roomAvailability, loading };
}


