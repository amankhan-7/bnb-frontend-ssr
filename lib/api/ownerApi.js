import { baseApi } from "./baseApi";

function ownerHotelListTags(result) {
  return result?.length
    ? [
        ...result.map((hotel) => ({
          type: "OwnerHotel",
          id: hotel._id,
        })),
        { type: "OwnerHotel", id: "LIST" },
      ]
    : [{ type: "OwnerHotel", id: "LIST" }];
}

export const ownerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ------------------------------------------------------------------ */
    /* Hotels                                                             */
    /* ------------------------------------------------------------------ */

    getOwnerHotels: builder.query({
      query: () => "/owner/hotels",

      transformResponse: (response) =>
        response?.data || response || [],

      providesTags: ownerHotelListTags,
    }),

    getOwnerHotelById: builder.query({
      query: (hotelId) =>
        `/owner/hotels/${hotelId}`,

      transformResponse: (response) =>
        response?.data || response,

      providesTags: (_result, _error, hotelId) => [
        {
          type: "OwnerHotel",
          id: hotelId,
        },
      ],
    }),

    /* ------------------------------------------------------------------ */
    /* Rooms                                                              */
    /* ------------------------------------------------------------------ */

    getOwnerHotelRooms: builder.query({
      query: (hotelId) =>
        `/owner/hotels/${hotelId}/rooms`,

      transformResponse: (response) =>
        response?.data || response || [],

      providesTags: (result, _error, hotelId) =>
        result?.length
          ? [
              ...result.map((room) => ({
                type: "Room",
                id: room._id,
              })),
              {
                type: "Room",
                id: `OWNER_HOTEL_${hotelId}`,
              },
            ]
          : [
              {
                type: "Room",
                id: `OWNER_HOTEL_${hotelId}`,
              },
            ],
    }),

    createOwnerRoom: builder.mutation({
      query: ({ hotelId, ...body }) => ({
        url: `/owner/hotels/${hotelId}/rooms`,
        method: "POST",
        body,
      }),

      invalidatesTags: (_result, _error, { hotelId }) => [
        {
          type: "Room",
          id: `OWNER_HOTEL_${hotelId}`,
        },
        {
          type: "Room",
          id: `HOTEL_${hotelId}`,
        },
        {
          type: "OwnerHotel",
          id: hotelId,
        },
      ],
    }),

    updateOwnerRoom: builder.mutation({
      query: ({ roomId, ...body }) => ({
        url: `/owner/rooms/${roomId}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: (
        _result,
        _error,
        { roomId, hotelId }
      ) => [
        {
          type: "Room",
          id: roomId,
        },

        ...(hotelId
          ? [
              {
                type: "Room",
                id: `OWNER_HOTEL_${hotelId}`,
              },
              {
                type: "Room",
                id: `HOTEL_${hotelId}`,
              },
            ]
          : []),
      ],
    }),

    deleteOwnerRoom: builder.mutation({
      query: (roomId) => ({
        url: `/owner/rooms/${roomId}`,
        method: "DELETE",
      }),

      invalidatesTags: [
        {
          type: "Room",
          id: "LIST",
        },
        {
          type: "OwnerHotel",
          id: "LIST",
        },
      ],
    }),

    /* ------------------------------------------------------------------ */
    /* Hotel CRUD                                                         */
    /* ------------------------------------------------------------------ */

    createOwnerHotel: builder.mutation({
      query: (body) => ({
        url: "/owner/hotels",
        method: "POST",
        body,
      }),

      invalidatesTags: [
        {
          type: "OwnerHotel",
          id: "LIST",
        },
        {
          type: "Hotel",
          id: "LIST",
        },
      ],
    }),

    updateOwnerHotel: builder.mutation({
      query: ({ hotelId, ...body }) => ({
        url: `/owner/hotels/${hotelId}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: (_result, _error, { hotelId }) => [
        {
          type: "OwnerHotel",
          id: "LIST",
        },
        {
          type: "OwnerHotel",
          id: hotelId,
        },
        {
          type: "Hotel",
          id: hotelId,
        },
      ],
    }),

    activateOwnerHotel: builder.mutation({
      query: (hotelId) => ({
        url: `/owner/hotels/${hotelId}/activate`,
        method: "PATCH",
      }),

      invalidatesTags: (_result, _error, hotelId) => [
        {
          type: "OwnerHotel",
          id: "LIST",
        },
        {
          type: "OwnerHotel",
          id: hotelId,
        },
        {
          type: "Hotel",
          id: hotelId,
        },
      ],
    }),

    deleteOwnerHotel: builder.mutation({
      query: (hotelId) => ({
        url: `/owner/hotels/${hotelId}`,
        method: "DELETE",
      }),

      invalidatesTags: [
        {
          type: "OwnerHotel",
          id: "LIST",
        },
        {
          type: "Hotel",
          id: "LIST",
        },
      ],
    }),

    /* ------------------------------------------------------------------ */
    /* Analytics                                                          */
    /* ------------------------------------------------------------------ */

    getOwnerHotelAnalytics: builder.query({
      query: ({ hotelId, from, to }) => ({
        url: `/owner/hotel/${hotelId}/analytics`,
        params: {
          from,
          to,
        },
      }),

      transformResponse: (response) =>
        response?.analytics ||
        response?.data?.analytics ||
        response?.data ||
        response,

      providesTags: (_result, _error, { hotelId }) => [
        {
          type: "Analytics",
          id: hotelId,
        },
      ],
    }),
  }),
});

export const {
  useGetOwnerHotelsQuery,
  useGetOwnerHotelByIdQuery,
  useGetOwnerHotelRoomsQuery,
  useGetOwnerHotelAnalyticsQuery,

  useCreateOwnerHotelMutation,
  useUpdateOwnerHotelMutation,
  useActivateOwnerHotelMutation,
  useDeleteOwnerHotelMutation,

  useCreateOwnerRoomMutation,
  useUpdateOwnerRoomMutation,
  useDeleteOwnerRoomMutation,
} = ownerApi;