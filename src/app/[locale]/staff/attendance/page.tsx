"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Fab, List, ListItem, ListItemText,
  Chip, CircularProgress, Alert,
} from "@mui/material";
import { useTranslations } from "next-intl";

type Log = { id: string; type: "CLOCK_IN" | "CLOCK_OUT"; clockedAt: string };

type Coords = { latitude: number; longitude: number };

type GeoErrorCode = "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED";

function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject({ code: "UNSUPPORTED" } as { code: GeoErrorCode });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => {
        if (err.code === 1) reject({ code: "PERMISSION_DENIED" } as { code: GeoErrorCode });
        else if (err.code === 2) reject({ code: "POSITION_UNAVAILABLE" } as { code: GeoErrorCode });
        else if (err.code === 3) reject({ code: "TIMEOUT" } as { code: GeoErrorCode });
        else reject({ code: "UNSUPPORTED" } as { code: GeoErrorCode });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  });
}

export default function AttendancePage() {
  const t = useTranslations("staffPortal");
  const [logs, setLogs] = useState<Log[]>([]);
  const [lastType, setLastType] = useState<"CLOCK_IN" | "CLOCK_OUT" | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);
    setLocating(true);

    let coords: Coords;
    try {
      coords = await getCurrentPosition();
    } catch (err) {
      setLocating(false);
      const code = (err as { code?: GeoErrorCode })?.code;
      if (code === "PERMISSION_DENIED") {
        setErrorMessage(t("attendance.locationPermissionDenied"));
      } else if (code === "POSITION_UNAVAILABLE") {
        setErrorMessage(t("attendance.locationUnavailable"));
      } else if (code === "TIMEOUT") {
        setErrorMessage(t("attendance.locationTimeout"));
      } else {
        setErrorMessage(t("attendance.locationUnsupported"));
      }
      return;
    }
    setLocating(false);

    setSubmitting(true);
    try {
      const res = await fetch("/api/staff/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, latitude: coords.latitude, longitude: coords.longitude }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchLogs();
      } else {
        switch (data.code) {
          case "OUT_OF_RANGE":
            setErrorMessage(
              t("attendance.outOfRange", {
                distance: Math.round(data.distanceMeters),
                radius: data.radiusMeters,
              })
            );
            break;
          case "STORE_LOCATION_NOT_CONFIGURED":
            setErrorMessage(t("attendance.storeLocationNotConfigured"));
            break;
          case "STORE_NOT_ASSIGNED":
            setErrorMessage(t("attendance.storeNotAssigned"));
            break;
          case "INVALID_LOCATION":
            setErrorMessage(t("attendance.genericError"));
            break;
          case "ALREADY_CLOCKED_IN":
            setErrorMessage(t("attendance.alreadyClockedIn"));
            break;
          case "ALREADY_CLOCKED_OUT":
            setErrorMessage(t("attendance.alreadyClockedOut"));
            break;
          default:
            setErrorMessage(t("attendance.genericError"));
        }
      }
    } catch {
      setErrorMessage(t("attendance.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  const nextAction = lastType === "CLOCK_IN" ? "CLOCK_OUT" : "CLOCK_IN";
  const isBusy = locating || submitting;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t("attendance.pageTitle")}</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, gap: 1 }}>
        {isBusy ? (
          <>
            <CircularProgress size={64} />
            {locating && (
              <Typography variant="body2" color="text.secondary">
                {t("attendance.locating")}
              </Typography>
            )}
          </>
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
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}
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
