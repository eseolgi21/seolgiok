"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Button,
  List, ListItem, ListItemText, Divider, CircularProgress, Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type Slot = { id: string; label: string; order: number };
type Check = { itemId: string; item: { label: string }; checkedUser: { name: string } };
type Comment = { id: string; content: string; createdAt: string; author: { name: string } };
type Approval = { id: string; category: string; approvedAt: string; approver: { name: string }; note?: string };

function CategoryPanel({
  category,
  label,
  checks,
  comments,
  approval,
  onApprove,
  onRevoke,
}: {
  category: string;
  label: string;
  checks: Check[];
  comments: Comment[];
  approval: Approval | undefined;
  onApprove: (category: string) => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h6">{label}</Typography>
        {approval ? (
          <>
            <Chip icon={<CheckCircleIcon />} label={`결제됨 — ${approval.approver.name}`} color="success" size="small" />
            <Button size="small" color="error" variant="outlined" onClick={() => onRevoke(approval.id)}>결제 취소</Button>
          </>
        ) : (
          <Button size="small" variant="contained" onClick={() => onApprove(category)}>결제</Button>
        )}
      </Box>

      <Typography variant="subtitle2" gutterBottom>체크 현황</Typography>
      {checks.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>데이터가 없습니다.</Typography>
      ) : (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>항목</TableCell>
              <TableCell>체크한 직원</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {checks.map((c, i) => (
              <TableRow key={i}>
                <TableCell>{c.item.label}</TableCell>
                <TableCell>{c.checkedUser.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Divider sx={{ my: 1 }} />
      <Typography variant="subtitle2" gutterBottom>코멘트</Typography>
      {comments.length === 0 ? (
        <Typography color="text.secondary">코멘트가 없습니다.</Typography>
      ) : (
        <List dense>
          {comments.map((c) => (
            <ListItem key={c.id} disablePadding>
              <ListItemText
                primary={c.content}
                secondary={`${c.author.name} · ${new Date(c.createdAt).toLocaleString("ko-KR")}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

export default function HandoverReviewView() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState("");
  const [checks, setChecks] = useState<Check[]>([]);
  const [hallComments, setHallComments] = useState<Comment[]>([]);
  const [kitchenComments, setKitchenComments] = useState<Comment[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/staff/handover/slots")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setSlots(d.slots);
          if (d.slots.length > 0) setSlotId(d.slots[0].id);
        }
      });
  }, []);

  const loadData = useCallback(() => {
    if (!date || !slotId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/staff/handover/checks?shiftDate=${date}&shiftSlotId=${slotId}`).then((r) => r.json()),
      fetch(`/api/admin/staff/handover/comments?shiftDate=${date}&shiftSlotId=${slotId}&category=HALL`).then((r) => r.json()),
      fetch(`/api/admin/staff/handover/comments?shiftDate=${date}&shiftSlotId=${slotId}&category=KITCHEN`).then((r) => r.json()),
      fetch(`/api/admin/staff/handover/approvals?shiftDate=${date}&shiftSlotId=${slotId}`).then((r) => r.json()),
    ]).then(([checksData, hallData, kitchenData, approvalsData]) => {
      if (checksData.ok) setChecks(checksData.checks);
      if (hallData.ok) setHallComments(hallData.comments);
      if (kitchenData.ok) setKitchenComments(kitchenData.comments);
      if (approvalsData.ok) setApprovals(approvalsData.approvals);
    }).finally(() => setLoading(false));
  }, [date, slotId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (category: string) => {
    await fetch("/api/admin/staff/handover/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftDate: date, shiftSlotId: slotId, category }),
    });
    loadData();
  };

  const handleRevoke = async (id: string) => {
    await fetch("/api/admin/staff/handover/approvals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const hallApproval = approvals.find((a) => a.category === "HALL");
  const kitchenApproval = approvals.find((a) => a.category === "KITCHEN");

  return (
    <Box>
      <Typography variant="h6" gutterBottom>인수인계 결제</Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          type="date"
          label="날짜"
          size="small"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>교대</InputLabel>
          <Select value={slotId} label="교대" onChange={(e) => setSlotId(e.target.value)}>
            {slots.map((s) => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <CategoryPanel
            category="HALL"
            label="홀"
            checks={checks}
            comments={hallComments}
            approval={hallApproval}
            onApprove={handleApprove}
            onRevoke={handleRevoke}
          />
          <CategoryPanel
            category="KITCHEN"
            label="주방"
            checks={checks}
            comments={kitchenComments}
            approval={kitchenApproval}
            onApprove={handleApprove}
            onRevoke={handleRevoke}
          />
        </>
      )}
    </Box>
  );
}
