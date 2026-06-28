"use client";

import { useEffect, useState } from "react";
import {
  Box, Typography, Tabs, Tab, List, ListItem, ListItemText,
  Checkbox, CircularProgress,
} from "@mui/material";
import { useTranslations } from "next-intl";

type Item = { id: string; label: string };
type Check = { itemId: string };

const SLOTS = ["morning", "evening", "night"] as const;
type Slot = (typeof SLOTS)[number];

export default function HandoverPage() {
  const t = useTranslations("staffPortal");
  const [slot, setSlot] = useState<Slot>("morning");
  const [items, setItems] = useState<Item[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/staff/handover/items").then(r => r.json()),
      fetch(`/api/staff/handover/checks?shiftDate=${today}&shiftSlot=${slot}`).then(r => r.json()),
    ]).then(([itemsData, checksData]) => {
      if (itemsData.ok) setItems(itemsData.items);
      if (checksData.ok) setChecks(checksData.checks);
    }).finally(() => setLoading(false));
  }, [slot, today]);

  const isChecked = (itemId: string) => checks.some(c => c.itemId === itemId);

  const handleCheck = async (itemId: string) => {
    if (isChecked(itemId)) return;
    const res = await fetch("/api/staff/handover/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, shiftDate: today, shiftSlot: slot }),
    });
    const data = await res.json();
    if (data.ok) setChecks(prev => [...prev, { itemId }]);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t("handover.pageTitle")}</Typography>
      <Tabs
        value={SLOTS.indexOf(slot)}
        onChange={(_, v) => setSlot(SLOTS[v])}
        sx={{ mb: 2 }}
      >
        {SLOTS.map(s => <Tab key={s} label={t(`handover.${s}`)} />)}
      </Tabs>
      {loading ? (
        <CircularProgress />
      ) : items.length === 0 ? (
        <Typography color="text.secondary">{t("handover.empty")}</Typography>
      ) : (
        <List>
          {items.map(item => (
            <ListItem key={item.id} disablePadding>
              <Checkbox
                checked={isChecked(item.id)}
                onChange={() => handleCheck(item.id)}
              />
              <ListItemText
                primary={item.label}
                sx={{
                  textDecoration: isChecked(item.id) ? "line-through" : "none",
                  color: isChecked(item.id) ? "text.secondary" : "inherit",
                }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
