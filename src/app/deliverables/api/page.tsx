import { Code, DocTable, H2, Note, P, PageHeader, Ul } from "../_components/ui";

export default function ApiPage() {
  return (
    <>
      <PageHeader
        title="API"
        description="REST 엔드포인트와 Server Actions 위치를 정리합니다. 대부분의 쓰기는 Server Actions입니다."
      />

      <H2>REST (`src/app/api`)</H2>
      <DocTable
        headers={["메서드", "경로", "인증", "용도"]}
        rows={[
          ["GET", "/api/routes/[id]", "필요", "코스 JSON"],
          ["GET", "/api/places?q=", "필요", "장소 키워드 검색"],
          ["GET", "/api/map-points", "필요", "지도 핀 뷰포트 조회"],
          ["GET", "/api/people?q=", "필요", "회원 검색 (보관함)"],
          ["POST", "/api/directions", "필요", "경로(차량/보행)"],
        ]}
      />
      <Note>게스트 UI는 서버 컴포넌트·data.ts로 공개 피드를 읽고, API는 주로 로그인 세션용입니다.</Note>

      <H2>Server Actions</H2>
      <DocTable
        headers={["파일", "주요 액션"]}
        rows={[
          ["login/actions.ts", "signIn · signUp · signOut"],
          ["routes/new/actions.ts", "create/update/deleteRoute · 사진 서명 URL"],
          [
            "routes/[id]/actions.ts",
            "like/bookmark · copyRoute · convertPlan · comments · submitCompletion",
          ],
          ["u/[handle]/actions.ts", "toggleFollow"],
          ["notifications/actions.ts", "markNotificationsRead"],
          ["profile/actions.ts", "updateProfile · avatar · defaultVisibility · deleteAccount"],
        ]}
      />

      <H2>데이터 읽기</H2>
      <P>
        서버 컴포넌트는 <Code>src/lib/data.ts</Code>의 함수를 호출합니다. 예:{" "}
        <Code>getPublicFeed</Code>, <Code>getFeedMapPoints</Code>,{" "}
        <Code>getMyFollowedCourses</Code>, <Code>getFollowingCourseStream</Code>,{" "}
        <Code>getNotifications</Code>.
      </P>

      <H2>패턴</H2>
      <Ul>
        <li>
          <Code>&quot;use server&quot;</Code> + Supabase 서버 클라이언트
        </li>
        <li>
          성공 시 <Code>revalidatePath</Code> / <Code>redirect</Code>
        </li>
        <li>
          게스트 차단 시 <Code>{`{ error, needsAuth: true }`}</Code> → AuthGate
        </li>
      </Ul>
    </>
  );
}
