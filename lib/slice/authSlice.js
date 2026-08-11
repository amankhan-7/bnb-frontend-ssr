import { safeLocalStorage } from "@/utils/localstorage";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";


export const hydrateAuth = createAsyncThunk(
  "auth/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      const user = await safeLocalStorage.getItem("user");
      const accessToken = await safeLocalStorage.getItem("accessToken");

      return {
        user,
        accessToken,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const setCredentials = createAsyncThunk(
  "auth/setCredentials",
  async (payload, { rejectWithValue }) => {
    try {
      const { user, accessToken } = payload;

      await safeLocalStorage.setItem("user", user);
      await safeLocalStorage.setItem("accessToken", accessToken);

      return {
        user,
        accessToken,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
       safeLocalStorage.removeItem("user");
       safeLocalStorage.removeItem("accessToken");

      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
 clearAuth: (state) => {
  state.user = null;
  state.accessToken = null;
  state.isAuthenticated = false;
  state.isLoading = false;
  state.error = null;
},
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
   .addCase(hydrateAuth.fulfilled, (state, action) => {
  state.isLoading = false;

  if (action.payload?.user && action.payload?.accessToken) {
    state.user = action.payload.user;
    state.accessToken = action.payload.accessToken;
    state.isAuthenticated = true;
  } else {
    state.user = null;
    state.accessToken = null;
    state.isAuthenticated = false;
  }

  state.error = null;
})
      .addCase(hydrateAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(setCredentials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
    .addCase(setCredentials.fulfilled, (state, action) => {
  state.isLoading = false;
  state.user = action.payload.user;
  state.accessToken = action.payload.accessToken;
  state.isAuthenticated = true;
  state.error = null;
})
      .addCase(setCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
    .addCase(logout.fulfilled, (state) => {
  state.user = null;
  state.accessToken = null;
  state.isAuthenticated = false;
  state.isLoading = false;
  state.error = null;
})
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;


//ZUSTAND
// import { create } from "zustand";
// import { safeLocalStorage } from "@/utils/localStorage";

// export const useAuthStore = create((set, get) => ({
//   // ---------- STATE ----------
//   user: null,
//   isAuthenticated: false,
//   isLoading: true,
//   error: null,

//   // ---------- ACTIONS ----------
  
//   // Hydrate auth from localStorage
//   hydrateAuth: async () => {
//     set({ isLoading: true, error: null });
//     try {
//       const user = await safeLocalStorage.getItem("user");
//       if (user) {
//         set({ user, isAuthenticated: true });
//       } else {
//         set({ user: null, isAuthenticated: false });
//       }
//     } catch (error) {
//       console.error("Error hydrating auth state:", error);
//       set({ user: null, isAuthenticated: false, error: error.message });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   // Set credentials (login/register)
//   setCredentials: async (payload) => {
//     set({ isLoading: true, error: null });
//     try {
//       const { user } = payload;
//       await safeLocalStorage.setItem("user", user);
//       set({ user, isAuthenticated: true });
//     } catch (error) {
//       console.error("Error setting credentials:", error);
//       set({ error: error.message });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   // Logout
//   logout: async () => {
//     set({ isLoading: true, error: null });
//     try {
//       await safeLocalStorage.removeItem("user");
//       set({ user: null, isAuthenticated: false });
//     } catch (error) {
//       console.error("Error during logout:", error);
//       set({ user: null, isAuthenticated: false, error: error.message });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   // Manual state resets
//   clearError: () => set({ error: null }),
//   clearAuth: () =>
//     set({
//       user: null,
//       isAuthenticated: false,
//       isLoading: false,
//       error: null,
//     }),
// }));
