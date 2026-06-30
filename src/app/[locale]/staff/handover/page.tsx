"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Tabs, Tab, List, ListItem, Checkbox,
  ListItemText, CircularProgress, TextField, Button, Chip, Divider,
} from "@mui/material";
import { useTranslations } from "next-intl";

type SlotInfo = { id: string; label: string; order: number };
type Item = { id: string; label: string; category: string };
type Check = { itemId: string };
type CommentItem = { id: string; content: string; createdAt: string; category: string };
type Approval = { category: string; approvedAt: string };

export default function HandoverPage() {
  const t = useTranslations("staffPortal");
  const today = new Date().toISOString().slice(0, 10);

  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotIdx, setSlotIdx] = useState(0);
  const [hallItems, setHallItems] = useState<Item[]>([]);
  const [kitchenItems, setKitchenItems] = useState<Item[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [hallComments, setHallComments] = useState<CommentItem[]>([]);
  const [kitchenComments, setKitchenComments] = useState<CommentItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [hallInput, setHallInput] = useState("");
  const [kitchenInput, setKitchenInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/handover/slots")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setSlots(d.slots); });
  }, []);

  const slotId = slots[slotIdx]?.id ?? "";

  const loadData = useCallback(() => {
    if (!slotId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/staff/handover/items?category=HALL`).then((r) => r.json()),
      fetch(`/api/staff/handover/items?category=KITCHEN`).then((r) => r.json()),
      fetch(`/api/staff/handover/checks?shiftDate=${today}&shiftSlotId=${slotId}`).then((r) => r.json()),
      fetch(`/api/staff/handover/comments?shiftDate=${today}&shiftSlotId=${slotId}&category=HALL`).then((r) => r.json()),
      fetch(`/api/staff/handover/comments?shiftDate=${today}&shiftSlotId=${slotId}&category=KITCHEN`).then((r) => r.json()),
      fetch(`/api/staff/handover/approvals?shiftDate=${today}&shiftSlotId=${slotId}`).then((r) => r.json()),
    ]).then(([hItems, kItems, checksData, hComments, kComments, approvalsData]) => {
      if (hItems.ok) setHallItems(hItems.items);
      if (kItems.ok) setKitchenItems(kItems.items);
      if (checksData.ok) setChecks(checksData.checks);
      if (hComments.ok) setHallComments(hComments.comments);
      if (kComments.ok) setKitchenComments(kComments.comments);
      if (approvalsData.ok) setApprovals(approvalsData.approvals);
    }).finally(() => setLoading(false));
  }, [slotId, today]);

  useEffect(() => { loadData(); }, [loadData]);

  const isChecked = (itemId: string) => checks.some((c) => c.itemId === itemId);

  const handleCheck = async (itemId: string) => {
    if (isChecked(itemId)) return;
    const res = await fetch("/api/staff/handover/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, shiftDate: today, shiftSlotId: slotId }),
    });
    if ((await res.json()).ok) setChecks((prev) => [...prev, { itemId }]);
  };

  const handleComment = async (category: string, content: string) => {
    if (!content.trim()) return;
    const res = await fetch("/api/staff/handover/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftDate: today, shiftSlotId: slotId, category, content }),
    });
    if ((await res.json()).ok) {
      if (category === "HALL") {
        setHallInput("");
        setHallComments((prev) => [...prev, { id: Date.now().toString(), content, createdAt: new Date().toISOString(), category }]);
      } else {
        setKitchenInput("");
        setKitchenComments((prev) => [...prev, { id: Date.now().toString(), content, createdAt: new Date().toISOString(), category }]);
      }
    }
  };

  const isApproved = (category: string) => approvals.some((a) => a.category === category);

  if (slots.length === 0 || loading) return <CircularProgress />;

  const renderSection = (
    label: string,
    category: string,
    items: Item[],
    comments: CommentItem[],
    input: string,
    setInput: (v: string) => void,
  ) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{label}</Typography>
        {isApproved(category) && (
          <Chip label={t("handover.approved")} color="success" size="small" />
        )}
      </Box>
      {items.length === 0 ? (
        <Typography color="text.secondary">{t("handover.empty")}</Typography>
      ) : (
        <List dense>
          {items.map((item) => (
            <ListItem key={item.id} disablePadding>
              <Checkbox checked={isChecked(item.id)} onChange={() => handleCheck(item.id)} size="small" />
              <ListItemText
                primary={item.label}
                sx={{ textDecoration: isChecked(item.id) ? "line-through" : "none", color: isChecked(item.id) ? "text.secondary" : "inherit" }}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2" color="text.secondary" gutterBottom>{t("handover.myComments")}</Typography>
      {comments.map((c) => (
        <Typography key={c.id} variant="body2" sx={{ mb: 0.5, pl: 1, borderLeft: "2px solid #eee" }}>
          {c.content}
        </Typography>
      ))}
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={t("handover.commentPlaceholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleComment(category, input)}
        />
        <Button size="small" variant="outlined" onClick={() => handleComment(category, input)}>
          {t("handover.commentSubmit")}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t("handover.pageTitle")}</Typography>
      <Tabs value={slotIdx} onChange={(_, v) => setSlotIdx(v)} sx={{ mb: 2 }}>
        {slots.map((s) => <Tab key={s.id} label={s.label} />)}
      </Tabs>
      {renderSection(t("handover.hall"), "HALL", hallItems, hallComments, hallInput, setHallInput)}
      {renderSection(t("handover.kitchen"), "KITCHEN", kitchenItems, kitchenComments, kitchenInput, setKitchenInput)}
    </Box>
  );
}
