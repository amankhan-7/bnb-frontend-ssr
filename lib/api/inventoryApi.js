import { baseApi } from "./baseApi";

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryAvailability: builder.query({
      query: ({ roomId, fromDate, toDate }) => ({
        url: "/inventory/availability",
        params: { roomId, fromDate, toDate },
      }),
      transformResponse: (response) => {
        if (typeof response?.data?.availableRooms === "number")
          return response.data.availableRooms;
        if (typeof response?.data?.availableCount === "number")
          return response.data.availableCount;
        if (typeof response?.data === "number") return response.data;
        if (typeof response?.availableRooms === "number")
          return response.availableRooms;
        return response?.data?.availableRooms ?? response?.data ?? response;
      },
      providesTags: (_result, _error, { roomId, fromDate, toDate }) => [
        {
          type: "Inventory",
          id: `${roomId}_${fromDate}_${toDate}`,
        },
      ],
    }),
  }),
});

export const { useGetInventoryAvailabilityQuery } = inventoryApi;

