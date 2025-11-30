"use client";

import { Suspense } from "react";
import UpdateBookPage from "./UpdateBookPageContent";

export default function UpdateBookPageWrapper() {
  return (
    <Suspense fallback={<div>Loading book details...</div>}>
      <UpdateBookPage />
    </Suspense>
  );
}
