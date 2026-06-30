"use client";

import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ChatIcon from "@mui/icons-material/Chat";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

const NAV_ITEMS = [
  { key: "notices",     icon: NotificationsIcon, path: "notices" },
  { key: "attendance",  icon: AccessTimeIcon,    path: "attendance" },
  { key: "handover",    icon: AssignmentIcon,    path: "handover" },
  { key: "awards",      icon: EmojiEventsIcon,   path: "awards" },
  { key: "suggestions", icon: ChatIcon,          path: "suggestions" },
] as const;

export default function StaffBottomNav() {
  const t = useTranslations("staffPortal");
  const router = useRouter();
  const pathname = usePathname();

  const currentValue = NAV_ITEMS.findIndex(({ path }) => pathname.includes(`/staff/${path}`));

  return (
    <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={currentValue === -1 ? 0 : currentValue}
        onChange={(_, newValue) => {
          router.push(`/staff/${NAV_ITEMS[newValue].path}`);
        }}
      >
        {NAV_ITEMS.map(({ key, icon: Icon }) => (
          <BottomNavigationAction key={key} label={t(`nav.${key}`)} icon={<Icon />} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
