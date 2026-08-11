"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGetProfileQuery, useGetOwnerHotelsQuery } from "@/lib/api";
import { Hotel, Plus, ShieldCheck, ShieldAlert, Sparkles, ArrowRight, Building, HelpCircle } from "lucide-react";

export default function OwnerDashboardPage() {
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
  } = useGetProfileQuery();

  const {
    data: hotels = [],
    isLoading: isHotelsLoading,
    isError: isHotelsError,
    error: hotelsError,
  } = useGetOwnerHotelsQuery();

  const loading = isProfileLoading || isHotelsLoading;
  const error =
    isProfileError || isHotelsError
      ? profileError?.data?.message ||
        hotelsError?.data?.message ||
        "Failed to load dashboard."
      : "";

  const total = hotels.length;

  const active = useMemo(() => {
    return hotels.filter((h) => h.active).length;
  }, [hotels]);

  const inactive = total - active;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-44 rounded-3xl bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-800" />
        {/* Stats Skeletons */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-800" />
          <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-800" />
          <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-900 border border-gray-100 dark:border-gray-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-5 text-red-700 dark:text-red-400">
        <div className="flex gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Dashboard error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 p-6 md:p-8 shadow-sm">
        {/* Decorative background gradients */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <Sparkles className="h-3 w-3" />
              Owner Console
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Welcome, {profile?.name || "Owner"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Manage your hotel properties, add room selections, toggle visibility status, and analyze bookings from one unified space.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/owner/hotels"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 text-white px-5 py-2.5 text-sm font-semibold hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/15 hover:shadow-rose-500/25 transition-all duration-200 active:scale-95"
            >
              <Building className="h-4 w-4" />
              Manage Hotels
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/owner/hotels/new"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all duration-200 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add New Hotel
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Hotels */}
        <div className="group relative rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hotels</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
              <Hotel className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{total}</span>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Listed properties under your account</p>
          </div>
        </div>

        {/* Active Hotels */}
        <div className="group relative rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Hotels</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{active}</span>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Properties live & bookable online</p>
          </div>
        </div>

        {/* Inactive Hotels */}
        <div className="group relative rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Hotels</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200">
              <ShieldAlert className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-amber-600 dark:text-amber-500">{inactive || 0}</span>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Properties set as offline or drafts</p>
          </div>
        </div>
      </div>

      {/* Helpful Hint Section */}
      <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/40 p-4 flex gap-3 text-sm">
        <HelpCircle className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
        <div className="text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-800 dark:text-gray-200">Need help?</span> To launch a property, first add a hotel listing, add at least two photos of a room, and click <span className="font-semibold text-gray-800 dark:text-gray-200">Activate</span>. Active properties will appear instantly on the homepage search list for travelers.
        </div>
      </div>
    </section>
  );
}
