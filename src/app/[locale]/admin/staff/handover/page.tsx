"use client";
import { useEffect, useState } from "react";
import {
  Box, Typography, List, ListItem, ListItemText, IconButton,
  TextField, Button, Switch, Select, MenuItem, FormControl,
  InputLabel, Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

type Item = { id: string; label: string; category: string; order: number; isActive: boolean };

export default function HandoverAdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("HALL");

  const fetchItems = () =>
    fetch("/api/admin/staff/handover/items")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setItems(d.items); });

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const res = await fetch("/api/admin/staff/handover/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim(), category: newCategory }),
    });
    if ((await res.json()).ok) { setNewLabel(""); fetchItems(); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/staff/handover/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/admin/staff/handover/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>인수인계 체크리스트 항목 관리</Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="새 항목 입력"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>구분</InputLabel>
          <Select value={newCategory} label="구분" onChange={(e) => setNewCategory(e.target.value)}>
            <MenuItem value="HALL">홀</MenuItem>
            <MenuItem value="KITCHEN">주방</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>추가</Button>
      </Box>
      <List>
        {items.map((item) => (
          <ListItem
            key={item.id}
            secondaryAction={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Switch size="small" checked={item.isActive} onChange={(e) => handleToggle(item.id, e.target.checked)} />
                <IconButton edge="end" onClick={() => handleDelete(item.id)} color="error"><DeleteIcon /></IconButton>
              </Box>
            }
          >
            <Chip
              label={item.category === "HALL" ? "홀" : "주방"}
              size="small"
              color={item.category === "HALL" ? "primary" : "warning"}
              sx={{ mr: 1 }}
            />
            <ListItemText
              primary={item.label}
              sx={{ textDecoration: item.isActive ? "none" : "line-through", color: item.isActive ? "inherit" : "text.secondary" }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
