export type GuideNavItem = {
  href: string;
  label: string;
  blurb: string;
  group: "start" | "product" | "dev" | "ops";
};

export const GUIDE_NAV: GuideNavItem[] = [
  {
    href: "/deliverables",
    label: "시작하기",
    blurb: "가이드 목적·읽는 순서",
    group: "start",
  },
  {
    href: "/deliverables/planning",
    label: "기획",
    blurb: "제품·기능·이용 흐름",
    group: "product",
  },
  {
    href: "/deliverables/screens",
    label: "화면",
    blurb: "화면 주소·구조",
    group: "dev",
  },
  {
    href: "/deliverables/architecture",
    label: "아키텍처",
    blurb: "기술 구조",
    group: "dev",
  },
  {
    href: "/deliverables/database",
    label: "DB",
    blurb: "데이터·권한",
    group: "dev",
  },
  {
    href: "/deliverables/api",
    label: "API",
    blurb: "서버 통신",
    group: "dev",
  },
  {
    href: "/deliverables/development",
    label: "개발",
    blurb: "실행·배포·테스트",
    group: "dev",
  },
  {
    href: "/deliverables/status",
    label: "현황",
    blurb: "완료·잔여·체크리스트",
    group: "ops",
  },
  {
    href: "/deliverables/changelog",
    label: "이력",
    blurb: "업데이트·변경 기록",
    group: "ops",
  },
];

export const PROD_URL = "https://course-sns.vercel.app";
export const GUIDE_TITLE = "코스 개발 가이드";
