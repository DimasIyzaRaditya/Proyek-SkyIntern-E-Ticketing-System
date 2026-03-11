"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const bookingCode = sp.get("bookingCode");

  useEffect(() => {
    if (bookingCode) {
      router.replace(`/bookings/e-ticket/${bookingCode}`);
    } else {
      router.replace("/bookings");
    }
  }, [bookingCode, router]);

  return null;
}

export default function ETicketRedirectPage() {
  return (
    <Suspense>
      <RedirectContent />
    </Suspense>
  );
}
