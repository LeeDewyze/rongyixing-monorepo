import { PROFILE_ASSETS } from "@/config/profile-assets";
import { withAvatarCacheBuster } from "@/lib/avatar";

/** Figma 23:2495 — 72px circular avatar, shared with H5 ProfileHeader. */
export function ProfileAvatar({ src }: { src?: string }) {
  return (
    <img
      src={withAvatarCacheBuster(src || PROFILE_ASSETS.defaultAvatar)}
      alt="头像"
      className="box-border size-[72px] shrink-0 rounded-full border border-brand-primary object-cover"
    />
  );
}
