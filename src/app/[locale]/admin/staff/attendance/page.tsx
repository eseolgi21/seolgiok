"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
} from "@mui/material";

type Log = {
  id: string;
  type: "CLOCK_IN" | "CLOCK_OUT";
  clockedAt: string;
  user: { name: string };
};

export default function AttendanceAdminPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/staff/attendance?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setLogs(d.logs);
      })
      .finally(() => setLoading(false));
  }, [date]);

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
        <Typography variant="h6">직원 출퇴근 현황</Typography>
        <TextField
          type="date"
          size="small"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>직원</TableCell>
              <TableCell>유형</TableCell>
              <TableCell>시각</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.user.name}</TableCell>
                <TableCell>
                  <Chip
                    label={log.type === "CLOCK_IN" ? "출근" : "퇴근"}
                    color={log.type === "CLOCK_IN" ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(log.clockedAt).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  기록이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
