# 파일 지도 — 어디를 고치면 되는가

`getLegPath` 호출 경로와 타일 로더. 새 Directions 로직을 컴포넌트에 넣지 말 것.

```
[좌표 있는 연속 스팟 쌍]
        │
        ├─ RSC: RouteMapSection → getLegPath (@/lib/directions → @/lib/routing)
        │
        └─ 클라: RouteMap fetch POST /api/directions
                    │
                    └─ getLegPath
                         ├─ inferLegRegion (region.ts)
                         ├─ korea  → getKoreaLegPath
                         │            walk/bike → tmap-walk → (없으면) naver driving
                         │            car/taxi  → naver driving
                         │            bus/subway/train → tmap-transit → odsay
                         │                              (없으면 bus/train은 driving, subway는 null)
                         └─ overseas → getGoogleLegPath  (지금 null)
```

## 반드시 이 파일에서만 경로를 계산

| 할 일 | 파일 | 하지 말 것 |
|--------|------|------------|
| 국내/해외 분기 | `src/lib/routing/index.ts` | `RouteMap`에서 공급자 하드코딩 |
| bbox | `src/lib/routing/region.ts` | `route.region` 문자열로 한국/해외 판단 |
| 네이버 차 | `providers/naver.ts` | 도보 API가 생기길 기다림 |
| 국내 도보 | `providers/tmap-walk.ts` | 키 없이 driving을 “도보”로 포장하는 새 코드 |
| 국내 대중교통 | `tmap-transit.ts` **또는** `odsay.ts` | 지하철에 driving |
| 해외 전 수단 | `providers/google.ts` | 해외 레그를 네이버/TMAP에 넣기 |
| 타일 선택 | `src/lib/maps/tiles.ts` | 국내 코스에 구글 타일 |
| 구글 지도 SDK | `src/lib/maps/google.ts` | 서버 키를 `NEXT_PUBLIC_` 으로 노출 |
| 폴리라인 그리기 | `RouteMap.tsx` (`path: [lng,lat][]`) | 공급자별 그리기 로직 분기(좌표 형식은 통일) |

## UI에서 손댈 곳 (타일 연결 시)

| 파일 | 지금 | 다음 |
|------|------|------|
| `src/components/RouteMap.tsx` | 항상 `loadNaverMaps` | `tileProviderForSpots` → 네이버 또는 `loadGoogleMaps`. 선은 `leg.path` 그대로 |
| `src/app/routes/[id]/RouteMapSection.tsx` | `getLegPath` (OK) | 변경 없음 (서버 경로) |
| `src/app/api/directions/route.ts` | `getLegPath` (OK) | 변경 없음. 게스트 시트도 로그인 필요 유지 |
| `src/app/(tabs)/feed/FeedMap.tsx` | 네이버 핀 | 뷰포트에 해외 핀이면 구글 타일. 경로는 상세 `RouteMap` |
| `src/components/SpotLocationPicker.tsx` | 네이버 피커 | 해외 스팟 편집 시 구글 |
| `src/app/(tabs)/profile/stats/StatsMap.tsx` | 네이버 | 동일 규칙 |
| `src/components/RouteForm.tsx` | 네이버 역지오코딩 | 해외 주소는 구글 Geocoding (별도 작업, 경로 PR과 섞지 말 것) |

## 좌표 형식

앱 전체 폴리라인은 **`[lng, lat]`**. 구글 JS `LatLng`는 `(lat, lng)` — 그릴 때만 뒤집는다. `decodePolyline`은 이미 `[lng,lat]`을 반환한다.

## 캐시

`src/lib/routing/cache.ts` — 프로세스 메모리 + fetch `revalidate: 86400`. 공급자 키에 prefix (`kr:drive`, `ov:WALK` …).
