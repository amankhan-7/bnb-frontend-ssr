import { baseApi } from "./baseApi";

export const roomsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoomsByHotel: builder.query({
      query: (hotelId) => `/rooms/hotel/${hotelId}`,
      transformResponse: (response) => response?.data || response,
      providesTags: (result, _error, hotelId) =>
        Array.isArray(result)
          ? [
              ...result.map((room) => ({ type: "Room", id: room._id })),
              { type: "Room", id: `HOTEL_${hotelId}` },
            ]
          : [{ type: "Room", id: `HOTEL_${hotelId}` }],
    }),

    //  NEW: get single room by ID
    getRoomById: builder.query({
      query: (roomId) => `/rooms/${roomId}`,
      transformResponse: (response) => response?.data || response,
      providesTags: (result, _error, roomId) => [
        { type: "Room", id: roomId },
      ],
    }),
  }),
});
export const { useGetRoomsByHotelQuery, useGetRoomByIdQuery } = roomsApi;

