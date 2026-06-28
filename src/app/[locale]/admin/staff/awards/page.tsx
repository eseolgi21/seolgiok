"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

type Ranking = { targetId: string; name: string; count: number };

export default function AwardsAdminPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/staff/awards?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setRanking(d.ranking);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          alignItems: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <EmojiEventsIcon color="warning" />
          우수사원 투표 집계
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Select
            size="small"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
              <MenuItem key={y} value={y}>
                {y}년
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {i + 1}월
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>순위</TableCell>
              <TableCell>직원</TableCell>
              <TableCell>득표수</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.map((r, i) => (
              <TableRow key={r.targetId}>
                <TableCell>
                  {i + 1}
                  {i === 0 ? " 🥇" : i === 1 ? " 🥈" : i === 2 ? " 🥉" : ""}
                </TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.count}표</TableCell>
              </TableRow>
            ))}
            {ranking.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  투표 기록이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
