"use client";

import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Settings() {
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      {user && (
        <div>
          <p className="mb-4">Logged in as: {user.email}</p>
          <button
            onClick={() => {
              auth.signOut();
              router.push("/auth");
            }}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}