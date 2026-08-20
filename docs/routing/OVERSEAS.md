# 해외 구현 — 구글 타일 + 모든 스팟 사이 경로

정책: 해외에서는 구글이 **타일과 길찾기**를 같이 맡는다. 연속 스팟 쌍을 빠짐없이, 선택한 수단의 실제 경로로 잇는다.

## 키 (반드시 분리)

| 변수 | 사용처 | 제한 |
|------|--------|------|
| `GOOGLE_MAPS_API_KEY` | 서버 `providers/google.ts` Routes | IP 제한 권장. `NEXT_PUBLIC_` 금지 |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | 브라우저 `src/lib/maps/google.ts` | HTTP referrer: localhost + 프로덕션 |
| (선택) `GOOGLE_ROUTES_API_KEY` | Routes만 다른 키일 때 | `google.ts`가 `GOOGLE_MAPS_API_KEY` 다음으로 읽음 |

Cloud에서 활성화: **Maps JavaScript API**, **Routes API** (또는 레거시 Directions API). 빌링 계정 필수. 네이버/TMAP 키와 프로젝트 혼용 금지.

국내 코스에 이 키로 타일을 바꾸지 않는다.

## 1. 서버 경로 — `src/lib/routing/providers/google.ts`

채울 곳: `getGoogleLegPath` 의 `TODO(routing-overseas)`.

이미 있는 것:

- `buildComputeRoutesBody(mode, start, goal)`
- `parseGoogleRoutesResponse` → `decodePolyline` → `[lng,lat][]`
- `toGoogleTravelMode` / `googleTransitAllowedModes`

호출:

```
POST https://routes.googleapis.com/directions/v2:computeRoutes
X-Goog-Api-Key: <GOOGLE_MAPS_API_KEY>
X-Goog-FieldMask: routes.polyline.encodedPolyline
Content-Type: application/json
```

본문은 `buildComputeRoutesBody`. `null`이면(`other`) 요청하지 않는다.

실패·쿼터·무경로는 `null`. 예외를 삼키고 커넥터로 떨어지게 하되, **해외 walk/drive/transit가 항상 null이면 미완료.**

레거시 Directions API를 써도 된다. 그때도 결과는 `[lng,lat][]` 로 맞춘다. `decodePolyline` 재사용.

### 모든 스팟 쌍

`RouteMapSection`은 위치 있는 스팟을 순서대로 쌍을 만든다. 서버 `getLegPath`가 구글을 반환하면 된다. 일부 레그만 요청하고 나머지를 빼지 말 것. `/api/directions` MAX_LEGS=12 — 스팟이 더 많으면 이 상한을 올리는 작업을 경로 PR에 포함한다.

## 2. 타일 — `src/lib/maps/google.ts` + UI

로더 `loadGoogleMaps()` 는 준비됨. 연결:

```ts
import { tileProviderForSpots } from "@/lib/maps/tiles";
import { loadGoogleMaps } from "@/lib/maps/google";
import { loadNaverMaps } from "@/lib/naver";

const tiles = tileProviderForSpots(spots);
if (tiles === "google") await loadGoogleMaps();
else await loadNaverMaps();
```

1차 연결 대상: **`RouteMap.tsx`** (상세·미리보기 선이 여기).  
이어서 `FeedMap`, `SpotLocationPicker`, `StatsMap`.

구글 `Polyline` path는 `{lat, lng}` — `leg.path`의 `[lng,lat]`을 뒤집는다. 스타일(`TRANSPORT_COLOR`)은 유지.

혼합 코스(국내+해외 스팟): 타일은 구글, 레그 선은 쌍마다 `inferLegRegion` (국내 쌍은 TMAP/네이버 좌표를 구글 타일 위에 올려도 WGS84라 가능).

## 3. 하지 말 것

- 해외 코스를 네이버 타일 + 네이버 driving만으로 표시
- 해외 스팟 사이를 점선만으로 출시
- 서버 Routes 키를 클라에 넣기
- 국내 전용 코스 타일을 구글로 교체
