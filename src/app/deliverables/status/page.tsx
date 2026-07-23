import { DocTable, H2, H3, Note, P, PageHeader, StatusPill, Ul, Warn } from "../_components/ui";

export default function StatusPage() {
  return (
    <>
      <PageHeader
        title="현황"
        description="실서비스에서 지금 제공 중인 기능, 남은 과제, 인수 후 확인할 항목입니다."
      />

      <H2>한 줄 요약</H2>
      <P>
        코스 MVP의 북스타 루프(발견 → 따라가기 → 다녀왔어요 → 영향력)는 배포된 상태입니다. 남은
        과제는 주로 운영 설정 확인·실기기 검증·일부 마이그레이션 적용입니다.
      </P>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="ok">핵심 루프 제공 중</StatusPill>
        <StatusPill tone="warn">0014 DB 적용 확인</StatusPill>
      </div>

      <H2>사용자가 지금 할 수 있는 것</H2>
      <H3>발견·탐색</H3>
      <DocTable
        headers={["기능", "상태", "메모"]}
        rows={[
          ["공개 코스 피드", "✅ 완료", "전이 정렬·필터"],
          ["지도 탐색", "✅ 완료", "스펙+전이 peek"],
          ["게스트 열람", "✅ 완료", "AuthGate 쓰기"],
          ["팔로잉 홈 레일", "✅ 완료", "데이터 있을 때만"],
        ]}
      />
      <H3>따라가기 루프</H3>
      <DocTable
        headers={["기능", "상태", "메모"]}
        rows={[
          ["따라가기 복제", "✅ 완료", "비공개 초안"],
          ["다녀왔어요·후기", "✅ 완료", "CTA 톤 사다리"],
          ["진행 체크리스트", "✅ 완료", "실데이터 기반"],
          ["저장 → 따라가기", "✅ 완료", "보관함 카드 CTA"],
        ]}
      />
      <H3>만들기·영향력</H3>
      <DocTable
        headers={["기능", "상태", "메모"]}
        rows={[
          ["기록·계획 작성", "✅ 완료", "공개 게이트"],
          ["따라가기 준비도", "✅ 완료", "soft hint"],
          ["전이 통계", "✅ 완료", "코스 통계"],
          ["장소 검색", "⚠️ 부분", "키 미설정 시 UI 숨김"],
        ]}
      />
      <H3>구독·소통</H3>
      <DocTable
        headers={["기능", "상태", "메모"]}
        rows={[
          ["팔로우", "✅ 완료", "맞팔 라벨"],
          ["알림 그룹", "✅ 완료", "전이·소셜"],
          ["copy/publish 알림", "⚠️ DB 확인", "0014 push"],
          ["좋아요·댓글", "✅ 완료", "보조 위계"],
        ]}
      />

      <H2>인수 후 체크리스트</H2>
      <Ul>
        <li>프로덕션에서 스플래시·탭·파비콘이 코스 C 아이콘인지 확인</li>
        <li>OG 미리보기(카카오/슬랙)에 코스 마크 + 「코스」 워드마크</li>
        <li>
          Supabase에 <code className="rounded bg-muted px-1 text-[12px]">0014</code> 적용 여부
        </li>
        <li>데모 계정으로 따라가기 → 다녀왔어요 → 알림 end-to-end</li>
        <li>NCP Maps URL에 course-sns.vercel.app 등록</li>
        <li>Google OAuth 콜백이 course-sns Supabase를 가리키는지</li>
        <li>
          <code className="rounded bg-muted px-1 text-[12px]">/deliverables</code> 가이드 링크
          공유
        </li>
      </Ul>

      <H2>의도적으로 미구현</H2>
      <Ul>
        <li>결제·구독 상품</li>
        <li>
          DB/URL <code className="rounded bg-muted px-1 text-[12px]">routes→courses</code> rename
        </li>
        <li>추천 알고리즘·푸시 네이티브</li>
        <li>팔로잉 2단 IA 완전 단순화 (E6 후속)</li>
      </Ul>

      <Warn>
        routdiary 프로덕션·Supabase와 키·데이터를 섞지 마세요. 인프라는 완전 분리입니다.
      </Warn>
      <Note>
        UX 잔여·Wave 상세는 저장소{" "}
        <code className="rounded bg-muted px-1 text-[12px]">docs/UX-PERSONA-PAINPOINTS.md</code>{" "}
        참고.
      </Note>
    </>
  );
}
