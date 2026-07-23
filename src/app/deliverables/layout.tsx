import type { Metadata } from "next";
import GuideShell from "./_components/GuideShell";
import { GUIDE_TITLE } from "./_components/nav";
import { APP_VERSION } from "@/lib/version";

const DESCRIPTION =
  "코스(course-sns) 공식 개발·운영 가이드입니다. 제품 정의, 화면·기술 명세, 배포·이력을 한곳에서 확인합니다.";

export const metadata: Metadata = {
  title: GUIDE_TITLE,
  description: DESCRIPTION,
  applicationName: GUIDE_TITLE,
  keywords: ["코스", "course-sns", "개발 가이드", "인수인계", "운영 가이드"],
  robots: { index: false, follow: false },
  openGraph: {
    title: GUIDE_TITLE,
    description: DESCRIPTION,
    siteName: GUIDE_TITLE,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: GUIDE_TITLE,
    description: DESCRIPTION,
  },
};

export default function DeliverablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuideShell>
      {/* version stamp for static HTML consumers */}
      <span className="sr-only">{APP_VERSION}</span>
      {children}
    </GuideShell>
  );
}
