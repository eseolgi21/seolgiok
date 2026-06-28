"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Fab, List, ListItem, ListItemText,
  Chip, CircularProgress,
} from "@mui/material";
import { useTranslations } from "next-intl";

type Log = { id: string; type: "CLOCK_IN" | "CLOCK_OUT"; clockedAt: string };

export default function AttendancePage() {
  const t = useTranslations("staffPortal");
  const [logs, setLogs] = useState<Log[]>([]);
  const [lastType, setLastType] = useState<"CLOCK_IN" | "CLOCK_OUT" | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = useCallback(() => {
    fetch("/api/staff/attendance")
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setLogs(d.logs);
          setLastType(d.lastType);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleClock = async (type: "CLOCK_IN" | "CLOCK_OUT") => {
    setSubmitting(true);
    const res = await fetch("/api/staff/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    if (data.ok) fetchLogs();
    setSubmitting(false);
  };

  const nextAction = lastType === "CLOCK_IN" ? "CLOCK_OUT" : "CLOCK_IN";

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t("attendance.pageTitle")}</Typography>
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        {submitting ? (
          <CircularProgress size={64} />
        ) : (
          <Fab
            variant="extended"
            size="large"
            color={nextAction === "CLOCK_IN" ? "success" : "error"}
            onClick={() => handleClock(nextAction)}
            sx={{ width: 180, height: 64, fontSize: "1.2rem" }}
          >
            {nextAction === "CLOCK_IN" ? t("attendance.clockIn") : t("attendance.clockOut")}
          </Fab>
        )}
      </Box>
      <Typography variant="subtitle2" gutterBottom>{t("attendance.history")}</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <List dense>
          {logs.map(log => (
            <ListItem key={log.id}>
              <ListItemText
                primary={
                  <Chip
                    label={log.type === "CLOCK_IN" ? t("attendance.clockIn") : t("attendance.clockOut")}
                    color={log.type === "CLOCK_IN" ? "success" : "default"}
                    size="small"
                  />
                }
                secondary={new Date(log.clockedAt).toLocaleTimeString()}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
