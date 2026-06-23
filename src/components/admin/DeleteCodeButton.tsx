"use client";

import React, { useState } from "react";
import { deletePromoCode } from "@/app/admin-portal/actions";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteProps {
  id: string;
}

export function DeleteCodeButton({ id }: DeleteProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this activation key?")) {
      return;
    }

    setLoading(true);
    const res = await deletePromoCode(id);
    setLoading(false);

    if (res?.error) {
      alert(`Error: ${res.error}`);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
      title="Delete Key"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
