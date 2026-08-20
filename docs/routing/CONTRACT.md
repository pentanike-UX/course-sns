# 계약 — 타입 · API · 수단 매핑

## `getLegPath`

```ts
getLegPath(
  mode: TransportMode,
  start: { lat: number; lng: number },
  goal: { lat: number; lng: number },
): Promise<[lng: number, lat: number][] | null>
```

- `null` 또는 점 2개 미만 → 호출측이 커넥터(점선)를 그림.
- 해외에서 수단이 `walk|bike|car|taxi|bus|subway|train` 이면 **null을 완료로 보지 않는다.** 구글 fetch를 채운다.
- `other` 만 커넥터가 정답이다.

`TransportMode`: `walk` `bike` `car` `taxi` `bus` `subway` `train` `other` (`src/lib/types.ts`).

## POST `/api/directions`

로그인 필요. 최대 12 레그.

요청:

```json
{
  "legs": [
    {
      "from": { "lat": 37.5665, "lng": 126.978 },
      "to": { "lat": 37.5796, "lng": 126.977 },
      "transport": "walk"
    }
  ]
}
```

응답: `{ "paths": [ [[lng,lat], ...], null ] }` — `legs`와 같은 순서.

클라 `RouteMap`은 path가 없는 routable 레그만 이 API로 보충한다.

## 국내 수단 → 공급자

| mode | 1순위 | 없으면 |
|------|--------|--------|
| walk, bike | TMAP pedestrian (`tmap-walk.ts`) | 네이버 driving (차도 위장 — A 키로 제거) |
| car, taxi | 네이버 driving | null |
| bus, train | TMAP Transit 또는 ODsay | 네이버 driving (노선 아님, B/C로 제거) |
| subway | TMAP Transit 또는 ODsay | **null** (커넥터). driving 쓰지 말 것 |
| other | — | null |

## 해외 수단 → 구글 `travelMode`

`src/lib/routing/providers/google.ts` `toGoogleTravelMode`

| mode | Google |
|------|--------|
| walk | `WALK` |
| bike | `BICYCLE` |
| car, taxi | `DRIVE` |
| bus | `TRANSIT` + allowed `BUS` |
| subway | `TRANSIT` + `SUBWAY` |
| train | `TRANSIT` + `TRAIN` `RAIL` `LIGHT_RAIL` |
| other | 요청하지 않음 |

해외는 **모든 연속 스팟 쌍**을 이 표로 요청한다. 일부만 잇고 나머지를 커넥터로 두지 않는다.

## 지역 판정

`inferLegRegion(start, goal)`  
둘 다 `KR_BOUNDS`(제주·울릉·독도 포함 남한 bbox) 안 → `korea`, 아니면 `overseas`.

타일: `inferCourseTiles(spots)` / `tileProviderForSpots` — 위치 있는 스팟이 **모두** 국내여야 네이버.

## 응답 좌표

WGS84. `[lng, lat]`. TMAP·ODsay·구글 디코드 결과를 이 형식으로 맞춘 뒤 `RouteMap`에 넘긴다.
