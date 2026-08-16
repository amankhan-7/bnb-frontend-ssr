import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearAuth, setCredentials } from "@/lib/slice/authSlice";
import { safeLocalStorage } from "@/utils/localstorage";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}/api/v1`,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    headers.set("Content-Type", "application/json");

    const token = getState().auth.accessToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: "/refresh-token",
        method: "POST",
      },
      api,
      extraOptions
    );

    if (refreshResult?.data?.success) {
      const state = api.getState();

      await api.dispatch(
        setCredentials({
          user: state.auth.user,
          accessToken: refreshResult.data.data.accessToken,
        })
      );

      result = await baseQuery(args, api, extraOptions);
    } else {
      await api.dispatch(clearAuth());

      await safeLocalStorage.removeItem("user");
      await safeLocalStorage.removeItem("accessToken");
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Profile", "Hotel", "Room", "Booking", "OwnerHotel", "Inventory","Analytics",],
  endpoints: () => ({}),
});

export { apiSlice as baseApi };