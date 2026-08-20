import Link from "next/link";
import { Code, DocTable, H2, H3, Note, P, PageHeader, Ul, Warn } from "../_components/ui";

export default function RoutingKitPage() {
  return (
    <>
      <PageHeader
        title="경로 구현 키트"
        description="스팟 사이 이동 경로를 실제로 붙일 때 여는 묶음입니다. 정책(§0)을 읽은 뒤 여기 파일만 채웁니다."
      />

      <Warn>
        개발 시작 전{" "}
        <Link
          href="/deliverables/development#routing-next"
          className="font-semibold underline-offset-2 hover:underline"
        >
          가능한 방향 (필수)
        </Link>
        를 읽습니다. 제품은 국내 전용이 아닙니다. 해외는 구글 지도로{" "}
        <strong className="font-semibold">모든 연속 스팟 쌍</strong>의 경로를 잇습니다.
      </Warn>

      <H2>한 줄</H2>
      <P>
        코딩 진입점: 저장소 <Code>docs/routing/README.md</Code> · 코드{" "}
        <Code>src/lib/routing/</Code> · 타일 <Code>src/lib/maps/</Code>.{" "}
        <Code>directions.ts</Code>에 공급자를 다시 쌓지 않습니다.
      </P>

      <H2>읽기 순서</H2>
      <Ul>
        <li>
          정책 <Code>docs/MAP-ROUTING.md</Code> §0
        </li>
        <li>
          키트 README · FILEMAP · CONTRACT
        </li>
        <li>
          국내 <Code>docs/routing/KR.md</Code> / 해외 <Code>docs/routing/OVERSEAS.md</Code>
        </li>
        <li>
          머지 전 <Code>docs/routing/ACCEPTANCE.md</Code>
        </li>
      </Ul>

      <H2>서버 경로 파일 (`src/lib/routing`)</H2>
      <DocTable
        headers={["파일", "역할", "지금"]}
        rows={[
          ["index.ts", "getLegPath — 국내/해외 분기", "연결됨"],
          ["region.ts", "남한 bbox", "완료"],
          ["providers/naver.ts", "자동차 driving", "완료"],
          ["providers/tmap-walk.ts", "보행", "완료 (키만)"],
          ["providers/tmap-transit.ts", "국내 버스·지하철·기차", "fetch TODO"],
          ["providers/odsay.ts", "국내 노선 그래픽", "fetch TODO"],
          ["providers/google.ts", "해외 전 수단 Routes", "fetch TODO"],
          ["polyline.ts", "구글 디코드 · TMAP linestring", "완료"],
        ]}
      />

      <H2>타일 파일 (`src/lib/maps`)</H2>
      <DocTable
        headers={["파일", "역할", "지금"]}
        rows={[
          ["tiles.ts", "스팟 → naver | google", "완료, RouteMap 미연결"],
          ["google.ts", "Maps JS 로더", "로더 완료, UI 미연결"],
          ["lib/naver.ts", "국내 타일", "사용 중"],
        ]}
      />

      <H3>UI에서 이어서 연결</H3>
      <P>
        <Code>RouteMap.tsx</Code> (1순위) · <Code>FeedMap.tsx</Code> ·{" "}
        <Code>SpotLocationPicker.tsx</Code> · <Code>StatsMap.tsx</Code>. 상세 서버 선은 이미{" "}
        <Code>getLegPath</Code>를 탑니다.
      </P>

      <H2>구현 순서</H2>
      <Ul>
        <li>
          <strong className="font-semibold text-ink">A</strong> — <Code>TMAP_APP_KEY</Code> (도보=차도
          제거). 코드 있음
        </li>
        <li>
          <strong className="font-semibold text-ink">B 또는 C</strong> — Transit 또는 ODsay fetch
        </li>
        <li>
          <strong className="font-semibold text-ink">해외 선</strong> —{" "}
          <Code>providers/google.ts</Code> computeRoutes
        </li>
        <li>
          <strong className="font-semibold text-ink">해외 타일</strong> —{" "}
          <Code>tileProviderForSpots</Code> + <Code>loadGoogleMaps</Code>
        </li>
      </Ul>

      <H2>환경변수</H2>
      <DocTable
        headers={["변수", "용도"]}
        rows={[
          ["TMAP_APP_KEY", "국내 보행 · (B) Transit"],
          ["ODSAY_API_KEY", "국내 C, B 대신"],
          ["GOOGLE_MAPS_API_KEY", "서버 Routes. NEXT_PUBLIC 금지"],
          ["NEXT_PUBLIC_GOOGLE_MAPS_KEY", "브라우저 해외 타일"],
        ]}
      />

      <Note>
        파서와 모드 매핑은 코드에 있습니다. TODO fetch를 채우면 <Code>getLegPath</Code>가 자동으로
        해당 공급자를 씁니다. 빈 스텁을 완료로 표시하지 마세요.
      </Note>
    </>
  );
}
