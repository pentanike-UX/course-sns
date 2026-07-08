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
