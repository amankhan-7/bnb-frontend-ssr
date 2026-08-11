"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PAYMENT_CONFIG } from "@/constants/payment";
import {
  validateRazorpayAvailability,
  createPrefillData,
} from "@/utils/payment";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src =
      PAYMENT_CONFIG.RAZORPAY_SCRIPT_URL ||
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const usePaymentHandler = ({
  createBooking,
  createPaymentOrder,
  verifyPayment,
  currentUser,
}) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const initiatePayment = async ({
    hotelId,
    roomId,
    fromDate,
    toDate,
    totalPrice,
    guests,
  }) => {
    setIsProcessing(true);
    try {
      // 1. Load Razorpay script dynamically
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error(
          "Razorpay SDK failed to load. Please check your internet connection.",
        );
        setIsProcessing(false);
        return;
      }

      validateRazorpayAvailability();

      // 2. Create Booking (PENDING + Redis Lock)
      setLoadingText("Creating your booking...");
      const bookingRes = await createBooking({
        hotelId,
        roomId,
        fromDate,
        toDate,
        totalPrice,
        guests,
      }).unwrap();

      // Extract bookingId safely from response
      const bookingData =
        bookingRes?.booking ||
        bookingRes?.data?.booking ||
        bookingRes?.data ||
        bookingRes;

      const bookingId = bookingData?._id || bookingData?.id;
      if (!bookingId) {
        throw new Error("Invalid booking response. Missing booking ID.");
      }

      setLoadingText("Preparing secure payment...");

      // 3. Create Razorpay Order
      const paymentOrder = await createPaymentOrder({
        bookingId,
      }).unwrap();

      const keyId =
        paymentOrder?.data?.keyId ||
        paymentOrder?.keyId ||
        paymentOrder?.data?.key ||
        paymentOrder?.key ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        PAYMENT_CONFIG.RAZORPAY_KEY_ID;

      const orderId =
        paymentOrder?.data?.orderId ||
        paymentOrder?.orderId ||
        paymentOrder?.data?.id ||
        paymentOrder?.id;

      const amount =
        paymentOrder?.data?.amount ||
        paymentOrder?.amount;

      const currency =
        paymentOrder?.data?.currency ||
        paymentOrder?.currency ||
        PAYMENT_CONFIG.CURRENCY ||
        "INR";

      if (!keyId) {
        throw new Error("Razorpay Key ID is missing. Check server configuration.");
      }

      if (!orderId) {
        throw new Error("Razorpay Order ID is missing from create-order response.");
      }

      // 4. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: PAYMENT_CONFIG.COMPANY_NAME || "Aman Inns",
        description: PAYMENT_CONFIG.DESCRIPTION || "Hotel Room Booking",
        order_id: orderId,
        handler: async (response) => {
          try {
            setLoadingText("Verifying your payment...");

            // 5. Verify payment
            await verifyPayment({
              bookingId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            // Redirect to bookings list
            setTimeout(() => {
              router.push("/bookings");
              setTimeout(() => {
                toast.success("Payment completed and verified successfully!", {
                  id: "payment-toast",
                });
              }, 1000);
            }, 500);
            setIsProcessing(false);
          } catch (err) {
            console.error("Payment confirmation or verification failed:", err);
            toast.error(
              err?.data?.message ||
                "Verification failed, please contact support.",
              { id: "payment-toast" },
            );
            setIsProcessing(false);
          }
        },
        prefill: createPrefillData(currentUser),
        theme: {
          color: PAYMENT_CONFIG.THEME_COLOR || "#FF385C",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error("Payment was cancelled. You can retry your payment.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setIsProcessing(false);
        console.error("Razorpay payment failed:", response?.error);
        toast.error(`Payment failed: ${response?.error?.description || "Transaction failed"}`);
      });
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      console.error("Payment flow initialization failed:", err);
      toast.error(
        err?.data?.message ||
          err?.message ||
          "Failed to initiate payment flow.",
        { id: "payment-toast" },
      );
    }
  };

  return { initiatePayment, isProcessing, loadingText };
};

