export { baseApi } from "./baseApi";

export {
  useLoginMutation,
  useSignupMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useUpdateProfileMutation,
} from "./authApi";

export {
  useGetHotelsQuery,
  useBrowseHotelsQuery,
  useGetHotelByIdQuery,
} from "./hotelsApi";

export { useGetRoomsByHotelQuery, useGetRoomByIdQuery } from "./roomsApi";

export { useGetInventoryAvailabilityQuery, useGetInventoryCalendarQuery } from "./inventoryApi";

export {
  useGetMyBookingsQuery,
  useGetBookingByIdQuery,
  useCancelBookingMutation,
} from "./bookingsApi";

export {
  useCreateBookingMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
} from "./paymentApi";

export {
  useGetOwnerHotelsQuery,
  useGetOwnerHotelByIdQuery,
  useGetOwnerHotelRoomsQuery,
  useCreateOwnerHotelMutation,
  useUpdateOwnerHotelMutation,
  useActivateOwnerHotelMutation,
  useDeleteOwnerHotelMutation,
  useCreateOwnerRoomMutation,
  useUpdateOwnerRoomMutation,
  useDeleteOwnerRoomMutation,
} from "./ownerApi";
