"use client";

import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Box, Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ChatIcon from "@mui/icons-material/Chat";
import LogoutIcon from "@mui/icons-material/Logout";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { USER_LEVELS } from "@/lib/constants/user-levels";

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { key: "notices",        icon: NotificationsIcon, href: "/staff/notices",          managerOnly: false },
  { key: "attendance",     icon: AccessTimeIcon,    href: "/staff/attendance",       managerOnly: false },
  { key: "handover",       icon: AssignmentIcon,    href: "/staff/handover",         managerOnly: false },
  { key: "handoverManage", icon: EditNoteIcon,      href: "/staff/handover/manage",  managerOnly: true  },
  { key: "awards",         icon: EmojiEventsIcon,   href: "/staff/awards",           managerOnly: false },
  { key: "suggestions",    icon: ChatIcon,          href: "/staff/suggestions",      managerOnly: false },
] as const;

type Props = { userName: string; userLevel: number };

export default function StaffSidebar({ userName, userLevel }: Props) {
  const t = useTranslations("staffPortal");
  const locale = useLocale();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.assign(`/${locale}`);
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.managerOnly || userLevel >= USER_LEVELS.MANAGER
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
      }}
    >
      <Toolbar sx={{ flexDirection: "column", alignItems: "flex-start", py: 2 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>{t("shell.title")}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{userName}</Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {visibleItems.map(({ key, icon: Icon, href }) => (
          <ListItemButton
            key={key}
            component={Link}
            href={href}
            selected={pathname.includes(href)}
          >
            <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
            <ListItemText primary={t(`nav.${key}`)} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t("shell.logout")} />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
