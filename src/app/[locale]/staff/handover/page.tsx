"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Tabs, Tab, List, ListItem, Checkbox,
  ListItemText, CircularProgress, TextField, Button, Chip, Divider,
} from "@mui/material";
import { useTranslations } from "next-intl";

type SlotInfo = { id: string; label: string; order: number };
type Item = { id: string; label: string; category: string };
type Check = { itemId: string; shiftSlotId: string; checkedBy: string };
type CommentItem = { id: string; content: string; createdAt: string; category: string; imageUrl?: string | null };
type ApprovalItem = {
  id: string;
  category: string;
  status: string;
  submittedAt: string;
  submitter?: { name: string };
};

export default function HandoverPage() {
  const t = useTranslations("staffPortal");
  const [userId, setUserId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d?.user?.id) setUserId(d.user.id); })
      .catch(() => {});
  }, []);

  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotIdx, setSlotIdx] = useState(0);
  const [hallItems, setHallItems] = useState<Item[]>([]);
  const [kitchenItems, setKitchenItems] = useState<Item[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [hallComments, setHallComments] = useState<CommentItem[]>([]);
  const [kitchenComments, setKitchenComments] = useState<CommentItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [hallInput, setHallInput] = useState("");
  const [kitchenInput, setKitchenInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/staff/handover/slots")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setSlots(d.slots); });
  }, []);

  const slotId = slots[slotIdx]?.id ?? "";

  const refreshApprovals = useCallback(async () => {
    if (!slotId) return;
    const res = await fetch(`/api/staff/handover/approvals?shiftDate=${today}&shiftSlotId=${slotId}`);
    const data = await res.json();
    if (data.ok) setApprovals(data.approvals);
  }, [slotId, today]);

  const refreshChecks = useCallback(async () => {
    if (!slotId) return;
    const res = await fetch(`/api/staff/handover/checks?shiftDate=${today}&shiftSlotId=${slotId}`);
    const data = await res.json();
    if (data.ok) setChecks(data.checks);
  }, [slotId, today]);

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

  const isChecked = (itemId: string) =>
    checks.some((c) => c.itemId === itemId && c.shiftSlotId === slotId);

  const handleCheck = async (itemId: string, _category: string) => {
    if (!slotId || !today) return;
    const alreadyChecked = checks.some(
      (c) => c.itemId === itemId && c.shiftSlotId === slotId && c.checkedBy === userId
    );
    if (alreadyChecked) {
      await fetch("/api/staff/handover/checks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, shiftDate: today, shiftSlotId: slotId }),
      });
    } else {
      await fetch("/api/staff/handover/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, shiftDate: today, shiftSlotId: slotId }),
      });
    }
    await refreshChecks();
  };

  const handleComment = async (category: string, content: string) => {
    if (!content.trim()) return;
    const res = await fetch("/api/staff/handover/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftDate: today,
        shiftSlotId: slotId,
        category,
        content,
        imageUrl: imageUrls[category] ?? undefined,
      }),
    });
    if ((await res.json()).ok) {
      setImageUrls((prev) => ({ ...prev, [category]: null }));
      if (category === "HALL") {
        setHallInput("");
        setHallComments((prev) => [...prev, { id: Date.now().toString(), content, createdAt: new Date().toISOString(), category, imageUrl: imageUrls[category] }]);
      } else {
        setKitchenInput("");
        setKitchenComments((prev) => [...prev, { id: Date.now().toString(), content, createdAt: new Date().toISOString(), category, imageUrl: imageUrls[category] }]);
      }
    }
  };

  if (slots.length === 0 || loading) return <CircularProgress />;

  const renderSection = (
    label: string,
    category: string,
    items: Item[],
    comments: CommentItem[],
    input: string,
    setInput: (v: string) => void,
  ) => {
    const approval = approvals.find((a) => a.category === category);

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{label}</Typography>
          {approval?.status === "CONFIRMED" ? (
            <Chip label={t("handover.approvalConfirmed")} color="success" size="small" />
          ) : approval?.status === "PENDING" ? (
            <>
              <Chip label={t("handover.approvalPending")} color="warning" size="small" />
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={async () => {
                  await fetch("/api/staff/handover/approvals", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: approval.id }),
                  });
                  await refreshApprovals();
                }}
              >
                {t("handover.cancelApproval")}
              </Button>
            </>
          ) : (
            <Button
              size="small"
              variant="contained"
              onClick={async () => {
                await fetch("/api/staff/handover/approvals", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ shiftDate: today, shiftSlotId: slotId, category }),
                });
                await refreshApprovals();
              }}
            >
              {t("handover.submitApproval")}
            </Button>
          )}
        </Box>
        {items.length === 0 ? (
          <Typography color="text.secondary">{t("handover.empty")}</Typography>
        ) : (
          <List dense>
            {items.map((item) => (
              <ListItem key={item.id} disablePadding>
                <Checkbox checked={isChecked(item.id)} onChange={() => handleCheck(item.id, category)} size="small" />
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
          <Box key={c.id} sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ pl: 1, borderLeft: "2px solid #eee" }}>
              {c.content}
            </Typography>
            {c.imageUrl && (
              <Box
                component="img"
                src={c.imageUrl}
                sx={{ maxWidth: 120, maxHeight: 120, borderRadius: 1, mt: 0.5, cursor: "pointer" }}
                onClick={() => window.open(c.imageUrl!, "_blank")}
              />
            )}
          </Box>
        ))}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, mt: 1 }}>
          <Button
            variant="outlined"
            size="small"
            component="label"
            disabled={uploading[category]}
          >
            {uploading[category] ? t("handover.photoUploading") : t("handover.photoAttach")}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading((prev) => ({ ...prev, [category]: true }));
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/staff/handover/upload", { method: "POST", body: fd });
                const data = await res.json();
                if (data.ok) setImageUrls((prev) => ({ ...prev, [category]: data.url as string }));
                setUploading((prev) => ({ ...prev, [category]: false }));
              }}
            />
          </Button>
          {imageUrls[category] && (
            <Box
              component="img"
              src={imageUrls[category]!}
              sx={{ maxWidth: 80, maxHeight: 80, borderRadius: 1, cursor: "pointer" }}
              onClick={() => window.open(imageUrls[category]!, "_blank")}
            />
          )}
        </Box>
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
  };

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
