"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Tabs, Tab, List, ListItem, Checkbox,
  ListItemText, CircularProgress, TextField, Button, Chip, Divider,
} from "@mui/material";
import { useTranslations } from "next-intl";

type SlotInfo = { id: string; label: string; order: number; category: string };
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

  const [hallSlots, setHallSlots] = useState<SlotInfo[]>([]);
  const [kitchenSlots, setKitchenSlots] = useState<SlotInfo[]>([]);
  const [hallSlotIdx, setHallSlotIdx] = useState(0);
  const [kitchenSlotIdx, setKitchenSlotIdx] = useState(0);

  const [hallItems, setHallItems] = useState<Item[]>([]);
  const [kitchenItems, setKitchenItems] = useState<Item[]>([]);
  const [hallChecks, setHallChecks] = useState<Check[]>([]);
  const [kitchenChecks, setKitchenChecks] = useState<Check[]>([]);
  const [hallComments, setHallComments] = useState<CommentItem[]>([]);
  const [kitchenComments, setKitchenComments] = useState<CommentItem[]>([]);
  const [hallApproval, setHallApproval] = useState<ApprovalItem | null>(null);
  const [kitchenApproval, setKitchenApproval] = useState<ApprovalItem | null>(null);
  const [hallInput, setHallInput] = useState("");
  const [kitchenInput, setKitchenInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/staff/handover/slots?category=HALL").then((r) => r.json()),
      fetch("/api/staff/handover/slots?category=KITCHEN").then((r) => r.json()),
      fetch("/api/staff/handover/items?category=HALL").then((r) => r.json()),
      fetch("/api/staff/handover/items?category=KITCHEN").then((r) => r.json()),
    ]).then(([hall, kitchen, hItems, kItems]) => {
      if (hall.ok) setHallSlots(hall.slots);
      if (kitchen.ok) setKitchenSlots(kitchen.slots);
      if (hItems.ok) setHallItems(hItems.items);
      if (kItems.ok) setKitchenItems(kItems.items);
    });
  }, []);

  const hallSlotId = hallSlots[hallSlotIdx]?.id ?? "";
  const kitchenSlotId = kitchenSlots[kitchenSlotIdx]?.id ?? "";

  const loadHallData = useCallback(async () => {
    if (!hallSlotId) return;
    const [checksRes, commentsRes, approvalsRes] = await Promise.all([
      fetch(`/api/staff/handover/checks?shiftDate=${today}&shiftSlotId=${hallSlotId}`).then((r) => r.json()),
      fetch(`/api/staff/handover/comments?shiftDate=${today}&shiftSlotId=${hallSlotId}&category=HALL`).then((r) => r.json()),
      fetch(`/api/staff/handover/approvals?shiftDate=${today}&shiftSlotId=${hallSlotId}`).then((r) => r.json()),
    ]);
    if (checksRes.ok) setHallChecks(checksRes.checks);
    if (commentsRes.ok) setHallComments(commentsRes.comments);
    if (approvalsRes.ok) setHallApproval(approvalsRes.approvals?.find((a: ApprovalItem) => a.category === "HALL") ?? null);
  }, [hallSlotId, today]);

  const loadKitchenData = useCallback(async () => {
    if (!kitchenSlotId) return;
    const [checksRes, commentsRes, approvalsRes] = await Promise.all([
      fetch(`/api/staff/handover/checks?shiftDate=${today}&shiftSlotId=${kitchenSlotId}`).then((r) => r.json()),
      fetch(`/api/staff/handover/comments?shiftDate=${today}&shiftSlotId=${kitchenSlotId}&category=KITCHEN`).then((r) => r.json()),
      fetch(`/api/staff/handover/approvals?shiftDate=${today}&shiftSlotId=${kitchenSlotId}`).then((r) => r.json()),
    ]);
    if (checksRes.ok) setKitchenChecks(checksRes.checks);
    if (commentsRes.ok) setKitchenComments(commentsRes.comments);
    if (approvalsRes.ok) setKitchenApproval(approvalsRes.approvals?.find((a: ApprovalItem) => a.category === "KITCHEN") ?? null);
  }, [kitchenSlotId, today]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadHallData(), loadKitchenData()]).finally(() => setLoading(false));
  }, [loadHallData, loadKitchenData]);

  const isHallChecked = (itemId: string) =>
    hallChecks.some((c) => c.itemId === itemId && c.shiftSlotId === hallSlotId);
  const isKitchenChecked = (itemId: string) =>
    kitchenChecks.some((c) => c.itemId === itemId && c.shiftSlotId === kitchenSlotId);

  const handleCheck = async (itemId: string, slotId: string, isChecked: boolean, refreshFn: () => void) => {
    if (!slotId) return;
    if (isChecked) {
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
    refreshFn();
  };

  const handleComment = async (category: string, slotId: string, content: string, refreshFn: () => void, clearInput: () => void) => {
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
      clearInput();
      refreshFn();
    }
  };

  const handleApprovalSubmit = async (category: string, slotId: string, refreshFn: () => void) => {
    await fetch("/api/staff/handover/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftDate: today, shiftSlotId: slotId, category }),
    });
    refreshFn();
  };

  const handleApprovalCancel = async (approvalId: string, refreshFn: () => void) => {
    await fetch("/api/staff/handover/approvals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: approvalId }),
    });
    refreshFn();
  };

  if (loading && hallSlots.length === 0 && kitchenSlots.length === 0) return <CircularProgress />;

  const renderSection = (
    label: string,
    category: string,
    items: Item[],
    comments: CommentItem[],
    checks: Check[],
    approval: ApprovalItem | null,
    slotId: string,
    isCheckedFn: (itemId: string) => boolean,
    input: string,
    setInput: (v: string) => void,
    refreshFn: () => void,
  ) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{label}</Typography>
        {approval?.status === "CONFIRMED" ? (
          <Chip label={t("handover.approvalConfirmed")} color="success" size="small" />
        ) : approval?.status === "PENDING" ? (
          <>
            <Chip label={t("handover.approvalPending")} color="warning" size="small" />
            <Button size="small" variant="outlined" color="warning"
              onClick={() => handleApprovalCancel(approval.id, refreshFn)}>
              {t("handover.cancelApproval")}
            </Button>
          </>
        ) : (
          <Button size="small" variant="contained"
            onClick={() => handleApprovalSubmit(category, slotId, refreshFn)}>
            {t("handover.submitApproval")}
          </Button>
        )}
      </Box>
      {items.length === 0 ? (
        <Typography color="text.secondary">{t("handover.empty")}</Typography>
      ) : (
        <List dense>
          {items.map((item) => {
            const checked = isCheckedFn(item.id);
            return (
              <ListItem key={item.id} disablePadding>
                <Checkbox checked={checked} onChange={() => handleCheck(item.id, slotId, checked, refreshFn)} size="small" />
                <ListItemText
                  primary={item.label}
                  sx={{ textDecoration: checked ? "line-through" : "none", color: checked ? "text.secondary" : "inherit" }}
                />
              </ListItem>
            );
          })}
        </List>
      )}
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2" color="text.secondary" gutterBottom>{t("handover.myComments")}</Typography>
      {comments.map((c) => (
        <Box key={c.id} sx={{ mb: 0.5 }}>
          <Typography variant="body2" sx={{ pl: 1, borderLeft: "2px solid #eee" }}>{c.content}</Typography>
          {c.imageUrl && (
            <Box component="img" src={c.imageUrl}
              sx={{ maxWidth: 120, maxHeight: 120, borderRadius: 1, mt: 0.5, cursor: "pointer" }}
              onClick={() => window.open(c.imageUrl!, "_blank")} />
          )}
        </Box>
      ))}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, mt: 1 }}>
        <Button variant="outlined" size="small" component="label" disabled={uploading[category]}>
          {uploading[category] ? t("handover.photoUploading") : t("handover.photoAttach")}
          <input type="file" hidden accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading((prev) => ({ ...prev, [category]: true }));
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/staff/handover/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.ok) setImageUrls((prev) => ({ ...prev, [category]: data.url as string }));
            setUploading((prev) => ({ ...prev, [category]: false }));
          }} />
        </Button>
        {imageUrls[category] && (
          <Box component="img" src={imageUrls[category]!}
            sx={{ maxWidth: 80, maxHeight: 80, borderRadius: 1, cursor: "pointer" }}
            onClick={() => window.open(imageUrls[category]!, "_blank")} />
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <TextField size="small" fullWidth placeholder={t("handover.commentPlaceholder")}
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleComment(category, slotId, input, refreshFn, () => setInput(""))} />
        <Button size="small" variant="outlined"
          onClick={() => handleComment(category, slotId, input, refreshFn, () => setInput(""))}>
          {t("handover.commentSubmit")}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t("handover.pageTitle")}</Typography>

      {/* 홀 섹션 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>{t("handover.hall")}</Typography>
        {hallSlots.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>홀 교대 슬롯이 없습니다. 어드민에서 추가해 주세요.</Typography>
        ) : (
          <>
            <Tabs value={hallSlotIdx} onChange={(_, v) => setHallSlotIdx(v)} sx={{ mb: 2 }}>
              {hallSlots.map((s) => <Tab key={s.id} label={s.label} />)}
            </Tabs>
            {renderSection(
              t("handover.hall"), "HALL", hallItems, hallComments, hallChecks, hallApproval,
              hallSlotId, isHallChecked, hallInput, setHallInput, loadHallData,
            )}
          </>
        )}
      </Box>

      {/* 주방 섹션 */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>{t("handover.kitchen")}</Typography>
        {kitchenSlots.length === 0 ? (
          <Typography color="text.secondary">주방 교대 슬롯이 없습니다. 어드민에서 추가해 주세요.</Typography>
        ) : (
          <>
            <Tabs value={kitchenSlotIdx} onChange={(_, v) => setKitchenSlotIdx(v)} sx={{ mb: 2 }}>
              {kitchenSlots.map((s) => <Tab key={s.id} label={s.label} />)}
            </Tabs>
            {renderSection(
              t("handover.kitchen"), "KITCHEN", kitchenItems, kitchenComments, kitchenChecks, kitchenApproval,
              kitchenSlotId, isKitchenChecked, kitchenInput, setKitchenInput, loadKitchenData,
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
