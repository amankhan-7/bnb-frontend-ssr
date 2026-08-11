"use client";

import Link from "next/link";
import { useGetOwnerHotelsQuery } from "@/lib/api";
import { MapPin, Plus, Hotel, ArrowRight, Eye, ShieldCheck, ShieldAlert } from "lucide-react";

export default function OwnerHotelsPage() {
  const {
    data: hotels = [],
    isLoading,
    isError,
    error,
  } = useGetOwnerHotelsQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 overflow-hidden shadow-sm animate-pulse"
            >
              <div className="h-44 bg-gray-200 dark:bg-gray-800" />
              <div className="p-5 space-y-3">
                <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-5 text-red-700 dark:text-red-400">
        <div className="flex gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Hotels loading error</p>
            <p className="text-sm mt-1">
              {error?.data?.message || "Could not load your hotels."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">My Properties</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You have {hotels.length} listed {hotels.length === 1 ? "property" : "properties"}
          </p>
        </div>
        <Link
          href="/owner/hotels/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 text-white px-4.5 py-2.5 text-sm font-semibold hover:from-rose-600 hover:to-pink-600 transition shadow-md shadow-rose-500/10 hover:shadow-rose-500/20 active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Hotel
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center space-y-4 max-w-md mx-auto mt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
            <Hotel className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">No properties found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
            You haven&apos;t listed any hotels yet. Get started by adding your first hotel.
            </p>
          </div>
          <Link
            href="/owner/hotels/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-rose-600 transition"
          >
            Create Your First Hotel
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => {
            const hasPhoto = hotel.photos && hotel.photos.length > 0;
            const photoUrl = hasPhoto ? hotel.photos[0] : null;

            return (
              <article
                key={hotel._id}
                className="group relative rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={hotel.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/20 dark:to-amber-950/20 flex flex-col items-center justify-center text-rose-400 dark:text-rose-600 gap-1.5">
                      <Hotel className="h-10 w-10 opacity-70" />
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-60">No Cover Image</span>
                    </div>
                  )}

                  {/* Badges Overlaid on Image */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md ${
                        hotel.active
                          ? "bg-emerald-500 opacity-80 text-white"
                          : "bg-amber-500/90 opacity-90 text-white"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full bg-white ${hotel.active ? "animate-pulse" : ""}`} />
                      {hotel.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-rose-500 transition-colors duration-200 line-clamp-1">
                      {hotel.name || "Untitled Hotel"}
                    </h3>

                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="line-clamp-1">{hotel.city || "Unknown City"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/60 mt-4 pt-4">
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {hotel.amenities?.length || 0} amenities listed
                    </div>
                    <Link
                      href={`/owner/hotels/${hotel._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 transition"
                    >
                      Manage Property
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
