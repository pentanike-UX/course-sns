import MobileFrame from "@/components/MobileFrame";
import RouteDetailLoadingShell from "./RouteDetailLoadingShell";

export default function RouteDetailLoading() {
  return (
    <MobileFrame shell immersive>
      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
        <RouteDetailLoadingShell />
      </main>
    </MobileFrame>
  );
}
