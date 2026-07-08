"use client";

import { useState } from "react";
import MobileFrame from "@/components/MobileFrame";
import AppHeader from "@/components/AppHeader";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { updateProfile, signAvatarUpload } from "../actions";

type Props = {
  initial: { displayName: string; handle: string; avatarUrl?: string };
};

export default function ProfileEditForm({ initial }: Props) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [handle, setHandle] = useState(initial.handle);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarUrl(URL.createObjectURL(f));
  };

  const canSave = displayName.trim() && handle.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    try {
      let avatarPath: string | undefined;
      if (avatarFile) {
        // avatars render small everywhere — 512px is plenty
        const upload = await compressImage(avatarFile, { maxEdge: 512 });
        const ext = upload.name.split(".").pop() ?? "jpg";
        const signed = await signAvatarUpload(ext);
        if ("error" in signed || !signed.path) {
          setError(signed.error ?? "이미지 업로드에 실패했어요.");
          setSaving(false);
          return;
        }
        const supabase = createClient();
        const { error: upErr } = await supabase.storage
          .from("route-photos")
          .uploadToSignedUrl(signed.path, signed.token, upload, { upsert: true });
        if (upErr) throw upErr;
        avatarPath = signed.path;
      }

      const res = await updateProfile({
        displayName,
        handle,
        ...(avatarPath ? { avatarPath } : {}),
      });
      if (res?.error) {
        setError(res.error);
        setSaving(false);
      }
    } catch {
      setError("저장 중 문제가 발생했어요. 다시 시도해 주세요.");
      setSaving(false);
    }
  };

  return (
    <MobileFrame>
      <AppHeader
        back="/profile"
        title="프로필 편집"
        right={
          <button
            form="profile-form"
            type="submit"
            disabled={!canSave || saving}
            className="rounded-full bg-sunset px-4 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            {saving ? "저장 중…" : "완료"}
          </button>
        }
      />

      <form id="profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 pb-10">
        {/* avatar */}
        <div className="flex flex-col items-center pt-6">
          <label className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-sunset-wash ring-2 ring-sunset/30">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-black text-sunset">
                {displayName.charAt(0) || "?"}
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/45 py-1 text-center text-[11px] font-medium text-white">
              변경
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickAvatar(e.target.files)}
            />
          </label>
        </div>

        <div className="mt-8">
          <Field label="닉네임" value={displayName} onChange={setDisplayName} placeholder="여행자" required />
          <label className="mb-3 block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">
              핸들<span className="text-sunset"> *</span>
            </span>
            <div className="flex items-center rounded-xl border border-line bg-card px-3 focus-within:border-sunset">
              <span className="text-[14px] text-ink-faint">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="traveler"
                className="w-full bg-transparent py-2.5 pl-1 text-[14px] text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
            <span className="mt-1 block text-[11px] text-ink-faint">영문 소문자·숫자·_ 2~20자</span>
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-sunset-wash px-3 py-2 text-center text-[13px] text-sunset-ink">
            {error}
          </p>
        )}
      </form>
    </MobileFrame>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">
        {label}
        {required && <span className="text-sunset"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
      />
    </label>
  );
}
