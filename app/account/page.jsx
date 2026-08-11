"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import background from "../../public/images/bg.jpg";
import { useAuth } from "../../utils/useAuth.js";
import {
  Pencil,
  LogOut,
  ArrowLeft,
  Mail,
  User,
  Lock,
  Shield,
  Home,
  AlertCircle,
} from "lucide-react";
import { useUpdateProfileMutation } from "@/lib/api";
import toast from "react-hot-toast";
import LoadingState from "@/components/loading";
import AuthGuard from "@/components/wrapper/AuthGuard";

export default function AccountPage() {
  const router = useRouter();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { user, accessToken, isAuthenticated, logout, isLoading } = useAuth();
  //console.log("user", user);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <LoadingState />;
  }

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Clean empty password so it is not updated unnecessarily
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      const updated = await updateProfile(payload).unwrap();

      await updateUser({
        ...authUser,
        user: {
          ...authUser.user,
          ...updated,
        },
      });

      setFormData({
        name: updated.name,
        email: updated.email,
        password: "***********",
      });

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      const msg =
        err?.data?.error || err?.data?.message || "Profile update failed";
      toast.error(msg);
    }
  };

  const startEditing = () => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
    });
    setIsEditing(true);
  };

  return (
    <AuthGuard redirectTo="/">
      <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Blurred background image */}
      <Image
        src={background}
        alt="background"
        fill
        priority
        className="object-cover opacity-40 dark:opacity-15 blur-[1px]"
      />
      <div className="absolute inset-0 bg-white/30 dark:bg-black/50 backdrop-blur-sm z-10" />

      {/* Main Container Card */}
      <div className="relative z-20 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-250/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/90 backdrop-blur-md transition-all">
        {/* Navigation & Actions Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => {
              if (user?.role === "owner") {
                router.push("/owner");
              } else {
                router.push("/");
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-850 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{user?.role === "owner" ? "Dashboard" : "Home"}</span>
          </button>

          {!isEditing && (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-250 dark:border-gray-800 text-xs font-bold text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 transition"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Details Block */}
        <div className="flex flex-col items-center text-center mt-2 space-y-4">
          {/* Avatar circle */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-rose-500/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-gray-900">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          {!isEditing ? (
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {user?.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          ) : (
            <div className="w-full text-left">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-center">
                Update Your Profile
              </h3>
            </div>
          )}

          {/* Role badge */}
          {!isEditing && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/30 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-sm uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5" />
              {user?.role}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200 dark:border-gray-800/60" />

        {/* Form Inputs (when editing) */}
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-450">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500/80 transition dark:text-white"
                />
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-450">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Your Email"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500/80 transition dark:text-white"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-450">
                New Password (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep same"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500/80 transition dark:text-white"
                />
              </div>
            </div>

            {/* Actions button block */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-rose-500 hover:bg-rose-600 text-white py-2.5 text-sm font-semibold shadow-md shadow-rose-500/10 transition active:scale-95 disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {/* Back to Homepage Button */}
            <button
              onClick={() => router.push("/")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 py-3 px-4 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition active:scale-98 cursor-pointer"
            >
              <Home className="h-4 w-4" />
              Go to Homepage
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-gray-100 hover:bg-gray-850 dark:hover:bg-white text-white dark:text-gray-900 py-3 px-4 font-bold text-sm transition active:scale-98 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </main>
    </AuthGuard>
    
  );
}
