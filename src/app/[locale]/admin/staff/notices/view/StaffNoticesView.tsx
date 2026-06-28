"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

type Notice = {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
  author: { name: string };
};

export default function StaffNoticesView() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", bodyRaw: "", isPublished: false });

  const fetchNotices = () =>
    fetch("/api/admin/staff/notices")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setNotices(d.posts);
      });

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/admin/staff/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if ((await res.json()).ok) {
      setOpen(false);
      setForm({ title: "", bodyRaw: "", isPublished: false });
      fetchNotices();
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    await fetch("/api/admin/staff/notices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPublished }),
    });
    fetchNotices();
  };

  const handleDelete = async () => {
    await fetch("/api/admin/staff/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    setSelected([]);
    fetchNotices();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">사내 공지 관리</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {selected.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              선택 삭제 ({selected.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            공지 작성
          </Button>
        </Box>
      </Box>
      <List>
        {notices.map((n) => (
          <ListItem
            key={n.id}
            secondaryAction={
              <Switch
                checked={n.isPublished}
                onChange={(e) => handleTogglePublish(n.id, e.target.checked)}
                size="small"
              />
            }
          >
            <Checkbox
              checked={selected.includes(n.id)}
              onChange={(e) =>
                setSelected((prev) =>
                  e.target.checked
                    ? [...prev, n.id]
                    : prev.filter((id) => id !== n.id)
                )
              }
            />
            <ListItemText
              primary={n.title}
              secondary={`${n.author.name} · ${new Date(n.createdAt).toLocaleDateString()} · ${n.isPublished ? "발행" : "미발행"}`}
            />
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>사내 공지 작성</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="제목"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="내용"
            value={form.bodyRaw}
            onChange={(e) =>
              setForm((p) => ({ ...p, bodyRaw: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.isPublished}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isPublished: e.target.checked }))
                }
              />
            }
            label="즉시 발행"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleCreate}>
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
