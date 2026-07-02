"use client";
import { useEffect, useState } from "react";
import {
  Box, Typography, List, ListItem, ListItemText, IconButton,
  TextField, Button, Switch, Select, MenuItem, FormControl,
  InputLabel, Chip, Tabs, Tab,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

type Item = { id: string; label: string; category: string; order: number; isActive: boolean };
type Slot = { id: string; label: string; category: string; order: number; isActive: boolean };

function SlotManager({ category, label }: { category: "HALL" | "KITCHEN"; label: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newLabel, setNewLabel] = useState("");

  const fetchSlots = () =>
    fetch(`/api/admin/staff/handover/slots?category=${category}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setSlots(d.slots); });

  useEffect(() => { fetchSlots(); }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const res = await fetch("/api/admin/staff/handover/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim(), category }),
    });
    if ((await res.json()).ok) { setNewLabel(""); fetchSlots(); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/staff/handover/slots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    fetchSlots();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/admin/staff/handover/slots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!data.ok && data.code === "SLOT_IN_USE") {
      alert("이 슬롯에 연결된 데이터가 있어 삭제할 수 없습니다.");
      return;
    }
    fetchSlots();
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>{label} 교대 슬롯</Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="슬롯 이름 (예: 오전 교대)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          sx={{ minWidth: 200 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>추가</Button>
      </Box>
      {slots.length === 0 ? (
        <Typography color="text.secondary">등록된 슬롯이 없습니다.</Typography>
      ) : (
        <List dense>
          {slots.map((slot) => (
            <ListItem
              key={slot.id}
              secondaryAction={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Switch size="small" checked={slot.isActive} onChange={(e) => handleToggle(slot.id, e.target.checked)} />
                  <IconButton edge="end" onClick={() => handleDelete(slot.id)} color="error"><DeleteIcon /></IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={slot.label}
                sx={{ textDecoration: slot.isActive ? "none" : "line-through", color: slot.isActive ? "inherit" : "text.secondary" }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default function HandoverAdminPage() {
  const [tabIdx, setTabIdx] = useState(0);
  const [slotCatIdx, setSlotCatIdx] = useState(0);
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

  const handleMoveItem = async (id: string, direction: "up" | "down") => {
    const sorted = [...items].sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order);
    const current = sorted.find((item) => item.id === id)!;
    const catItems = sorted.filter((item) => item.category === current.category);
    const catIdx = catItems.findIndex((item) => item.id === id);
    if (direction === "up" && catIdx === 0) return;
    if (direction === "down" && catIdx === catItems.length - 1) return;
    const next = [...catItems];
    const swap = direction === "up" ? catIdx - 1 : catIdx + 1;
    [next[catIdx], next[swap]] = [next[swap], next[catIdx]];
    await Promise.all(
      next.map((item, i) =>
        fetch("/api/admin/staff/handover/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, order: i + 1 }),
        })
      )
    );
    fetchItems();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>인수인계 관리</Typography>
      <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)} sx={{ mb: 2 }}>
        <Tab label="체크리스트 항목" />
        <Tab label="교대 슬롯" />
      </Tabs>

      {tabIdx === 0 && (
        <Box>
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
            {[...items].sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order).map((item) => {
              const catItems = items.filter((x) => x.category === item.category).sort((a, b) => a.order - b.order);
              const catIdx = catItems.findIndex((x) => x.id === item.id);
              return (
                <ListItem
                  key={item.id}
                  secondaryAction={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Switch size="small" checked={item.isActive} onChange={(e) => handleToggle(item.id, e.target.checked)} />
                      <IconButton edge="end" onClick={() => handleDelete(item.id)} color="error"><DeleteIcon /></IconButton>
                    </Box>
                  }
                >
                  <Box sx={{ display: "flex", flexDirection: "column", mr: 0.5 }}>
                    <IconButton size="small" disabled={catIdx === 0} onClick={() => handleMoveItem(item.id, "up")}><ArrowUpwardIcon fontSize="small" /></IconButton>
                    <IconButton size="small" disabled={catIdx === catItems.length - 1} onClick={() => handleMoveItem(item.id, "down")}><ArrowDownwardIcon fontSize="small" /></IconButton>
                  </Box>
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
              );
            })}
          </List>
        </Box>
      )}

      {tabIdx === 1 && (
        <>
          <Tabs value={slotCatIdx} onChange={(_, v) => setSlotCatIdx(v)} sx={{ mb: 2 }}>
            <Tab label="홀" />
            <Tab label="주방" />
          </Tabs>
          {slotCatIdx === 0 && <SlotManager category="HALL" label="홀" />}
          {slotCatIdx === 1 && <SlotManager category="KITCHEN" label="주방" />}
        </>
      )}
    </Box>
  );
}
