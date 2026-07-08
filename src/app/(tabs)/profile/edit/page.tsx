import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import ProfileEditForm from "./ProfileEditForm";

export default async function ProfileEditPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login?next=/profile/edit");

  return (
    <ProfileEditForm
      initial={{
        displayName: me.displayName,
        handle: me.handle,
        avatarUrl: me.avatarUrl,
      }}
    />
  );
}
