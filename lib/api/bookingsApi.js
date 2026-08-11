import { baseApi } from "./baseApi";

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyBookings: builder.query({
      query: () => "/booking/bookings",
      transformResponse: (response) => response?.bookings || [],
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((booking) => ({
                type: "Booking",
                id: booking._id,
              })),
              { type: "Booking", id: "LIST" },
            ]
          : [{ type: "Booking", id: "LIST" }],
    }),
    getBookingById: builder.query({
      query: (id) => `/booking/${id}`,
      transformResponse: (response) => response?.booking,
      providesTags: (_result, _error, id) => [{ type: "Booking", id }],
    }),
    // createBooking: builder.mutation({
    //   query: (body) => ({
    //     url: "/booking/create",
    //     method: "POST",
    //     body,
    //   }),
    //   invalidatesTags: [
    //     { type: "Booking", id: "LIST" },
    //     { type: "Inventory" },
    //   ],
    // }),
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/booking/${id}/cancel`,
        method: "PATCH",
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Booking", id: "LIST" },
        { type: "Booking", id },
      ],
    }),
  }),
});

export const {
  useGetMyBookingsQuery,
  useGetBookingByIdQuery,
  // useCreateBookingMutation,
  useCancelBookingMutation,
} = bookingsApi;
