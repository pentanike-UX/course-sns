# 스팟 이동 경로 — 구현 키트

> **여기부터 개발한다.** 정책만 읽지 말 것.  
> 정책 정본: [`../MAP-ROUTING.md`](../MAP-ROUTING.md) §0 (국내 네이버 · 해외 구글, 필수).  
> 웹 가이드: [`/deliverables/routing`](https://course-sns.vercel.app/deliverables/routing)

이 폴더와 `src/lib/routing/`, `src/lib/maps/` 가 **한 묶음**이다. 경로·지도 작업은 이 파일들만 채우면 된다. 새 공급자 파일을 `directions.ts`에 다시 쌓지 않는다.

**아직 외부 API를 호출하지 않는 것:** 국내 Transit/ODsay, 해외 구글 Routes. 함수·파서·모드 매핑은 준비돼 있다. fetch 본문을 채우면 `getLegPath`가 탄다.

---

## 읽기 순서 (필수)

1. [`../MAP-ROUTING.md`](../MAP-ROUTING.md) **§0** — 하지 말 것 포함
2. 이 파일 — 묶음 목록·완료 정의
3. [`FILEMAP.md`](FILEMAP.md) — 손댈 파일
4. [`CONTRACT.md`](CONTRACT.md) — 타입·POST `/api/directions`
5. 국내 → [`KR.md`](KR.md) / 해외 → [`OVERSEAS.md`](OVERSEAS.md)
6. 머지 전 [`ACCEPTANCE.md`](ACCEPTANCE.md)

---

## 고정 전제

| 지역 | 타일 | 스팟 사이 선 (모든 연속 쌍) |
|------|------|------------------------------|
| 양 끝 좌표가 남한 bbox | 네이버 Maps JS | TMAP 보행 · 네이버 driving · Transit/ODsay |
| 그 외 (해외·혼합 레그) | **구글 Maps JS** | **구글 Routes** `WALK` / `BICYCLE` / `DRIVE` / `TRANSIT` |

- 제품은 국내 전용이 아니다.
- 국내 타일을 구글·카카오로 바꾸지 않는다.
- 해외 코스를 네이버/TMAP으로만 그리지 않는다.
- 해외 스팟 사이를 점선 커넥터로 남기지 않는다 (구글 경로를 넣는다).
- 레그 공급자는 코스 `region` 문자열이 아니라 **좌표 bbox** (`src/lib/routing/region.ts`).

---

## 파일 묶음

### 서버 경로 (폴리라인 `[lng,lat]`)

| 파일 | 역할 | 지금 |
|------|------|------|
| `src/lib/routing/index.ts` | `getLegPath` — 국내/해외 분기 | 연결됨 |
| `src/lib/routing/region.ts` | 남한 bbox | 완료 |
| `src/lib/routing/providers/naver.ts` | 자동차 driving | 완료 |
| `src/lib/routing/providers/tmap-walk.ts` | 보행 | 완료 (키만) |
| `src/lib/routing/providers/tmap-transit.ts` | 국내 버스·지하철·기차 | **fetch TODO** |
| `src/lib/routing/providers/odsay.ts` | 국내 노선 그래픽 (C) | **fetch TODO** |
| `src/lib/routing/providers/google.ts` | 해외 전 수단 | **fetch TODO** |
| `src/lib/routing/polyline.ts` | 구글 폴리라인 디코드 · TMAP linestring | 완료 |
| `src/lib/directions.ts` | 하위 호환 re-export | — |

### 클라이언트 타일

| 파일 | 역할 | 지금 |
|------|------|------|
| `src/lib/maps/tiles.ts` | 스팟 → `naver` \| `google` | 완료, **미연결** |
| `src/lib/maps/google.ts` | Maps JS 로더 | 로더 완료, **지도 컴포넌트 미연결** |
| `src/lib/naver.ts` | 국내 타일 로더 | 사용 중 |

### 연결만 하면 되는 UI (아직 네이버 고정)

`RouteMap.tsx` · `RouteMapSection.tsx` · `FeedMap.tsx` · `SpotLocationPicker.tsx` · `StatsMap.tsx`  
`POST /api/directions` — 이미 `getLegPath`를 쓴다.

---

## 구현 순서

1. **국내 A** — Vercel/로컬 `TMAP_APP_KEY`. 코드 있음. 도보=차도 사라짐.
2. **국내 B 또는 C** — `tmap-transit.ts` 또는 `odsay.ts` 의 TODO fetch. 파서는 있음.
3. **해외 경로** — `providers/google.ts` TODO fetch. `buildComputeRoutesBody` / `parseGoogleRoutesResponse` 있음.
4. **해외 타일** — `RouteMap` 등이 `tileProviderForSpots` 후 `loadGoogleMaps`. 폴리라인은 같은 `[lng,lat]`.
5. 자전거 전용 도로(국내)는 카카오 제휴(D) 전엔 보행 근사 유지.

한 공급자로 국내+해외를 합치지 말 것.

---

## 환경변수 (경로·지도)

`.env.example` 참고. 구글 키는 네이버/TMAP과 **분리**.

| 변수 | 언제 |
|------|------|
| `TMAP_APP_KEY` | 국내 A·B |
| `ODSAY_API_KEY` | 국내 C (B 대신) |
| `GOOGLE_MAPS_API_KEY` | 서버 Routes (해외 선) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | 브라우저 타일 (해외 지도) |
