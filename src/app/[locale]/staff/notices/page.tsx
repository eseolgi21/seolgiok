"use client";

import { useEffect, useState } from "react";
import {
  List, ListItem, ListItemButton, ListItemText,
  Typography, Divider, CircularProgress, Box,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

type Notice = { id: string; title: string; publishedAt: string | null; createdAt: string };

export default function NoticesPage() {
  const t = useTranslations("staffPortal");
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/notices")
      .then(r => r.json())
      .then(d => { if (d.ok) setNotices(d.posts); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t("notices.pageTitle")}</Typography>
      {loading ? (
        <CircularProgress />
      ) : notices.length === 0 ? (
        <Typography color="text.secondary">{t("notices.empty")}</Typography>
      ) : (
        <List disablePadding>
          {notices.map((n, i) => (
            <Box key={n.id}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => router.push(`/staff/notices/${n.id}`)}
                >
                  <ListItemText
                    primary={n.title}
                    secondary={new Date(n.publishedAt ?? n.createdAt).toLocaleDateString()}
                  />
                </ListItemButton>
              </ListItem>
              {i < notices.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}
