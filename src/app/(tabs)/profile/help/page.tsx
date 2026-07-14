import AppHeader from "@/components/AppHeader";

const FAQ = [
  {
    q: "코스가 뭔가요?",
    a: "따라갈 수 있는 이동 동선이에요. 스팟(장소)과 그 사이 이동(도보·자가용·지하철 등), 추천 대상·팁을 함께 담아요.",
  },
  {
    q: "비공개와 공개의 차이는?",
    a: "비공개 코스는 나만 볼 수 있어요. 공개로 바꾸면 둘러보기에 노출되고, 다른 사람이 따라가기·좋아요·저장·댓글을 남길 수 있어요.",
  },
  {
    q: "지도에 경로는 어떻게 그려지나요?",
    a: "스팟 위치를 지도에서 찍으면 좌표가 저장돼요. 자가용·택시 등 도로 이동은 실제 도로를 따라, 도보·지하철은 곡선으로 이어 그려요.",
  },
  {
    q: "저장과 좋아요는 어디서 모아 보나요?",
    a: "하단 탭의 보관함에서 저장·좋아요한 코스를 모아 볼 수 있어요. 카드의 아이콘을 누르면 바로 해제돼요.",
  },
  {
    q: "프로필 사진과 닉네임을 바꾸고 싶어요.",
    a: "프로필 화면의 ‘프로필 편집’에서 아바타·닉네임·핸들을 바꿀 수 있어요.",
  },
];

export default function HelpPage() {
  return (
    <>
      <AppHeader back="/profile" title="도움말" />
      <section className="px-4 pt-4 pb-8">
        <ul className="space-y-3">
          {FAQ.map((item) => (
            <li
              key={item.q}
              className="rounded-[var(--radius-card)] border border-line bg-card p-4"
            >
              <h3 className="text-[14px] font-bold text-ink">Q. {item.q}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{item.a}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-[12px] text-ink-faint">
          더 궁금한 점은 코스 팀에 알려주세요.
        </p>
      </section>
    </>
  );
}
