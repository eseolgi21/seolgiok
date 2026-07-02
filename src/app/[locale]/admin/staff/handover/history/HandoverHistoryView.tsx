"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Button,
  List, ListItem, ListItemText, Divider, CircularProgress, Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type Slot = { id: string; label: string; order: number };
type Check = {
  itemId: string;
  item: { label: string; category: string };
  checkedUser: { name: string };
  checkedAt: string;
};
type Comment = { id: string; content: string; imageUrl?: string | null; createdAt: string; author: { name: string } };
type Approval = {
  id: string;
  category: string;
  status: "PENDING" | "CONFIRMED";
  submittedAt: string;
  submitter: { name: string };
  confirmedAt?: string | null;
  confirmer?: { name: string } | null;
};

function CategoryPanel({
  label,
  checks,
  comments,
  approval,
}: {
  label: string;
  checks: Check[];
  comments: Comment[];
  approval: Approval | undefined;
}) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h6">{label}</Typography>
        {!approval ? (
          <Chip label="미결제" size="small" />
        ) : approval.status === "PENDING" ? (
          <>
            <Chip icon={<HourglassEmptyIcon />} label="결제 대기" color="warning" size="small" />
            <Typography variant="body2" color="text.secondary">
              제출자: {approval.submitter.name} · {new Date(approval.submittedAt).toLocaleString("ko-KR")}
            </Typography>
          </>
        ) : (
          <>
            <Chip icon={<CheckCircleIcon />} label="결제완료" color="success" size="small" />
            <Typography variant="body2" color="text.secondary">
              확인자: {approval.confirmer?.name ?? "-"}
              {approval.confirmedAt ? " · " + new Date(approval.confirmedAt).toLocaleString("ko-KR") : ""}
            </Typography>
          </>
        )}
      </Box>

      <Typography variant="subtitle2" gutterBottom>체크 현황</Typography>
      {checks.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>체크 데이터가 없습니다.</Typography>
      ) : (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>항목</TableCell>
              <TableCell>체크한 직원</TableCell>
              <TableCell>체크 시각</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {checks.map((c, i) => (
              <TableRow key={i}>
                <TableCell>{c.item.label}</TableCell>
                <TableCell>{c.checkedUser.name}</TableCell>
                <TableCell>{new Date(c.checkedAt).toLocaleString("ko-KR")}</TableCell>
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
            <ListItem key={c.id} disablePadding sx={{ flexDirection: "column", alignItems: "flex-start" }}>
              <ListItemText
                primary={c.content}
                secondary={`${c.author.name} · ${new Date(c.createdAt).toLocaleString("ko-KR")}`}
              />
              {c.imageUrl && (
                <Box
                  component="img"
                  src={c.imageUrl}
                  onClick={() => window.open(c.imageUrl!, "_blank")}
                  sx={{ maxWidth: 120, maxHeight: 120, borderRadius: 1, mt: 0.5, cursor: "pointer" }}
                />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

export default function HandoverHistoryView() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const [hallSlots, setHallSlots] = useState<Slot[]>([]);
  const [kitchenSlots, setKitchenSlots] = useState<Slot[]>([]);
  const [hallSlotId, setHallSlotId] = useState("");
  const [kitchenSlotId, setKitchenSlotId] = useState("");

  const [hallChecks, setHallChecks] = useState<Check[]>([]);
  const [kitchenChecks, setKitchenChecks] = useState<Check[]>([]);
  const [hallComments, setHallComments] = useState<Comment[]>([]);
  const [kitchenComments, setKitchenComments] = useState<Comment[]>([]);
  const [hallApproval, setHallApproval] = useState<Approval | undefined>();
  const [kitchenApproval, setKitchenApproval] = useState<Approval | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/staff/handover/slots?category=HALL").then((r) => r.json()),
      fetch("/api/admin/staff/handover/slots?category=KITCHEN").then((r) => r.json()),
    ]).then(([hall, kitchen]) => {
      if (hall.ok) {
        const active = hall.slots.filter((s: Slot & { isActive: boolean }) => s.isActive);
        setHallSlots(active);
        if (active.length > 0) setHallSlotId(active[0].id);
      }
      if (kitchen.ok) {
        const active = kitchen.slots.filter((s: Slot & { isActive: boolean }) => s.isActive);
        setKitchenSlots(active);
        if (active.length > 0) setKitchenSlotId(active[0].id);
      }
    });
  }, []);

  const loadData = useCallback(() => {
    if (!date) return;
    setLoading(true);
    const fetches: Promise<void>[] = [];

    if (hallSlotId) {
      fetches.push(
        Promise.all([
          fetch(`/api/staff/handover/checks?shiftDate=${date}&shiftSlotId=${hallSlotId}`).then((r) => r.json()),
          fetch(`/api/admin/staff/handover/comments?shiftDate=${date}&shiftSlotId=${hallSlotId}&category=HALL`).then((r) => r.json()),
          fetch(`/api/admin/staff/handover/approvals?shiftDate=${date}&shiftSlotId=${hallSlotId}`).then((r) => r.json()),
        ]).then(([checksData, commentsData, approvalsData]) => {
          if (checksData.ok) setHallChecks(checksData.checks.filter((c: Check) => c.item.category === "HALL"));
          if (commentsData.ok) setHallComments(commentsData.comments);
          if (approvalsData.ok) setHallApproval(approvalsData.approvals?.find((a: Approval) => a.category === "HALL"));
        })
      );
    }

    if (kitchenSlotId) {
      fetches.push(
        Promise.all([
          fetch(`/api/staff/handover/checks?shiftDate=${date}&shiftSlotId=${kitchenSlotId}`).then((r) => r.json()),
          fetch(`/api/admin/staff/handover/comments?shiftDate=${date}&shiftSlotId=${kitchenSlotId}&category=KITCHEN`).then((r) => r.json()),
          fetch(`/api/admin/staff/handover/approvals?shiftDate=${date}&shiftSlotId=${kitchenSlotId}`).then((r) => r.json()),
        ]).then(([checksData, commentsData, approvalsData]) => {
          if (checksData.ok) setKitchenChecks(checksData.checks.filter((c: Check) => c.item.category === "KITCHEN"));
          if (commentsData.ok) setKitchenComments(commentsData.comments);
          if (approvalsData.ok) setKitchenApproval(approvalsData.approvals?.find((a: Approval) => a.category === "KITCHEN"));
        })
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [date, hallSlotId, kitchenSlotId]);

  useEffect(() => { loadData(); }, [loadData]);

  const shiftDate = (delta: number) => {
    const dt = new Date(date);
    dt.setDate(dt.getDate() + delta);
    const next = dt.toISOString().slice(0, 10);
    if (next > today) return;
    setDate(next);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>교대 기록</Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <Button size="small" variant="outlined" startIcon={<ChevronLeftIcon />} onClick={() => shiftDate(-1)}>
          전날
        </Button>
        <TextField
          type="date"
          label="날짜"
          size="small"
          value={date}
          onChange={(e) => { if (e.target.value <= today) setDate(e.target.value); }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          size="small"
          variant="outlined"
          endIcon={<ChevronRightIcon />}
          onClick={() => shiftDate(1)}
          disabled={date >= today}
        >
          다음날
        </Button>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>홀 교대</InputLabel>
          <Select value={hallSlotId} label="홀 교대" onChange={(e) => setHallSlotId(e.target.value)}>
            {hallSlots.map((s) => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>주방 교대</InputLabel>
          <Select value={kitchenSlotId} label="주방 교대" onChange={(e) => setKitchenSlotId(e.target.value)}>
            {kitchenSlots.map((s) => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <CategoryPanel
            label="홀"
            checks={hallChecks}
            comments={hallComments}
            approval={hallApproval}
          />
          <CategoryPanel
            label="주방"
            checks={kitchenChecks}
            comments={kitchenComments}
            approval={kitchenApproval}
          />
        </>
      )}
    </Box>
  );
}
