"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { updateProfileAvatar, deleteProfileAvatar } from "../actions";
import { Button } from "@/components/ui/button";

interface AvatarUploadFormProps {
  avatarUrl: string;
  userName: string;
  hasCustomAvatar: boolean;
}

export function AvatarUploadForm({
  avatarUrl,
  userName,
  hasCustomAvatar,
}: AvatarUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 sm:items-start">
      <div className="relative size-16 group overflow-hidden rounded-xl bg-orange-100 ring-1 ring-border">
        <img
          src={avatarUrl}
          alt={userName}
          className="size-full object-cover"
        />

        <form
          ref={formRef}
          action={updateProfileAvatar}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity focus-within:opacity-100 hover:opacity-100"
        >
          <label
            htmlFor="avatar-upload"
            className="flex size-full cursor-pointer items-center justify-center text-white/90 hover:text-white"
          >
            <Camera className="size-5" />
            <span className="sr-only">Upload avatar</span>
          </label>
          <input
            id="avatar-upload"
            name="avatar"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        </form>
      </div>

      {hasCustomAvatar && (
        <form action={deleteProfileAvatar}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-red-500 hover:bg-transparent hover:text-red-600 hover:underline"
          >
            Remove Picture
          </Button>
        </form>
      )}
    </div>
  );
}
