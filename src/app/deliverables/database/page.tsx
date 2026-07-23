import { Code, DocTable, H2, Note, P, PageHeader, Ul, Warn } from "../_components/ui";

export default function DatabasePage() {
  return (
    <>
      <PageHeader
        title="DB"
        description="Supabase Postgres 스키마·권한·마이그레이션 이력을 정리합니다."
      />

      <H2>프로젝트</H2>
      <DocTable
        headers={["항목", "값"]}
        rows={[
          ["프로젝트", "course-sns"],
          ["ref", "pbyxnvtgsrwmsvxnynif"],
          ["리전", "ap-northeast-2"],
          ["routdiary와", "완전 분리 (공유 금지)"],
        ]}
      />

      <H2>핵심 테이블</H2>
      <DocTable
        headers={["테이블", "역할"]}
        rows={[
          ["profiles", "핸들·표시명·아바타"],
          ["routes", "코스 메타·공개범위·카운터(copy/completion/like)"],
          ["spots", "장소·좌표·순서·사진"],
          ["legs", "스팟 간 이동"],
          ["route_copies", "따라가기 계보 (원본→초안)"],
          ["route_completions", "다녀왔어요 후기"],
          ["likes / bookmarks", "보조 소셜"],
          ["follows", "사람 구독"],
          ["comments", "상세 댓글"],
          ["notifications", "알림 (like/comment/follow/completion/copy/course_publish)"],
        ]}
      />

      <H2>권한 (RLS)</H2>
      <Ul>
        <li>공개 코스: 누구나 SELECT</li>
        <li>비공개·초안: 소유자만</li>
        <li>알림: recipient만 읽기/읽음 처리</li>
        <li>쓰기는 authenticated + 소유/관계 정책</li>
      </Ul>

      <H2>마이그레이션</H2>
      <P>
        경로: <Code>supabase/migrations/</Code>
      </P>
      <DocTable
        headers={["파일", "내용"]}
        rows={[
          ["0001–0003", "init · storage · security"],
          ["0004–0007", "comments · oauth · visibility · notifications"],
          ["0008–0009", "route_copies · direct plan drafts"],
          ["0010–0012", "copy_count · default public · difficulty"],
          ["0013", "completions + completion 알림"],
          ["0014", "copy · course_publish 알림 트리거 (Wave E)"],
        ]}
      />
      <Warn>
        프로덕션에 <Code>0014_transfer_notifications.sql</Code> 적용 여부를 확인하세요. 미적용 시
        홈 레일·기존 UX는 동작하고, 신규 알림 타입만 대기합니다.
      </Warn>

      <H2>적용 방법</H2>
      <Ul>
        <li>
          <Code>supabase db push</Code> (CLI 링크된 프로젝트)
        </li>
        <li>또는 대시보드 SQL 에디터에 마이그레이션 파일 실행</li>
      </Ul>
      <Note>
        타입 정본: <Code>src/lib/supabase/database.types.ts</Code> — 스키마 변경 시 재생성·수동
        동기화.
      </Note>
    </>
  );
}
