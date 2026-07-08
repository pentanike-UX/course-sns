import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-lvh flex-col items-center justify-center gap-4 bg-paper px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sunset-wash text-3xl">
        🗺️
      </div>
      <div>
        <h1 className="text-[17px] font-bold text-ink">찾을 수 없는 길이에요</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          페이지가 사라졌거나 비공개로 바뀌었을 수 있어요.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-sunset px-5 py-2.5 text-[14px] font-semibold text-white"
      >
        홈으로 가기
      </Link>
    </div>
  );
}
