/** Selectable values for the route meta sheets (theme / recommended-for / mood). */

export const THEME_OPTIONS = [
  "힐링",
  "드라이브",
  "맛집투어",
  "카페투어",
  "자연·풍경",
  "바다",
  "산·등산",
  "역사·문화",
  "예술·전시",
  "야경",
  "산책",
  "액티비티",
  "캠핑",
  "쇼핑",
  "사진맛집",
  "온천·스파",
  "축제",
  "도심",
];

export const RECOMMEND_OPTIONS = [
  "혼자",
  "연인과",
  "친구와",
  "가족과",
  "아이와",
  "부모님과",
  "반려동물과",
  "뚜벅이",
  "드라이버",
  "미식가",
  "사진 좋아하는 분",
  "액티비티 좋아하는 분",
  "쉼이 필요한 분",
  "입문자",
];

export type MoodLevel = { key: string; emoji: string; label: string };

/** Mood scale top (happiest) → bottom (saddest), shown on the thermometer. */
export const MOOD_LEVELS: MoodLevel[] = [
  { key: "ecstatic", emoji: "😆", label: "들뜬·황홀한" },
  { key: "happy", emoji: "😊", label: "행복한" },
  { key: "excited", emoji: "🙂", label: "설레는" },
  { key: "calm", emoji: "😌", label: "잔잔한·충만한" },
  { key: "wistful", emoji: "😕", label: "아쉬운" },
  { key: "lonely", emoji: "😢", label: "쓸쓸한" },
  { key: "tearful", emoji: "😭", label: "먹먹한" },
];

export function moodByLabel(label?: string): MoodLevel | undefined {
  if (!label) return undefined;
  return MOOD_LEVELS.find((m) => m.label === label);
}
