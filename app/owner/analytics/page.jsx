"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BedDouble,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Hotel,
  IndianRupee,
  MapPin,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  useGetOwnerHotelsQuery,
  useGetOwnerHotelRoomsQuery,
  useGetInventoryCalendarQuery,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
};

const getDateLabel = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const getDayName = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-IN", {
    weekday: "short",
  });
};

/*
 * Use a stable date key so inventories from different rooms
 * can be combined into the same day.
 */
const getDateKey = (date) => {
  if (!date) return null;

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return null;

  return d.toISOString().split("T")[0];
};

/* -------------------------------------------------------------------------- */
/* Inventory Fetcher                                                          */
/* -------------------------------------------------------------------------- */

/*
 * IMPORTANT:
 *
 * Your backend route is:
 *
 * GET /inventory/calendar/:roomId
 *
 * Therefore this component MUST receive a room and call:
 *
 * useGetInventoryCalendarQuery(room._id)
 *
 * NOT:
 *
 * useGetInventoryCalendarQuery({ hotelId: hotel._id })
 *
 * This component doesn't render anything.
 * It simply fetches one room's inventory and sends it to the parent.
 */

function RoomInventoryFetcher({ room, onInventory }) {
  const {
    data: inventoryResponse = [],
    isLoading,
    isError,
  } = useGetInventoryCalendarQuery(room._id, {
    skip: !room?._id,
  });

  useEffect(() => {
    if (isLoading || isError || !room?._id) {
      return;
    }

    const inventory = Array.isArray(inventoryResponse)
      ? inventoryResponse
      : inventoryResponse?.inventory ||
        inventoryResponse?.data ||
        [];

    onInventory(room._id, inventory);
  }, [
    room?._id,
    inventoryResponse,
    isLoading,
    isError,
    onInventory,
  ]);

  return null;
}

/* -------------------------------------------------------------------------- */
/* Hotel Analytics                                                            */
/* -------------------------------------------------------------------------- */

function HotelAnalytics({ hotel, onData }) {
  const [expanded, setExpanded] = useState(true);
  const [roomInventories, setRoomInventories] = useState({});

  const {
    data: rooms = [],
    isLoading: roomsLoading,
    isError: roomsError,
  } = useGetOwnerHotelRoomsQuery(hotel._id);

  const handleRoomInventory = (roomId, inventory) => {
    setRoomInventories((previous) => {
      if (previous[roomId] === inventory) {
        return previous;
      }

      return {
        ...previous,
        [roomId]: inventory,
      };
    });
  };

  const inventoryLoading =
    roomsLoading ||
    rooms.some(
      (room) =>
        room?._id &&
        !Object.prototype.hasOwnProperty.call(
          roomInventories,
          room._id
        )
    );

  const analytics = useMemo(() => {
    const totalRooms = rooms.reduce(
      (sum, room) =>
        sum + Number(room.totalCount || 0),
      0
    );

    const inventoryByDate = {};

    let totalRevenue = 0;
    let totalBooked = 0;
    let totalRoomNights = 0;

    rooms.forEach((room) => {
      const roomInventory =
        roomInventories[room._id] || [];

      const roomTotal = Number(
        room.totalCount || 0
      );

      const roomBasePrice = Number(
        room.basePrice || 0
      );

      roomInventory.forEach((item) => {
        const dateKey = getDateKey(item.date);

        if (!dateKey) return;

        const bookedRooms = Number(
          item.bookedRooms ??
            item.bookedCount ??
            0
        );

        const availableRooms = Math.max(
          0,
          Number(
            item.availableRooms ??
              roomTotal - bookedRooms
          )
        );

        const roomPrice = Number(
          item.price ??
            item.basePrice ??
            item.roomPrice ??
            roomBasePrice
        );

        const dayRevenue =
          bookedRooms * roomPrice;

        totalRevenue += dayRevenue;
        totalBooked += bookedRooms;
        totalRoomNights += roomTotal;

        if (!inventoryByDate[dateKey]) {
          inventoryByDate[dateKey] = {
            date: item.date,
            bookedRooms: 0,
            availableRooms: 0,
            totalRooms: 0,
            revenue: 0,
            surgeFactor: 1,
            closed: false,
          };
        }

        inventoryByDate[dateKey].bookedRooms +=
          bookedRooms;

        inventoryByDate[dateKey].availableRooms +=
          availableRooms;

        inventoryByDate[dateKey].totalRooms +=
          roomTotal;

        inventoryByDate[dateKey].revenue +=
          dayRevenue;

        inventoryByDate[dateKey].surgeFactor =
          Math.max(
            inventoryByDate[dateKey].surgeFactor,
            Number(item.surgeFactor || 1)
          );

        inventoryByDate[dateKey].closed =
          inventoryByDate[dateKey].closed ||
          Boolean(item.closed);
      });
    });

    const inventory = Object.values(
      inventoryByDate
    ).sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    const averageRoomPrice =
      totalBooked > 0
        ? totalRevenue / totalBooked
        : 0;

    const occupancy =
      totalRoomNights > 0
        ? (totalBooked / totalRoomNights) * 100
        : 0;

    const daily = inventory.map((day) => {
      const dayTotalRooms = Number(
        day.totalRooms || 0
      );

      const bookedRooms = Number(
        day.bookedRooms || 0
      );

      const dayOccupancy =
        dayTotalRooms > 0
          ? (bookedRooms / dayTotalRooms) * 100
          : 0;

      return {
        ...day,
        occupancy: dayOccupancy,
        revenue: Number(day.revenue || 0),
      };
    });

    const activeDays = daily.filter(
      (day) => !day.closed
    );

    const weakDays = [...activeDays]
      .sort(
        (a, b) =>
          a.occupancy - b.occupancy
      )
      .slice(0, 5);

    const bestDays = [...activeDays]
      .sort(
        (a, b) =>
          b.occupancy - a.occupancy
      )
      .slice(0, 5);

    const maxDailyBookings = Math.max(
      ...daily.map(
        (day) =>
          Number(day.bookedRooms || 0)
      ),
      1
    );

    const revPAR =
      totalRoomNights > 0
        ? totalRevenue / totalRoomNights
        : 0;

    return {
      inventory,
      totalRooms,
      totalBooked,
      totalRoomNights,
      averageRoomPrice,
      totalRevenue,
      estimatedRevenue: totalRevenue,
      occupancy,
      revPAR,
      daily,
      weakDays,
      bestDays,
      maxDailyBookings,
    };
  }, [rooms, roomInventories]);

  useEffect(() => {
    if (roomsLoading) return;

    if (rooms.length > 0 && inventoryLoading) {
      return;
    }

    onData?.({
      hotel,
      rooms,
      ...analytics,
    });
  }, [
    hotel,
    rooms,
    analytics,
    onData,
    roomsLoading,
    inventoryLoading,
  ]);

  const roomFetchers = rooms.map((room) => (
    <RoomInventoryFetcher
      key={room._id}
      room={room}
      onInventory={handleRoomInventory}
    />
  ));

  const isLoading =
    roomsLoading || inventoryLoading;

  const isError = roomsError;

  if (isLoading) {
    return (
      <>
        {roomFetchers}

        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />

            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />

              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        {roomFetchers}

        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Could not load {hotel.name} analytics
              </p>

              <p className="mt-1 text-sm opacity-80">
                Could not load room information.
                Please try again later.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const {
    inventory,
    totalRooms,
    totalBooked,
    averageRoomPrice,
    totalRevenue,
    occupancy,
    weakDays,
    bestDays,
    maxDailyBookings,
  } = analytics;

  return (
    <>
      {roomFetchers}

      <article className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                {hotel.photos?.[0] ? (
                  <img
                    src={hotel.photos[0]}
                    alt={hotel.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-rose-400">
                    <Hotel className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-gray-900 dark:text-gray-100">
                  {hotel.name}
                </h3>

                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {hotel.city}
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setExpanded((value) => !value)
              }
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-rose-950/20"
            >
              {expanded
                ? "Hide Details"
                : "View Details"}

              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <>
            <div className="grid gap-px border-b border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                icon={Wallet}
                label="Room Revenue"
                value={formatCurrency(
                  totalRevenue
                )}
                iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
              />

              <Metric
                icon={BedDouble}
                label="Rooms Booked"
                value={formatNumber(totalBooked)}
                iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
              />

              <Metric
                icon={Hotel}
                label="Total Rooms"
                value={formatNumber(totalRooms)}
                iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
              />

              <Metric
                icon={Percent}
                label="Occupancy"
                value={`${occupancy.toFixed(1)}%`}
                iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
              />
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-3 sm:p-6">
              <div className="lg:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">
                      Daily Booking Performance
                    </h4>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Booked rooms vs available inventory
                    </p>
                  </div>

                  <div className="hidden items-center gap-3 text-xs text-gray-500 sm:flex">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Booked
                    </span>

                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" />
                      Available
                    </span>
                  </div>
                </div>

                {inventory.length === 0 ? (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400 dark:border-gray-800">
                    No inventory data available
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div
                      className="flex min-w-162.5 items-end gap-2"
                      style={{
                        height: "270px",
                      }}
                    >
                      {inventory.map((day) => {
                        const bookedHeight =
                          (day.bookedRooms /
                            maxDailyBookings) *
                          190;

                        const availableHeight =
                          (day.availableRooms /
                            Math.max(
                              day.totalRooms,
                              1
                            )) *
                          190;

                        const safeBookedHeight =
                          Math.min(
                            190,
                            Math.max(
                              0,
                              bookedHeight
                            )
                          );

                        const safeAvailableHeight =
                          Math.min(
                            190,
                            Math.max(
                              0,
                              availableHeight
                            )
                          );

                        return (
                          <div
                            key={getDateKey(
                              day.date
                            )}
                            className="flex min-w-8.5 flex-1 flex-col items-center justify-end"
                          >
                            <div className="mb-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                              {day.bookedRooms}
                            </div>

                            <div className="flex h-47.5 w-full max-w-7 flex-col justify-end overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                              {day.availableRooms >
                                0 && (
                                <div
                                  className="w-full bg-gray-200 transition-all dark:bg-gray-700"
                                  style={{
                                    height: `${Math.max(
                                      safeAvailableHeight,
                                      4
                                    )}px`,
                                  }}
                                  title={`${day.availableRooms} available`}
                                />
                              )}

                              {day.bookedRooms >
                                0 && (
                                <div
                                  className="w-full bg-rose-500 transition-all hover:bg-rose-600"
                                  style={{
                                    height: `${Math.max(
                                      safeBookedHeight,
                                      4
                                    )}px`,
                                  }}
                                  title={`${day.bookedRooms} booked`}
                                />
                              )}
                            </div>

                            <div className="mt-2 text-center">
                              <div className="text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                {getDayName(
                                  day.date
                                )}
                              </div>

                              <div className="text-[9px] text-gray-400">
                                {getDateLabel(
                                  day.date
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-800/50">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm dark:bg-gray-900">
                    <IndianRupee className="h-5 w-5" />
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">
                      Pricing
                    </h4>

                    <p className="text-xs text-gray-500">
                      Current room pricing
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room._id}
                      className="flex items-center justify-between rounded-xl bg-white p-3 dark:bg-gray-900"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {room.type}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          {room.totalCount} rooms
                        </p>
                      </div>

                      <p className="ml-3 shrink-0 text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          room.basePrice
                        )}
                      </p>
                    </div>
                  ))}

                  {rooms.length === 0 && (
                    <p className="py-4 text-center text-xs text-gray-400">
                      No rooms found
                    </p>
                  )}
                </div>

                {rooms.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Actual Avg. Room Price
                      </span>

                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          averageRoomPrice
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5 border-t border-gray-100 p-5 dark:border-gray-800 sm:p-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 dark:border-amber-900/30 dark:bg-amber-950/10">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm dark:bg-gray-900">
                      <TrendingDown className="h-5 w-5" />
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100">
                        Weak Booking Days
                      </h4>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Days that need more bookings
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    NEED ATTENTION
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {weakDays.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">
                      No weak days found
                    </p>
                  ) : (
                    weakDays.map((day) => (
                      <DayRow
                        key={getDateKey(
                          day.date
                        )}
                        day={day}
                        type="weak"
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/10">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm dark:bg-gray-900">
                      <TrendingUp className="h-5 w-5" />
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100">
                        Best Booking Days
                      </h4>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Your strongest performing days
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    TOP DAYS
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {bestDays.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">
                      No booking data found
                    </p>
                  ) : (
                    bestDays.map((day) => (
                      <DayRow
                        key={getDateKey(
                          day.date
                        )}
                        day={day}
                        type="best"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </article>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric Component                                                           */
/* -------------------------------------------------------------------------- */

function Metric({
  icon: Icon,
  label,
  value,
  iconClass,
}) {
  return (
    <div className="bg-white p-5 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-1 truncate text-lg font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Day Row                                                                    */
/* -------------------------------------------------------------------------- */

function DayRow({ day, type }) {
  const isWeak = type === "weak";

  return (
    <div className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-3 dark:bg-gray-900/70">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isWeak
              ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          }`}
        >
          {isWeak ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {getDayName(day.date)}
          </p>

          <p className="text-[11px] text-gray-400">
            {getDateLabel(day.date)}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {day.bookedRooms} booked
        </p>

        <p className="text-[11px] text-gray-400">
          {day.occupancy.toFixed(0)}% occupancy
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function OwnerAnalyticsPage() {
  const {
    data: hotels = [],
    isLoading,
    isError,
    error,
  } = useGetOwnerHotelsQuery();

  /*
   * Analytics from each hotel.
   *
   * {
   *   hotelId: {
   *      hotel,
   *      totalBooked,
   *      estimatedRevenue,
   *      ...
   *   }
   * }
   */
  const [hotelAnalytics, setHotelAnalytics] =
    useState({});

  /*
   * Stable callback is not strictly necessary here,
   * but prevents unnecessary effect executions.
   */
  const handleHotelData = (data) => {
    setHotelAnalytics((previous) => {
      const current =
        previous[data.hotel._id];

      /*
       * Don't update if important values didn't change.
       */
      if (
        current &&
        current.estimatedRevenue ===
          data.estimatedRevenue &&
        current.totalBooked ===
          data.totalBooked &&
        current.totalRooms ===
          data.totalRooms &&
        current.occupancy ===
          data.occupancy
      ) {
        return previous;
      }

      return {
        ...previous,
        [data.hotel._id]: data,
      };
    });
  };

  /*
   * --------------------------------------------------------------
   * Global summary
   * --------------------------------------------------------------
   */

  const summary = useMemo(() => {
    const values =
      Object.values(hotelAnalytics);

    const totalRevenue = values.reduce(
      (sum, hotel) =>
        sum +
        Number(
          hotel.estimatedRevenue || 0
        ),
      0
    );

    const totalBooked = values.reduce(
      (sum, hotel) =>
        sum +
        Number(hotel.totalBooked || 0),
      0
    );

    const totalRooms = values.reduce(
      (sum, hotel) =>
        sum +
        Number(hotel.totalRooms || 0),
      0
    );

    const totalRoomNights = values.reduce(
      (sum, hotel) =>
        sum +
        Number(
          hotel.totalRoomNights || 0
        ),
      0
    );

    const occupancy =
      totalRoomNights > 0
        ? (totalBooked /
            totalRoomNights) *
          100
        : 0;

    const sortedHotels = [...values].sort(
      (a, b) =>
        Number(
          b.estimatedRevenue || 0
        ) -
        Number(
          a.estimatedRevenue || 0
        )
    );

    return {
      totalRevenue,
      totalBooked,
      totalRooms,
      totalRoomNights,
      occupancy,
      sortedHotels,
    };
  }, [hotelAnalytics]);

  const strongestHotel =
    summary.sortedHotels[0];

  /*
   * --------------------------------------------------------------
   * Loading
   * --------------------------------------------------------------
   */

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  /*
   * --------------------------------------------------------------
   * Error
   * --------------------------------------------------------------
   */

  if (isError) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Analytics
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Understand your hotel performance and
            revenue.
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />

            <div>
              <p className="font-bold">
                Analytics loading error
              </p>

              <p className="mt-1 text-sm">
                {error?.data?.message ||
                  "Could not load your hotel analytics."}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-10">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            <TrendingUp className="h-3.5 w-3.5" />
            PERFORMANCE OVERVIEW
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Analytics
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track revenue, bookings, occupancy and
            discover which days need attention.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <CalendarDays className="h-4 w-4 text-rose-500" />
          Inventory Performance
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Global Summary                                                     */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={IndianRupee}
          label="Total Estimated Revenue"
          value={formatCurrency(
            summary.totalRevenue
          )}
          description="Across all properties"
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
        />

        <SummaryCard
          icon={BedDouble}
          label="Rooms Booked"
          value={formatNumber(
            summary.totalBooked
          )}
          description="Total booked room nights"
          iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
        />

        <SummaryCard
          icon={Hotel}
          label="Room Inventory"
          value={formatNumber(
            summary.totalRooms
          )}
          description={`${hotels.length} ${
            hotels.length === 1
              ? "property"
              : "properties"
          }`}
          iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
        />

        <SummaryCard
          icon={Percent}
          label="Overall Occupancy"
          value={`${summary.occupancy.toFixed(
            1
          )}%`}
          description="Based on inventory"
          iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Top Hotel                                                          */}
      {/* ------------------------------------------------------------------ */}

      {strongestHotel && (
        <div className="overflow-hidden rounded-3xl border border-rose-100 bg-linear-to-r from-rose-50 via-white to-amber-50 p-5 shadow-sm dark:border-rose-900/30 dark:from-rose-950/20 dark:via-gray-900 dark:to-amber-950/10 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20">
                <TrendingUp className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  Top Revenue Property
                </p>

                <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                  {strongestHotel.hotel.name}
                </h3>

                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {formatNumber(
                    strongestHotel.totalBooked
                  )}{" "}
                  rooms booked
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                {formatCurrency(
                  strongestHotel.estimatedRevenue
                )}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Estimated revenue
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Hotel Ranking                                                      */}
      {/* ------------------------------------------------------------------ */}

      {summary.sortedHotels.length > 0 && (
        <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-5">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Property Revenue Ranking
            </h3>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              See which properties are generating
              the most estimated revenue.
            </p>
          </div>

          <div className="space-y-4">
            {summary.sortedHotels.map(
              (item, index) => {
                const maxRevenue =
                  summary.sortedHotels[0]
                    ?.estimatedRevenue || 1;

                const percentage =
                  (Number(
                    item.estimatedRevenue || 0
                  ) /
                    maxRevenue) *
                  100;

                return (
                  <div
                    key={item.hotel._id}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                            index === 0
                              ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          #{index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-200">
                            {item.hotel.name}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            {formatNumber(
                              item.totalBooked
                            )}{" "}
                            rooms booked
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-black text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          item.estimatedRevenue
                        )}
                      </p>
                    </div>

                    <div className="ml-11 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-700"
                        style={{
                          width: `${Math.max(
                            percentage,
                            2
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Individual Hotel Analytics                                         */}
      {/* ------------------------------------------------------------------ */}

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Hotel Performance
            </h3>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Detailed booking and inventory
              analytics for each property.
            </p>
          </div>

          <span className="hidden rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400 sm:inline-flex">
            {hotels.length} properties
          </span>
        </div>

        {hotels.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <Hotel className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700" />

            <h3 className="mt-4 font-bold text-gray-900 dark:text-gray-100">
              No hotels found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add a property to start seeing
              analytics.
            </p>
          </div>
        ) : (
          hotels.map((hotel) => (
            <HotelAnalytics
              key={hotel._id}
              hotel={hotel}
              onData={handleHotelData}
            />
          ))
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Revenue Disclaimer                                                 */}
      {/* ------------------------------------------------------------------ */}

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/30 dark:bg-blue-950/10">
        <div className="flex gap-3">
          <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />

          <div>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
              Revenue calculation
            </p>

            <p className="mt-1 text-xs leading-relaxed text-blue-600/80 dark:text-blue-400/70">
              Revenue shown here is estimated using
              booked room nights × weighted average
              room base price. For exact revenue, use
              the final amount from your
              booking/payment records.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary Card                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-gray-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading Skeleton                                                           */
/* -------------------------------------------------------------------------- */

function AnalyticsSkeleton() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />

        <div className="h-4 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>

      <div className="h-28 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />

      <div className="h-64 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />

      {[1, 2].map((item) => (
        <div
          key={item}
          className="h-96 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800"
        />
      ))}
    </section>
  );
}