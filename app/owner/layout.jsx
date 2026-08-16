"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useLazyGetProfileQuery } from "@/lib/api";
import ThemeToggle from "@/utils/Theme/ThemeToggle";
import { LayoutDashboard, Hotel, User, Home, ShieldAlert, ChartNoAxesCombined } from "lucide-react";

import { useAuth } from "@/utils/useAuth";

export default function OwnerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");
  const [fetchProfile] = useLazyGetProfileQuery();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const verifyOwner = async () => {
      try {
        setStatus("checking");
        setError("");

        const user = await fetchProfile().unwrap();

        if (!user) {
          router.replace("/login");
          return;
        }

        if (user.role !== "owner") {
          router.replace("/");
          return;
        }

        setStatus("allowed");
      } catch (err) {
        setError(err?.data?.message || "Could not verify your account.");
        setStatus("error");
      }
    };

    verifyOwner();
  }, [pathname, router, fetchProfile, isAuthenticated, isLoading]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          <span className="text-sm font-medium tracking-wide">Verifying owner credentials...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-900 p-6 shadow-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Access Check Failed</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 transition shadow-sm hover:shadow active:scale-95"
            >
              Back to Login
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTabActive = (path) => {
    if (path === "/owner") {
      return pathname === "/owner";
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/owner" className="flex items-center gap-2 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200">
                <Hotel className="h-5 w-5" />
              </span>
              <span className="font-bold text-lg bg-rose-500 bg-clip-text text-transparent tracking-tight">
                Aman Inns Owner
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/owner"
                className={`flex items-center gap-1.5 px-3 py-1.75 rounded-full transition-all duration-200 ${
                  isTabActive("/owner") && !pathname.startsWith("/owner/hotels")
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/50"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/owner/hotels"
                className={`flex items-center gap-1.5 px-3 py-1.75 rounded-full transition-all duration-200 ${
                  isTabActive("/owner/hotels")
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/50"
                }`}
              >
                <Hotel className="h-4 w-4" />
                My Hotels
              </Link>

               <Link
                href="/owner/analytics"
                className={`flex items-center gap-1.5 px-3 py-1.75 rounded-full transition-all duration-200 ${
                  isTabActive("/owner/analytics")
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/50"
                }`}
              >
                <ChartNoAxesCombined className="h-4 w-4" />
                Analytics
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Website</span>
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white transition active:scale-95 shadow-sm"
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </Link>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-gray-100 dark:border-gray-800/50 px-4 py-2 bg-white/50 dark:bg-gray-900/50">
          <Link
            href="/owner"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-medium ${
              isTabActive("/owner") && !pathname.startsWith("/owner/hotels")
                ? "text-rose-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            Dashboard
          </Link>
          <Link
            href="/owner/hotels"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-medium ${
              isTabActive("/owner/hotels")
                ? "text-rose-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Hotel className="h-4.5 w-4.5" />
            My Hotels
          </Link>

           <Link
                href="/owner/analytics"
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-medium ${
                  isTabActive("/owner/analytics")
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-100 hover:bg-gray-100/60 dark:hover:bg-gray-800/50"
                }`}
              >
                <ChartNoAxesCombined className="h-4 w-4" />
                Analytics
              </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
