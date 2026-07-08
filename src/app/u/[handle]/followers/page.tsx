import { notFound } from "next/navigation";
import MobileFrame from "@/components/MobileFrame";
import SlideOver from "@/components/SlideOver";
import AppHeader from "@/components/AppHeader";
import PeopleList from "@/components/PeopleList";
import { getFollowConnections } from "@/lib/data";

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getFollowConnections(decodeURIComponent(handle), "followers");
  if (!data) notFound();

  return (
    <MobileFrame shell>
      <SlideOver fallback={`/u/${data.owner.handle}`}>
        <AppHeader back={`/u/${data.owner.handle}`} title="팔로워" />
        <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-3">
          <PeopleList
            people={data.people}
            emptyTitle="아직 팔로워가 없어요"
            emptyBody={`${data.owner.displayName}님을 팔로우하는 사람이 여기에 모여요.`}
          />
        </main>
      </SlideOver>
    </MobileFrame>
  );
}
