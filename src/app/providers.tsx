"use client";

import React from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        theme="dark" 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: "rgba(10, 9, 21, 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#f3f4f6",
          },
        }}
      />
    </>
  );
}
