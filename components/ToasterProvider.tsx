"use client";

import { Toaster } from "sonner";
import { useEffect, useState } from "react";

export function ToasterProvider() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return <Toaster position={isMobile ? "top-center" : "bottom-right"} />;
}
