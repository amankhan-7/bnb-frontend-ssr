"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useUpdateOwnerRoomMutation, useGetRoomByIdQuery } from "@/lib/api";
import uploadToCloudinary from "@/utils/uploadToCloudinary";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, UploadCloud, X, BedDouble, AlertCircle, Users } from "lucide-react";
import toast from "react-hot-toast";

const initialForm = {
  type: "",
  basePrice: "",
  amenities: "",
  totalCount: "",
  photos: [],
  capacity: {
    adults: 2,
    children: 0,
    infants: 0,
  },
};

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data: room, isLoading } = useGetRoomByIdQuery(roomId, {
    skip: !roomId,
  });

  const hotelId = room?.hotelId;

  const [updateOwnerRoom, { isLoading: submitting }] =
    useUpdateOwnerRoomMutation();

  useEffect(() => {
    if (!room) return;

    setImages(
      (room.photos || []).map((photo) => ({
        ...photo,
        isNew: false,
      })),
    );

    setForm({
      type: room.type || "",
      basePrice: room.basePrice ?? "",
      amenities: Array.isArray(room.amenities)
        ? room.amenities.join(", ")
        : room.amenities || "",
      totalCount: room.totalCount ?? "",
      capacity: {
        adults: room.capacity?.adults ?? 2,
        children: room.capacity?.children ?? 0,
        infants: room.capacity?.infants ?? 0,
      },
    });
  }, [room]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("capacity.")) {
      const key = name.split(".")[1];

      setForm((prev) => ({
        ...prev,
        capacity: {
          ...prev.capacity,
          [key]: Number(value),
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      if (images.length !== 2) {
        setError("Please keep exactly 2 images.");
        toast.error("Please keep exactly 2 images.");
        return;
      }

      setUploading(true);

      // Upload only newly added images
      const uploadedNewImages = await Promise.all(
        images
          .filter((img) => img.isNew)
          .map((img) => uploadToCloudinary(img.file)),
      );

      // Keep existing backend images
      const existingImages = images.filter(
        (img) => !img.isNew,
      );

      // Final photos array
      const finalPhotos = [
        ...existingImages,
        ...uploadedNewImages,
      ];

      const payload = {
        roomId,
        hotelId,
        ...form,
        basePrice: Number(form.basePrice),
        totalCount: Number(form.totalCount),
        amenities: form.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        photos: finalPhotos,
      };

      await updateOwnerRoom(payload).unwrap();
      toast.success("Room updated successfully!");
      if (hotelId) {
        router.push(`/owner/hotels/${hotelId}`);
      } else {
        router.back();
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.data?.message ||
        err?.message ||
        "Could not update room."
      );
      toast.error("Could not update room.");
    } finally {
      setUploading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-3xl bg-gray-200 dark:bg-gray-950 border border-gray-200 dark:border-gray-800" />
        <div className="h-96 rounded-3xl bg-gray-200 dark:bg-gray-950 border border-gray-200 dark:border-gray-800" />
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link
          href={hotelId ? `/owner/hotels/${hotelId}` : "/owner/hotels"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Edit Room Selection</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Modify pricing, photos, capacity, and details for this room
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Room Specs */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800/60 pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/45 text-rose-500">
              <BedDouble className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Room Specifications</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Room Type *</label>
              <input
                name="type"
                value={form.type}
                onChange={handleChange}
                placeholder="e.g. Deluxe Suite"
                required
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Base Price per Night *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">₹</span>
                  <input
                    name="basePrice"
                    type="number"
                    min="0"
                    value={form.basePrice}
                    onChange={handleChange}
                    placeholder="Price per night"
                    required
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-8 pr-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Rooms Available *</label>
                <input
                  name="totalCount"
                  type="number"
                  min="1"
                  value={form.totalCount}
                  onChange={handleChange}
                  placeholder="Inventory count"
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Amenities</label>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Comma-separated</span>
              </div>
              <input
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder="e.g. WiFi, Air Conditioning, Breakfast"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Media */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/45 text-rose-500">
                <UploadCloud className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Room Photos</h3>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              images.length === 2
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
            }`}>
              {images.length} / 2 selected
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Please upload <span className="font-bold text-gray-800 dark:text-gray-200">exactly 2 photos</span> of the room.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {images.map((img, index) => (
              <div key={img.public_id || img.id || index} className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 group">
                <div className="relative h-36 md:h-52 w-full">
                  {img.isNew ? (
                    <img
                      src={img.preview}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <img
                      src={img.url}
                      alt="Room"
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const key = img.isNew ? img.id : img.public_id;
                    setImages((prev) =>
                      prev.filter((item) => {
                        const itemKey = item.isNew ? item.id : item.public_id;
                        return itemKey !== key;
                      })
                    );
                  }}
                  className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/85 transition active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {images.length < 2 && (
            <div className="group relative">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-7 bg-gray-50/50 dark:bg-gray-950/20 hover:bg-gray-50 dark:hover:bg-gray-850 hover:border-rose-400 dark:hover:border-rose-900/50 transition cursor-pointer text-center">
                <UploadCloud className="h-9 w-9 text-gray-400 dark:text-gray-500 group-hover:text-rose-500 transition mb-2" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload photos</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Select 1 or more images (limit 2)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;

                    const newImages = Array.from(files).map((file) => ({
                      id: crypto.randomUUID(),
                      file,
                      preview: URL.createObjectURL(file),
                      url: "",
                      isNew: true,
                    }));

                    setImages((prev) => {
                      const updated = [...prev, ...newImages];
                      if (updated.length > 2) {
                        updated.splice(0, updated.length - 2);
                      }
                      return updated;
                    });

                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Section 3: Capacity */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800/60 pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/45 text-rose-500">
              <Users className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Room Capacity</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Adults *</label>
              <input
                name="capacity.adults"
                type="number"
                min="1"
                value={form.capacity.adults}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Children</label>
              <input
                name="capacity.children"
                type="number"
                min="0"
                value={form.capacity.children}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Infants</label>
              <input
                name="capacity.infants"
                type="number"
                min="0"
                value={form.capacity.infants}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-red-700 dark:text-red-400">
            <div className="flex gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (hotelId) {
                router.push(`/owner/hotels/${hotelId}`);
              } else {
                router.back();
              }
            }}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-6 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="inline-flex items-center justify-center rounded-full bg-rose-500 to-pink-500 text-white px-7 py-2.5 text-sm font-semibold hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/10 hover:shadow-rose-500/20 disabled:opacity-50 transition active:scale-95"
          >
            {submitting || uploading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </span>
            ) : (
              "Update Room"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
