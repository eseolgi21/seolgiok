"use client";

import { Box, AppBar, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import StaffSidebar from "./StaffSidebar";
import StaffBottomNav from "./StaffBottomNav";

type Props = { children: React.ReactNode; userName: string };

export default function StaffShell({ children, userName }: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const t = useTranslations("staffPortal");

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {isDesktop && <StaffSidebar userName={userName} />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ...(isDesktop ? { ml: 0 } : { pb: "56px" }),
        }}
      >
        {!isDesktop && (
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar variant="dense">
              <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
                {t("shell.title")}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>{userName}</Typography>
            </Toolbar>
          </AppBar>
        )}
        <Box sx={{ p: 2 }}>{children}</Box>
      </Box>

      {!isDesktop && <StaffBottomNav />}
    </Box>
  );
}
