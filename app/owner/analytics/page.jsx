"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Hotel,
  IndianRupee,
  MapPin,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  useGetOwnerHotelAnalyticsQuery,
  useGetOwnerHotelsQuery,
} from "@/lib/api";
import { getAnalyticsDateRange } from "@/utils/analytics"

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const RANGE_OPTIONS = [
  {
    value: "7d",
    label: "7 Days",
  },
  {
    value: "30d",
    label: "30 Days",
  },
  {
    value: "3m",
    label: "3 Months",
  },
  {
    value: "1y",
    label: "1 Year",
  },
];

/* -------------------------------------------------------------------------- */
/* Formatters                                                                 */
/* -------------------------------------------------------------------------- */

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const formatPercentage = (value, digits = 1) =>
  `${(Number(value) || 0).toFixed(digits)}%`;

const formatDate = (date, options = {}) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    ...options,
  });
};

const formatDay = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-IN", {
    weekday: "short",
  });
};

const getDateKey = (date) => {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().split("T")[0];
};

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function OwnerAnalyticsPage() {
  const [range, setRange] = useState("7d");

  const {
    data: hotelsResponse = [],
    isLoading: hotelsLoading,
    isError: hotelsError,
    error: hotelsErrorData,
  } = useGetOwnerHotelsQuery();

  const hotels = Array.isArray(hotelsResponse)
    ? hotelsResponse
    : hotelsResponse?.hotels ||
      hotelsResponse?.data ||
      [];

  if (hotelsLoading) {
    return <AnalyticsSkeleton />;
  }

  if (hotelsError) {
    return (
      <AnalyticsError
        message={
          hotelsErrorData?.data?.message ||
          "Could not load your hotels."
        }
      />
    );
  }

  return (
    <section className="space-y-6 pb-10">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">
            Business analytics
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            Performance overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Monitor revenue, bookings, occupancy and inventory
            performance across your properties.
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Reporting period
          </span>

          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {RANGE_OPTIONS.map((option) => {
              const active = range === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none ${
                    active
                      ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Range indicator                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <CalendarDays className="h-4 w-4" />

        <span>
          Showing analytics for{" "}
          <strong className="font-semibold text-gray-700 dark:text-gray-200">
            {
              RANGE_OPTIONS.find(
                (item) => item.value === range
              )?.label
            }
          </strong>
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* No Hotels                                                           */}
      {/* ------------------------------------------------------------------ */}

      {hotels.length === 0 ? (
        <EmptyHotels />
      ) : (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* Hotel Analytics                                                  */}
          {/* ---------------------------------------------------------------- */}

          <div className="space-y-5">
            {hotels.map((hotel) => (
              <HotelAnalytics
                key={hotel._id}
                hotel={hotel}
                range={range}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Hotel Analytics                                                            */
/* -------------------------------------------------------------------------- */

function HotelAnalytics({ hotel, range }) {
  const [expanded, setExpanded] = useState(true);

  /*
   * IMPORTANT:
   *
   * This assumes your RTK Query endpoint accepts:
   *
   * useGetOwnerHotelAnalyticsQuery({
   *   hotelId: hotel._id,
   *   range,
   * })
   *
   * and the backend returns:
   *
   * {
   *   success: true,
   *   analytics: {...}
   * }
   */

   const { from, to } = useMemo(
    () => getAnalyticsDateRange(range),
    [range]
  );

const {
  data: analytics,
  isLoading,
  isFetching,
  isError,
  error,
} = useGetOwnerHotelAnalyticsQuery({
  hotelId: hotel._id,
  from,
  to,
});

  if (isLoading) {
    return <HotelAnalyticsSkeleton />;
  }

  if (isError || !analytics) {
    return (
      <AnalyticsError
        compact
        message={
          error?.data?.message ||
          `Could not load analytics for ${hotel.name}.`
        }
      />
    );
  }

  const {
    hotel: analyticsHotel = hotel,
    rooms = [],
    summary = {},
    daily = [],
    weakDays = [],
    bestDays = [],
  } = analytics;

  const {
    totalRevenue = 0,
    estimatedRevenue = 0,
    totalBookings = 0,
    totalBooked = 0,
    totalRooms = 0,
    totalRoomNights = 0,
    occupancy = 0,
    averageRoomPrice = 0,
    revPAR = 0,
  } = summary;

  const displayRevenue =
    Number(totalRevenue) || Number(estimatedRevenue) || 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* ------------------------------------------------------------------ */}
      {/* Hotel Header                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              {analyticsHotel?.photos?.[0] ? (
                <img
                  src={analyticsHotel.photos[0]}
                  alt={analyticsHotel.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <Hotel className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-950 dark:text-white sm:text-lg">
                {analyticsHotel?.name || hotel.name}
              </h2>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <MapPin className="h-3.5 w-3.5" />

                {analyticsHotel?.city || hotel.city}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isFetching && !isLoading && (
              <span className="text-xs text-gray-400">
                Updating...
              </span>
            )}

            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {expanded ? "Collapse" : "Details"}

              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* Primary KPIs                                                     */}
          {/* ---------------------------------------------------------------- */}

          <div className="grid border-b border-gray-100 dark:border-gray-800 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={IndianRupee}
              label="Revenue"
              value={formatCurrency(displayRevenue)}
              secondary={`${formatCurrency(
                revPAR
              )} RevPAR`}
            />

            <Kpi
              icon={CalendarDays}
              label="Bookings"
              value={formatNumber(totalBookings)}
              secondary={`${formatNumber(
                totalBooked
              )} room nights`}
            />

            <Kpi
              icon={Percent}
              label="Occupancy"
              value={formatPercentage(occupancy)}
              secondary={`${formatNumber(
                totalRoomNights
              )} room nights`}
            />

            <Kpi
              icon={Wallet}
              label="Average room price"
              value={formatCurrency(averageRoomPrice)}
              secondary="Weighted average"
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Revenue / Occupancy Overview                                     */}
          {/* ---------------------------------------------------------------- */}

          <div className="grid gap-5 border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6 lg:grid-cols-[1.7fr_1fr]">
            <PerformanceChart
              daily={daily}
            />

            <InventoryOverview
              totalRooms={totalRooms}
              totalBooked={totalBooked}
              occupancy={occupancy}
              revPAR={revPAR}
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Room Mix                                                          */}
          {/* ---------------------------------------------------------------- */}

          <RoomBreakdown rooms={rooms} />

          {/* ---------------------------------------------------------------- */}
          {/* Best / Weak Days                                                  */}
          {/* ---------------------------------------------------------------- */}

          <div className="grid gap-5 border-t border-gray-100 p-5 dark:border-gray-800 sm:p-6 lg:grid-cols-2">
            <PerformanceDays
              title="Best performing days"
              description="Highest occupancy during this period"
              days={bestDays}
              type="best"
            />

            <PerformanceDays
              title="Lowest performing days"
              description="Days with the most available inventory"
              days={weakDays}
              type="weak"
            />
          </div>
        </>
      )}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* KPI                                                                         */
/* -------------------------------------------------------------------------- */

function Kpi({
  icon: Icon,
  label,
  value,
  secondary,
}) {
  return (
    <div className="border-b border-gray-100 p-5 last:border-b-0 dark:border-gray-800 sm:border-r sm:last:border-r-0 lg:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-2 text-xl font-semibold tracking-tight text-gray-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            {secondary}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Performance Chart                                                          */
/* -------------------------------------------------------------------------- */

function PerformanceChart({ daily }) {
  const maxRevenue = Math.max(
    ...daily.map((day) => Number(day.revenue) || 0),
    1
  );

  const maxOccupancy = Math.max(
    ...daily.map((day) => Number(day.occupancy) || 0),
    1
  );

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
            Daily performance
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Revenue and occupancy across the selected period.
          </p>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Revenue
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
            Occupancy
          </span>
        </div>
      </div>

      {daily.length === 0 ? (
        <EmptyChart />
      ) : (
        <div className="overflow-x-auto">
          <div
            className="flex min-w-[620px] items-end gap-2"
            style={{ height: 270 }}
          >
            {daily.map((day) => {
              const revenue = Number(day.revenue) || 0;
              const occupancy =
                Number(day.occupancy) || 0;

              const revenueHeight =
                (revenue / maxRevenue) * 180;

              const occupancyHeight =
                (occupancy / maxOccupancy) * 180;

              return (
                <div
                  key={getDateKey(day.date)}
                  className="flex min-w-11 flex-1 flex-col items-center justify-end"
                >
                  <div className="mb-2 text-center">
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(revenue)}
                    </p>
                  </div>

                  <div className="flex h-[180px] w-full max-w-8 items-end gap-1">
                    <div
                      className="w-1/2 rounded-t-sm bg-rose-500 transition-all"
                      style={{
                        height: `${Math.max(
                          revenueHeight,
                          revenue > 0 ? 4 : 0
                        )}px`,
                      }}
                      title={`Revenue: ${formatCurrency(
                        revenue
                      )}`}
                    />

                    <div
                      className="w-1/2 rounded-t-sm bg-gray-300 dark:bg-gray-600"
                      style={{
                        height: `${Math.max(
                          occupancyHeight,
                          occupancy > 0 ? 4 : 0
                        )}px`,
                      }}
                      title={`Occupancy: ${formatPercentage(
                        occupancy
                      )}`}
                    />
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                      {formatDay(day.date)}
                    </p>

                    <p className="mt-0.5 text-[9px] text-gray-400">
                      {formatDate(day.date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Inventory Overview                                                         */
/* -------------------------------------------------------------------------- */

function InventoryOverview({
  totalRooms,
  totalBooked,
  occupancy,
  revPAR,
}) {
  const availableRooms = Math.max(
    Number(totalRooms) - Number(totalBooked),
    0
  );

  const occupancyValue = Math.min(
    Math.max(Number(occupancy) || 0, 0),
    100
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-800/30">
      <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
        Inventory utilisation
      </h3>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Current room utilisation for the selected period.
      </p>

      <div className="mt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">
              {formatPercentage(occupancy)}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Occupancy
            </p>
          </div>

          <Percent className="h-5 w-5 text-gray-400" />
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-500"
            style={{
              width: `${occupancyValue}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <MiniStat
          label="Total rooms"
          value={formatNumber(totalRooms)}
        />

        <MiniStat
          label="Booked"
          value={formatNumber(totalBooked)}
        />

        <MiniStat
          label="Available"
          value={formatNumber(availableRooms)}
        />

        <MiniStat
          label="RevPAR"
          value={formatCurrency(revPAR)}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Room Breakdown                                                             */
/* -------------------------------------------------------------------------- */

function RoomBreakdown({ rooms }) {
  if (!rooms?.length) {
    return null;
  }

  const totalInventory = rooms.reduce(
    (sum, room) =>
      sum + Number(room.totalCount || 0),
    0
  );

  return (
    <div className="border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
          Room inventory
        </h3>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Room types, pricing and inventory distribution.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rooms.map((room) => {
          const count = Number(room.totalCount || 0);

          const share =
            totalInventory > 0
              ? (count / totalInventory) * 100
              : 0;

          return (
            <div
              key={room._id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {room.photos?.[0]?.url ? (
                  <img
                    src={room.photos[0].url}
                    alt={room.type}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <BedDouble className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {room.type}
                  </p>

                  <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(room.basePrice)}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>
                    {formatNumber(count)} rooms
                  </span>

                  <span>
                    {share.toFixed(0)}% of inventory
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gray-400 dark:bg-gray-500"
                    style={{
                      width: `${share}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Best / Weak Days                                                           */
/* -------------------------------------------------------------------------- */

function PerformanceDays({
  title,
  description,
  days,
  type,
}) {
  const isBest = type === "best";

  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isBest
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
          }`}
        >
          {isBest ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      {!days?.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-400 dark:border-gray-800">
          No data available for this period.
        </div>
      ) : (
        <div className="space-y-2">
          {days.slice(0, 5).map((day) => (
            <div
              key={getDateKey(day.date)}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800"
            >
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {formatDay(day.date)},{" "}
                  {formatDate(day.date)}
                </p>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  {formatNumber(day.bookedRooms)} booked
                  {" · "}
                  {formatNumber(day.availableRooms)} available
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    isBest
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {formatPercentage(day.occupancy)}
                </p>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  {formatCurrency(day.revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mini Stat                                                                  */
/* -------------------------------------------------------------------------- */

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty Chart                                                                */
/* -------------------------------------------------------------------------- */

function EmptyChart() {
  return (
    <div className="flex h-[270px] items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
      <div className="text-center">
        <CalendarDays className="mx-auto h-6 w-6 text-gray-300 dark:text-gray-700" />

        <p className="mt-2 text-xs text-gray-400">
          No daily data available for this period.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty Hotels                                                               */
/* -------------------------------------------------------------------------- */

function EmptyHotels() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
      <Hotel className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700" />

      <h2 className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
        No properties found
      </h2>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Add a hotel to start tracking performance.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Analytics Error                                                            */
/* -------------------------------------------------------------------------- */

function AnalyticsError({
  message,
  compact = false,
}) {
  return (
    <div
      className={`rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />

        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            Unable to load analytics
          </p>

          <p className="mt-1 text-xs leading-5 text-red-600/80 dark:text-red-400/80">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hotel Skeleton                                                             */
/* -------------------------------------------------------------------------- */

function HotelAnalyticsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />

        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />

          <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse bg-gray-50 dark:bg-gray-800/30" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page Skeleton                                                              */
/* -------------------------------------------------------------------------- */

function AnalyticsSkeleton() {
  return (
    <section className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />

          <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />

          <div className="h-4 w-80 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>

        <div className="h-10 w-80 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>

      <HotelAnalyticsSkeleton />
    </section>
  );
}