import RouteForm from "@/components/RouteForm";
import { getMyDefaultVisibility } from "@/lib/data";
import { isPlaceSearchEnabled } from "@/lib/places";

export default async function NewRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const intent = type === "plan" ? "plan" : "record";
  // WAVE-G: record 분기는 PHOTO-FIRST-CREATE.md 4화면 위자드로 교체. plan은 플래너 유지.
  const defaultVisibility = intent === "plan" ? "private" : await getMyDefaultVisibility();

  return (
    <RouteForm
      mode="create"
      intent={intent}
      defaultVisibility={defaultVisibility}
      placeSearchEnabled={isPlaceSearchEnabled()}
    />
  );
}
