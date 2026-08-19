import { Code, DocTable, H2, Note, P, PageHeader, Ul } from "../_components/ui";
import { APP_VERSION } from "@/lib/version";

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        title="이력"
        description="버전별 주요 변경입니다. 상세 작업 로그는 docs/HANDOFF.md §7에 누적합니다."
      />

      <P>
        현재 버전: <Code>{APP_VERSION}</Code>
      </P>

      <H2>v0.4.7-mvp — 기록 위자드 뒤로가기</H2>
      <Ul>
        <li>
          등록·수정 4화면: 헤더가 2–4번에서 닫기(X) 대신 이전 화면으로 돌아감. 1번에서 닫을 때만
          나가기 확인. 실수로 순서·이동 작업이 사라지지 않음
        </li>
      </Ul>

      <H2>v0.4.6-mvp — 스팟 한 줄</H2>
      <Ul>
        <li>
          등록·수정 순서 화면: 스팟 카드를 누르면 「이 곳에서 남긴 말」을 바로 적을 수 있음. 안 써도 됨.
          쓴 글은 카드 사진 아래에 짧게만 보임. 이동 화면은 그대로
        </li>
      </Ul>

      <H2>v0.4.5-mvp — Safari 공유 버튼 위치</H2>
      <Ul>
        <li>
          아이폰 설치 안내: Safari 탭 설정(콤팩트 · 하단 · 상단)마다 다른 공유 위치를 그림으로 안내.
          콤팩트는 주소창 옆 ••• → 공유
        </li>
      </Ul>

      <H2>v0.4.4-mvp — 아이폰 홈 화면 추가 안내</H2>
      <Ul>
        <li>
          아이폰 설정 다운로드: Safari 공유 → 홈 화면에 추가 → 추가 확인을 그림과 순서대로 안내
        </li>
      </Ul>

      <H2>v0.4.3-mvp — 설정 다운로드 버튼</H2>
      <Ul>
        <li>
          설정 헤더 다운로드(앱 설치)가 눌러도 안 보이던 문제 수정. 설치 가능 브라우저에서는
          바로 설치 대화상자, 아니면 홈 화면 추가 안내 시트
        </li>
      </Ul>

      <H2>v0.4.2-mvp — 작업 완료 시 프로덕션 머지</H2>
      <Ul>
        <li>
          에이전트 규칙: 초안 PR로 멈추지 않고 <Code>main</Code> 머지(Vercel 프로덕션)까지 완료. 사용자가
          머지하지 말라고 한 경우만 예외
        </li>
      </Ul>

      <H2>v0.4.1-mvp — Photo-first 기록 수정</H2>
      <Ul>
        <li>기록 수정도 작성과 같은 4화면: 올리기 → 순서 → 이동 → 공개. 섹션점프 스크롤 폼 제거</li>
        <li>
          기본 진입은 순서 화면. 계획→기록(<Code>?photos=1</Code>)·사진 없는 따라가기 초안은 올리기부터
        </li>
        <li>스팟 카드 탭에서 사진 추가·삭제·위치. 계획 수정은 지도 플래너 유지</li>
      </Ul>

      <H2>v0.4.0-mvp — Photo-first 기록 작성</H2>
      <Ul>
        <li>기록 생성 4화면: 올리기 → 순서(스팟 카드) → 이동 → 공개. 제목·본문 없이 등록 가능</li>
        <li>
          위치 메타로 스팟 묶음·자동 제목·레그 시간. UI는 점 스텝퍼·히어로 카드·여백 중심
        </li>
        <li>
          정본 <Code>docs/PHOTO-FIRST-CREATE.md</Code> G1–G3. 수정/따라가기 셸 통일은 후속
        </li>
      </Ul>

      <H2>v0.3.9-mvp — Photo-first 코스 등록 설계</H2>
      <Ul>
        <li>
          기록 작성 멘탈모델: 사진만 올리면 같은 위치는 스팟 카드로 묶이고, 카드 사이 이동만
          확인하면 등록 (제목·본문 필수 아님)
        </li>
        <li>
          정본 <Code>docs/PHOTO-FIRST-CREATE.md</Code> — 진입점 전수 체크 · 4화면 one-task ·
          메타 자동채움 · 구현 단계 G1–G6 (코드 교체는 후속)
        </li>
      </Ul>

      <H2>v0.3.8-mvp — 브랜드(BI·BX) 가이드</H2>
      <Ul>
        <li>
          <Code>/deliverables/brand</Code> — 개요·메시지·철학·포지셔닝·로고 시스템·BX
        </li>
        <li>
          저장소 정본 <Code>docs/BRAND.md</Code> · 시작하기·내비·개발 페이지 연결
        </li>
      </Ul>

      <H2>v0.3.7-mvp — favicon·OG 공식 로고</H2>
      <Ul>
        <li>
          favicon: <Code>public/favicon.png</Code> · <Code>src/app/icon.png</Code> (공식 light
          심볼)
        </li>
        <li>
          OG/Twitter: 블랙 배경 + 공식 dark 락업 (<Code>opengraph-image.png</Code>)
        </li>
      </Ul>

      <H2>v0.3.6-mvp — OG/Twitter 공식 락업 동기화</H2>
      <Ul>
        <li>
          <Code>opengraph-image.png</Code> · <Code>twitter-image.png</Code>를 공식 light
          락업으로 갱신
        </li>
      </Ul>

      <H2>v0.3.5-mvp — 공식 SVG 라이트/다크 락업</H2>
      <Ul>
        <li>
          공식 락업: <Code>logo-full-light/dark.svg</Code> · 심볼{" "}
          <Code>logo-mark-light/dark.svg</Code>
        </li>
        <li>
          <Code>BrandLockup</Code>이 테마 전환 · 스플래시(다크)·로그인(라이트) 강제
        </li>
        <li>
          래스터 재생성: <Code>node scripts/build-brand-assets.mjs</Code> (favicon·OG 포함)
        </li>
      </Ul>

      <H2>v0.3.4-mvp — coursee 브랜드 로고</H2>
      <Ul>
        <li>심볼만: favicon · 앱아이콘 · apple-touch · 스플래시/헤더 마크</li>
        <li>풀 로고: OG/Twitter · <Code>logo-full.png</Code> · 워드마크 coursee</li>
        <li>
          (v0.3.5에서 공식 SVG로 대체) 초기 소스 <Code>public/brand/</Code>
        </li>
      </Ul>

      <H2>v0.3.3-mvp — Wave F (페르소나 후속)</H2>
      <Ul>
        <li>지도 타일 실패 배너·다시 시도 (`FeedMap`)</li>
        <li>홈 팔로잉 레일 empty 슬롯 · 보관함 팔로잉 empty CTA</li>
        <li>데모 루프 시드 migration <Code>0015</Code></li>
        <li>여행→코스 카피 · 비활성 CTA muted · 카드 스크림 · 정렬 칩 단축</li>
        <li>
          <Code>/profile</Code> 풀페이지 · 작성「사진 없이 다음」·FollowReadyHint 대표 사진
        </li>
      </Ul>

      <H2>v0.3.2-mvp — 버전·작업기록 필수 규칙</H2>
      <Ul>
        <li>
          <Code>AGENTS.md</Code>: 사소한 수정이라도 <Code>APP_VERSION</Code> 상승 +
          HANDOFF §7 + changelog 기록 (예외 없음)
        </li>
        <li>HANDOFF §6 기록 패턴·에이전트 체크리스트와 동기화</li>
      </Ul>

      <H2>v0.3.1-mvp — 업로드 사진 엑박 수정</H2>
      <Ul>
        <li>
          <Code>next/image</Code> <Code>remotePatterns</Code>에 course-sns Supabase
          호스트 허용 (포크 원본 호스트만 있던 문제)
        </li>
        <li>Storage 업로드·지도 핀은 정상이었고, 최적화 프록시만 400이던 케이스</li>
      </Ul>

      <H2>v0.3.0-mvp — Wave E</H2>
      <Ul>
        <li>상세 전이 CTA를 좋아요/저장보다 위</li>
        <li>콜드 카드·지도 peek SpecLine 패리티 · `첫 따라가기`</li>
        <li>FollowProgressBar 실데이터 · 저장함 뱃지 차별</li>
        <li>알림 `copy` · `course_publish` (0014) · 홈 팔로잉 레일</li>
        <li>`--error` brand와 분리 · 통계 타이틀 코스 통계</li>
      </Ul>

      <H2>v0.2.0-mvp — Waves A–D · 공개 게이트</H2>
      <Ul>
        <li>A: 보관함 스택 아이콘 · peek/카드 전이 프루프 · error-soft</li>
        <li>B: CTA 톤 사다리 · 저장「따라가기」· AuthGate 전이 카피 · popular 퇴장</li>
        <li>C: success teal · 플래너 레드 예산 · walk slate</li>
        <li>D: 프로필 전이 지표 · 알림 그룹 · FollowReadyHint</li>
        <li>공개/비공개 명시 선택 (`visibilityChosen`)</li>
      </Ul>

      <H2>v0.1.0-mvp — fork 초기</H2>
      <Ul>
        <li>routdiary v1.14.21 fork · 인프라 분리</li>
        <li>브랜드 레드 + 뉴트럴 · 코스 카피·IA Phase 0–3</li>
        <li>따라가기·완주·보관함 IA</li>
      </Ul>

      <H2>문서·브랜드</H2>
      <DocTable
        headers={["항목", "내용"]}
        rows={[
          ["/deliverables", "개발·운영 가이드 (이 사이트)"],
          ["아이콘·favicon·OG", "코스 C 마크 통일 (그린 routdiary 잔상 제거)"],
          ["정본 docs", "HANDOFF · DESIGN-SYSTEM · COURSE-UX · PHOTO-FIRST-CREATE · UX-PERSONA"],
        ]}
      />

      <Note>
        SemVer는 <Code>src/lib/version.ts</Code>의 <Code>APP_VERSION</Code>이 단일 출처입니다.
        에이전트 규칙(<Code>AGENTS.md</Code>): 사소한 수정이라도 버전을 올리고 HANDOFF §7에
        작업 내용을 남깁니다.
      </Note>
    </>
  );
}
