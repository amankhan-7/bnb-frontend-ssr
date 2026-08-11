"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import BookingCard from "@/components/HotelPage/BookingCard";
import Rooms from "@/components/HotelPage/Rooms";
import toast from "react-hot-toast";
import RoomCardSkeleton from "@/components/RoomCardSkeleton";
import ThemeToggle from "@/utils/Theme/ThemeToggle";
import { ArrowLeft, Sparkles, MapPin, X } from "lucide-react";
import {
  useGetHotelByIdQuery,
  useGetRoomsByHotelQuery,
  useCreateBookingMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
} from "@/lib/api";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";
import { usePaymentHandler } from "@/hooks/usePaymentHandler";
import { useAuth } from "@/utils/useAuth";
import Footer from "@/components/Footer";
import PaymentLoading from "@/components/paymentLoading";

export default function HotelPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const defaultCheckIn = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const defaultCheckOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);


  const rating = useMemo(() => {
    if (!id) return "4.8";
    const code = id.toString().slice(-2);
    const parsed = parseInt(code, 16) || 45;
    return (4.3 + (parsed % 7) * 0.1).toFixed(1);
  }, [id]);

  const reviewsCount = useMemo(() => {
    if (!id) return 120;
    const code = id.toString().slice(-3);
    const parsed = parseInt(code, 16) || 120;
    return (parsed % 180) + 24;
  }, [id]);

  const {
    data: hotel,
    isLoading: isHotelLoading,
    isError: isHotelError,
  } = useGetHotelByIdQuery(id, { skip: !id });

  const { data: rooms = [] } = useGetRoomsByHotelQuery(id, { skip: !id });

  const { roomAvailability } = useRoomAvailability(rooms, checkIn, checkOut);

  const [createBooking] = useCreateBookingMutation();
  const [createPaymentOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const { user: currentUser } = useAuth();

  const { initiatePayment, isProcessing, loadingText } = usePaymentHandler({
    createBooking,
    createPaymentOrder,
    verifyPayment,
    currentUser,
  });

  const handleReserve = async (data) => {
    if (!currentUser) {
      toast.error("Please login to reserve a stay.");
      router.push("/login");
      return;
    }

    try {
      await initiatePayment({
        hotelId: hotel._id,
        roomId: selectedRoom._id,
        fromDate: checkIn,
        toDate: checkOut,
        totalPrice: data.total,
        guests: {
          adults: data.adults,
          children: data.children,
          infants: data.infants,
        },
      });
    } catch (err) {
      const message = err?.data?.message;

      if (message?.includes("Room temporarily locked on")) {
        toast(
          "⚠️ This room is currently reserved by another guest. Please try again shortly.",
          { duration: 4000 },
        );
        return;
      }

      toast.error(message || "Booking failed");
    }
  };

  if (isHotelLoading) {
    return <RoomCardSkeleton />;
  }

  if (isHotelError || !hotel) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <p className="text-lg font-bold">Stay not found</p>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold shadow hover:bg-rose-600 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <main className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-150 min-h-screen transition-colors duration-200 pb-0 lg:pb-0">
      {isProcessing && <PaymentLoading message={loadingText} />}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-150 dark:border-gray-850 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row justify-between items-center h-16">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-rose-500 transition-colors cursor-pointer group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
              <span>Stays</span>
            </button>

            <h1
              className="text-xl font-black text-rose-500 tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => router.push("/")}
            >
              amanbnb
            </h1>

            <div className="flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
        <Image
          src={hotel.photos?.[0] || "/fallback.jpg"}
          alt={hotel.name}
          fill
          priority
          sizes="100vw"
          className="object-cover scale-102"
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-transparent z-10" />

        <div className="absolute bottom-8 left-4 right-4 md:left-12 max-w-4xl z-20 text-white space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Verified Stay
            </span>
            <span className="bg-white/20 backdrop-blur-[2px] text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20">
              ⭐ {rating} · {reviewsCount} reviews
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight drop-shadow-md">
            {hotel.name}
          </h2>

          <p className="text-xs md:text-sm font-medium opacity-90 flex items-center gap-1.5 drop-shadow-xs">
            <MapPin size={14} className="text-rose-400 shrink-0" />
            {hotel.city} · Prime Location Stay
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-10">
            <section className="bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-rose-500 shrink-0" />
                About this stay
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                Experience refined comfort at{" "}
                <span className="font-bold text-gray-800 dark:text-white">
                  {hotel.name}
                </span>
                , located in the heart of{" "}
                <span className="font-bold text-gray-800 dark:text-white">
                  {hotel.city}
                </span>
                . Designed for modern travelers, this space blends luxury,
                warmth, and thoughtful hospitality.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Basic Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                {hotel.amenities?.map((a, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 px-4 py-3.5 rounded-xl shadow-xs text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-rose-450 dark:hover:border-rose-800 hover:text-rose-500 dark:hover:text-rose-400 transition-all flex items-center gap-2 cursor-default"
                  >
                    <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-gray-100 dark:border-gray-800" />
          </div>

          <div className="hidden lg:block lg:col-span-1">
            {!selectedRoom ? (
              <div className="sticky top-24 h-fit">
                <div className="rounded-2xl p-6 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-center space-y-4">
                  <div className="h-11 w-11 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
                    ✨
                  </div>
                  <div className="space-y-1 px-2">
                    <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                      Begin reservation
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                      Select one of the premium available spaces below to
                      customize dates, specify guests, and confirm your booking.
                    </p>
                  </div>
                  <div className="pt-2">
                    <div className="h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                      Waiting for room selection...
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <BookingCard
                selectedRoom={selectedRoom}
                checkIn={checkIn}
                setCheckIn={setCheckIn}
                setCheckOut={setCheckOut}
                checkOut={checkOut}
                onReserve={handleReserve}
                disabled={isProcessing}
              />
            )}
          </div>
        </div>
      </div>

      <Rooms
        rooms={rooms}
        roomAvailability={roomAvailability}
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        checkIn={checkIn}
        checkOut={checkOut}
      />


      {selectedRoom && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-6 py-4.5 flex items-center justify-between shadow-xl lg:hidden">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider max-w-35 truncate">
              {selectedRoom.type}
            </span>
            <span className="text-base font-black text-gray-950 dark:text-white mt-0.5">
              ₹{selectedRoom.basePrice.toLocaleString("en-IN")}
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                {" "}
                / night
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3 text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Confirm Reservation
          </button>
        </div>
      )}

      {isMobileDrawerOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex items-end">
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 border-t border-gray-150 dark:border-gray-800 shadow-2xl overflow-y-auto max-h-[85vh] transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-950 dark:text-white">
                  Customize Reservation
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  {selectedRoom.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <BookingCard
              selectedRoom={selectedRoom}
              checkIn={checkIn}
              setCheckIn={setCheckIn}
              setCheckOut={setCheckOut}
              checkOut={checkOut}
              onReserve={(data) => {
                setIsMobileDrawerOpen(false);
                handleReserve(data);
              }}
              disabled={isProcessing}
            />
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
