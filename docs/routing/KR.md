# 국내 구현 — A → B 또는 C

타일은 **네이버 유지**. 여기 작업은 선(폴리라인)만.

## A. TMAP 키 (최소, 코드 완료)

1. [SK Open API](https://openapi.sk.com) 에서 앱 키.
2. `.env.local` + Vercel Production `TMAP_APP_KEY`.
3. 서울 도보 레그 상세 지도가 **보행로**를 따르는지 확인. 자동차 전용도로를 타면 실패.

파일: `src/lib/routing/providers/tmap-walk.ts` — 수정할 필요 없음.

자전거는 전용 라우터가 없다. A에서는 보행 API 근사. 전용 도로는 D(카카오 제휴).

## B. TMAP Transit (버스·지하철·기차)

파일: `src/lib/routing/providers/tmap-transit.ts`

채울 곳: `getTmapTransitPath` 의 `TODO(routing-B)`.

```
POST https://apis.openapi.sk.com/transit/routes
Header: appKey, Content-Type: application/json
Body:
{
  "startX": <lng>,
  "startY": <lat>,
  "endX": <lng>,
  "endY": <lat>,
  "lang": 0,
  "format": "json",
  "count": 1,
  "searchDttm": "<YYYYMMDDhhmm>"
}
```

파서: `parseTmapTransitResponse` (itinerary[0] `passShape.linestring`).  
MVP: **첫 결과**. UI에서 고르기는 후속.

`getKoreaLegPath`는 이미 Transit → ODsay 순으로 호출한다. fetch만 되면 버스·지하철·기차가 바뀐다. 지하철에 driving 폴백을 넣지 말 것 (이미 없음).

## C. ODsay (노선 그래픽) — B 대신 또는 보강

파일: `src/lib/routing/providers/odsay.ts`  
키: `ODSAY_API_KEY`

1. `GET https://api.odsay.com/v1/api/searchPubTransPathT?SX=&SY=&EX=&EY=&apiKey=`
2. `result.path[0].info.mapObj`
3. `GET https://api.odsay.com/v1/api/loadLane?mapObject=<mapObj>&apiKey=`
4. `parseOdsayLaneResponse`

네이버 폴리라인 예시가 ODsay 가이드에 있다. 타일이 네이버라 맞추기 쉽다.

B와 C를 동시에 켜면 Transit이 이긴다 (`index.ts`). 하나만 켜도 된다.

## E. 키를 안 넣을 때

지하철·(가능하면 기차)는 점선이 정직하다. 기차에 driving을 새로 넣지 말 것. 지금은 하위 호환으로 버스·기차만 driving 폴백.

## D. 카카오 모빌리티

계약 전 코드 넣지 말 것. 파일도 만들지 말 것.

## 하지 말 것

- 국내 타일을 카카오/구글로 교체
- 네이버 도보 API를 기다리며 A를 미루기
- 해외 좌표를 이 국내 스택으로 보내기 (`inferLegRegion`이 가른다)
