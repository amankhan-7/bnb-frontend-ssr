export const validateRazorpayAvailability = () => {
  if (typeof window === "undefined" || !window.Razorpay) {
    throw new Error("Razorpay failed to load. Please check your network connection and try again.");
  }
};

export const formatPaymentError = (error) => {
  return error?.data?.message || error?.message || "Unable to process payment. Please try again.";
};

export const createPassengerDetails = (formData) => ({
  name:
    formData?.name ||
    [formData?.firstName, formData?.lastName]
      .filter(Boolean)
      .join(" "),

  email: formData?.email || "",
  age: formData?.age || "",
  gender: formData?.gender || "",
  phone: formData?.phone || "",
});

export const createPrefillData = (data) => ({
  name:
    data?.name ||
    [data?.firstName, data?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "",

  email: data?.email || "",

  contact: data?.phone || data?.phoneNumber || "",
});