export const PAYMENT_CONFIG = {
  RAZORPAY_SCRIPT_URL: "https://checkout.razorpay.com/v1/checkout.js",
  RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TCcioTrbn4tHS5",
  CURRENCY: "INR",
  COMPANY_NAME: "Aman Inns",
  DESCRIPTION: "Hotel room booking",
  THEME_COLOR: "#FF385C",
  DEFAULT_PAYMENT_METHOD: "upi",
};



export const formDefaults = (data) => {
  return {
  firstName: data?.firstName || "",
  lastName: data?.lastName || "",
  age: data?.age || "",
  gender: data?.gender || "",
  email: data?.email || "",
  phone: data?.phone || data?.phoneNumber || "",
}};

export const BOOKING_INITIAL_STATE = {

  id:"",
  hotel:"",
  room:"",
  fromDate:"",
  toDate:"",
  guests:{
    adults:1,
    children:0,
    infants:0
  },
  totalPrice:0

};