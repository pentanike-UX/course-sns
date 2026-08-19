# 스팟 이동 경로 — 지도에 길을 잇는 방법

> **상태:** 조사만 (2026-08-19 · `v0.4.8-mvp`). **구현하지 않음.**  
> **증상:** 레그에서 도보를 골라도 지도 선이 자동차 도로를 따른다.  
> **관련:** [`src/lib/directions.ts`](../src/lib/directions.ts) · [`/api/directions`](../src/app/api/directions/route.ts) · [`RouteMap.tsx`](../src/components/RouteMap.tsx) · 웹 가이드 [`/deliverables/development`](https://course-sns.vercel.app/deliverables/development)

타일은 **네이버 Maps JS v3**를 유지한다. 문제는 타일이 아니라 **선(폴리라인) 좌표를 어디서 받느냐**다.

---

## 1. 왜 도보인데 자동차 도로인가

네이버 Cloud **Directions 5 / 15는 자동차 길찾기만** 제공한다. 도보·자전거·대중교통 엔드포인트가 없다.

이 앱의 실제 분기 (`getLegPath`):

| 수단 | 지금 동작 |
|------|-----------|
| 자가용·택시 | 네이버 Directions `driving` |
| 버스·기차 | 마찬가지로 **driving** (도로) |
| 도보·자전거 | TMAP 보행자 API → **`TMAP_APP_KEY` 없으면 네이버 driving으로 폴백** |
| 지하철 | 경로 API 없음. 점선 커넥터만 |

운영상 `TMAP_APP_KEY`는 **미설정(⬜)** 이다. 그래서 도보를 눌러도 자동차 도로가 그려진다. 네이버가 도보 선을 주는 게 아니라, **키가 없어 driving으로 떨어지는 것**이다.

좌표계는 모두 WGS84라, 네이버 타일 위에 TMAP·ODsay 선을 올리는 것은 가능하다. 이미 그 구조다 (`RouteMap`이 `path` 좌표를 폴리라인으로 그림).

---

## 2. 수단별로 길을 이을 수 있는지

| 수단 | 네이버 | TMAP (공개) | 카카오 모빌리티 | ODsay | OSM 계열 |
|------|--------|-------------|-----------------|-------|----------|
| 도보 | ❌ driving만 | ✅ 보행자 경로. **코드 있음** (`getWalkingPath`) | ✅ 도보 API · **제휴** | — | △ 품질 들쭉날쭉 |
| 자전거 | ❌ | ❌ 전용 라우터 없음. 지금은 보행 API 근사 | ✅ 자전거 도로 옵션 · **제휴** | — | △ |
| 자가용·택시 | ✅ | ✅ 자동차 | ✅ | — | △ |
| 버스 | ❌ (driving 위장) | ✅ Transit | ✅ 통합 길찾기 · **제휴** | ✅ 길찾기+노선 그래픽 | — |
| 지하철 | ❌ 커넥터 | ✅ Transit | ✅ · **제휴** | ✅ `loadLane` 선형 | — |
| 기차 | ❌ (driving 위장) | ✅ Transit `pathType` 5 | △ | ✅ 시외·철도 | — |

대중교통은 점 A→B 한 줄이 아니다. **걸어가기 → 탑승 → 환승 → 걷기**다.

---

## 3. 가능한 방향 (우선순위)

구현하지 않은 선택지. 다음 작업 시 이 표를 따른다.

**A. TMAP 키만 넣기**  
도보(지금 코드에선 자전거도)가 보행 경로로 바뀐다. `getWalkingPath`가 이미 있다. 지하철·기차는 그대로다. **지금 증상(도보=차도)만 없애는 최소 수단.**

**B. TMAP 보행 + TMAP Transit** (`POST /transit/routes`)  
공급자 하나. 도보·버스·지하철·기차. 자전거는 여전히 보행 근사. 구간마다 후보가 여러 개라 첫 결과를 쓸지, 고르게 할지를 정해야 한다.

**C. TMAP 보행 + ODsay 대중교통**  
`searchPubTransPathT` + `loadLane`. 지하철·버스 **실제 노선 모양**을 네이버 지도에 그리기 쉽다. 공식 가이드에 네이버 폴리라인 예시가 있다. 키는 두 개.

**D. 카카오 모빌리티 제휴**  
도보·자전거·대중교통을 한 세트로 맞출 수 있다. 계약 전에는 불가.

**E. 대중교통은 도로로 그리지 않기**  
키를 안 넣을 거면 지하철·기차는 **점선 커넥터**가 정직하다. 기차에 driving을 쓰는 지금이 더 어색하다.

하지 않는 편: 지도 엔진을 카카오로 교체, 구글 길찾기(한국 보행·대중교통 약함), 네이버에 도보 API가 생기길 기다리기.

---

## 4. 참고 엔드포인트

- 네이버 driving: `https://maps.apigw.ntruss.com/map-direction/v1/driving` (자동차만)
- TMAP 보행: `https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1`
- TMAP 대중교통: `https://apis.openapi.sk.com/transit/routes`
- ODsay: `searchPubTransPathT`, `loadLane` (lab.odsay.com)

## 5. 다음에 손댈 때

1. 도보 차도 위장만 고치려면 **A** (Vercel `TMAP_APP_KEY`).
2. 지하철·버스·기차 노선까지면 **B 또는 C**.
3. 자전거 전용 도로는 공개 TMAP으로는 어렵고 **D** 또는 OSM 근사.
4. 구현 시에도 타일은 네이버, 선만 다른 API. `directions.ts` 분기를 늘리면 된다.
