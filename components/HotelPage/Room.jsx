import Image from "next/image";
import { Baby, BedDouble, Users } from "lucide-react";

export default function RoomCard({
  room,
  isSelected,
  available,
  user,
  router,
  toast,
  setSelectedRoom,
  handleSelect,
}) {
  if (!room) return null;

  const photo1 =
    room.photos?.[0]?.url ||
    (typeof room.photos?.[0] === "string" ? room.photos[0] : null) ||
    "/fallback.jpg";
  const photo2 =
    room.photos?.[1]?.url ||
    (typeof room.photos?.[1] === "string" ? room.photos[1] : null) ||
    photo1;

  const adults = room.capacity?.adults ?? 1;
  const children = room.capacity?.children ?? 0;
  const infants = room.capacity?.infants ?? 0;

  const totalCount = room.totalCount ?? room.availableRooms ?? 1;
  const availableCount = typeof available === "number" ? available : totalCount;

  const basePrice = room.basePrice ?? 0;
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];

  const onRoomClick = () => {
    if (handleSelect) {
      handleSelect(room);
    } else if (setSelectedRoom) {
      setSelectedRoom((prev) => (prev?._id === room._id ? null : room));
    }
  };

  return (
    <div
      className={`group grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch rounded-2xl p-5 min-h-70 w-full border transition-all duration-300 cursor-pointer
        ${
          isSelected
            ? "bg-rose-500/10 dark:bg-rose-950/20 border-rose-500 dark:border-rose-800 shadow-md ring-1 ring-rose-200 dark:ring-rose-900/40"
            : "bg-linear-to-t from-gray-300 via-gray-200 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
        }`}
      onClick={onRoomClick}
    >
      <div className="md:col-span-2 relative rounded-xl overflow-hidden">
        {/* MOBILE */}
        <div className="flex flex-col gap-2 md:hidden h-full">
          <div className="relative w-full h-48 rounded-xl overflow-hidden">
            <Image
              src={photo1}
              alt={room.type || "Room photo 1"}
              fill
              className="object-cover"
            />
          </div>

          <div className="relative w-full h-48 rounded-xl overflow-hidden">
            <Image
              src={photo2}
              alt={room.type || "Room photo 2"}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:grid grid-cols-2 gap-1 h-70 w-full">
          <div className="relative w-full h-full">
            <Image
              src={photo1}
              alt={room.type || "Room photo 1"}
              fill
              className="object-cover"
            />
          </div>

          <div className="relative w-full h-full">
            <Image
              src={photo2}
              alt={room.type || "Room photo 2"}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* INFO */}
      <div className="md:col-span-1 flex flex-col justify-between p-2 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors">
              {room.type}
            </h3>

            <div className="flex items-center text-rose-500 font-extrabold text-[10px] uppercase tracking-wider">
              ⭐ Popular Choice
            </div>
          </div>

          {/* Capacity */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1
                ${
                  isSelected
                    ? "bg-rose-50 text-gray-700 border-rose-500"
                    : "bg-gray-50 text-gray-700 border-gray-100"
                }
                dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700`}
            >
              <Users
                size={12}
                className={isSelected ? "text-rose-500" : "text-gray-400"}
              />
              {adults} Adults
            </span>

            {children > 0 && (
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1
                  ${
                    isSelected
                      ? "bg-rose-50 text-gray-700 border-rose-500"
                      : "bg-gray-50 text-gray-700 border-gray-100"
                  }
                  dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700`}
              >
                <Users
                  size={12}
                  className={isSelected ? "text-rose-500" : "text-gray-400"}
                />
                {children} Kids
              </span>
            )}

            {infants > 0 && (
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1
                  ${
                    isSelected
                      ? "bg-rose-50 text-gray-700 border-rose-500"
                      : "bg-gray-50 text-gray-700 border-gray-100"
                  }
                  dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700`}
              >
                <Baby
                  size={12}
                  className={isSelected ? "text-rose-500" : "text-gray-400"}
                />
                {infants} Infants
              </span>
            )}

            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                availableCount <= 1
                  ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/60"
              }`}
            >
              <BedDouble size={12} />
              {availableCount} {availableCount === 1 ? "Room Left" : "Rooms Left"}
            </span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {amenities.map((a, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-transparent"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500 font-bold uppercase tracking-wider">
              Base Rate
            </p>

            <p className="text-lg font-black text-gray-950 dark:text-white mt-0.5">
              ₹{basePrice.toLocaleString("en-IN")}
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                {" "}
                / night
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              if (!user) {
                toast?.error
                  ? toast.error("Please login first to book a room", {
                      duration: 2000,
                    })
                  : alert("Please login first to book a room");

                setTimeout(() => {
                  router?.push?.("/login");
                }, 2000);

                return;
              }

              if (user.role === "owner") {
                toast?.error
                  ? toast.error(
                      "Owners cannot book rooms. Please register a regular user account.",
                      {
                        duration: 2000,
                      }
                    )
                  : alert("Owners cannot book rooms.");

                setTimeout(() => {
                  router?.push?.("/signup");
                }, 2000);

                return;
              }

              onRoomClick();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer
              ${
                isSelected
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              }`}
          >
            {isSelected ? "Selected" : "Select Room"}
          </button>
        </div>
      </div>
    </div>
  );
}