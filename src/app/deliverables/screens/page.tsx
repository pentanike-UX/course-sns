import { Code, DocTable, H2, Note, P, PageHeader, Ul } from "../_components/ui";

export default function ScreensPage() {
  return (
    <>
      <PageHeader
        title="화면"
        description="사용자 화면 주소, 로그인 요구, 이동 구조를 개발 관점에서 정리합니다."
      />

      <H2>하단 탭·셸</H2>
      <DocTable
        headers={["주소", "화면", "로그인", "비고"]}
        rows={[
          ["/", "둘러보기(홈)", "공개", "랜딩. ?mode=map 지도, 필터 쿼리"],
          ["/?mode=map", "지도", "공개", "목록↔지도 슬라이드"],
          ["/library", "보관함", "필요", "따라가는 중 · 저장 · 팔로잉"],
          ["FAB → sheet", "새 코스", "필요", "기록/계획 → /routes/new"],
        ]}
      />

      <H2>코스 상세·작성</H2>
      <DocTable
        headers={["주소", "화면", "로그인", "비고"]}
        rows={[
          ["/routes/[id]", "코스 상세", "공개", "쓰기는 AuthGate. 전이 CTA 우선"],
          ["/routes/new", "새 코스", "필요", "기록 위자드 / 계획 플래너"],
          ["/routes/[id]/edit", "수정", "필요", "소유자. 공개 게이트 적용"],
        ]}
      />

      <H2>프로필·소셜</H2>
      <DocTable
        headers={["주소", "화면", "로그인", "비고"]}
        rows={[
          ["/u/[handle]", "공개 책장", "공개", "팔로우 토글"],
          ["/u/[handle]/followers", "팔로워", "공개", ""],
          ["/u/[handle]/following", "팔로잉", "공개", ""],
          ["/feed", "내 코스(하드)", "필요", "주로 드로어로 대체"],
          ["/profile", "설정 드로어", "필요", ""],
          ["/profile/edit", "프로필 편집", "필요", ""],
          ["/profile/stats", "코스 통계", "필요", "전이·영향력 섹션"],
          ["/profile/account", "계정", "필요", "로그아웃·삭제"],
          ["/notifications", "알림", "필요", "전이·구독 / 소셜 그룹"],
          ["/login", "로그인", "공개", "로그인 시 / 로 리다이렉트"],
        ]}
      />

      <H2>가이드·기타</H2>
      <DocTable
        headers={["주소", "화면", "로그인"]}
        rows={[
          ["/deliverables/*", "개발·운영 가이드", "공개"],
          ["/auth/callback", "OAuth 콜백", "공개"],
        ]}
      />

      <H2>드로어·오버레이</H2>
      <Ul>
        <li>
          내 코스 / 설정: 클라 <Code>SlideDrawer</Code> (intercept soft nav 비활성 — 깜빡임 방지)
        </li>
        <li>
          AuthGate: 앱 전역 로그인 바텀시트 — 게스트 쓰기·전이 액션 가로챔
        </li>
        <li>작성 FAB / 필터 / 따라가기 목적: ActionBottomSheet 계열</li>
      </Ul>

      <H2>보호 규칙 (proxy.ts)</H2>
      <P>
        보호: <Code>/feed</Code>, <Code>/profile</Code>, <Code>/routes/new</Code>,{" "}
        <Code>/library</Code>, <Code>/notifications</Code>, 경로가 <Code>/edit</Code>로 끝나는
        주소. 그 외(홈·상세·프로필·가이드)는 게스트 열람.
      </P>
      <Note>
        <Code>/deliverables</Code>는 의도적으로 공개입니다. 보호 목록에 넣지 마세요.
      </Note>
    </>
  );
}
