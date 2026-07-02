"use client";
import { useEffect, useState } from "react";
import {
  Box, Typography, List, ListItem, ListItemText, IconButton,
  TextField, Button, Switch, Select, MenuItem, FormControl, InputLabel,
  Chip, Tabs, Tab,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useTranslations } from "next-intl";

type Item = { id: string; label: string; category: string; order: number; isActive: boolean };
type Slot = { id: string; label: string; category: string; order: number; isActive: boolean };

function SlotManager({ category }: { category: "HALL" | "KITCHEN" }) {
  const t = useTranslations("staffPortal.handoverManage");
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
      alert(t("slotDeleteWarning"));
      return;
    }
    fetchSlots();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label={t("newSlotLabel")}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          sx={{ minWidth: 200 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>{t("addButton")}</Button>
      </Box>
      {slots.length === 0 ? (
        <Typography color="text.secondary">{t("noSlots")}</Typography>
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

export default function HandoverManageClient() {
  const t = useTranslations("staffPortal.handoverManage");
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t("pageTitle")}</Typography>
      <Tabs value={tabIdx} onChange={(_, v) => setTabIdx(v)} sx={{ mb: 2 }}>
        <Tab label={t("tabItems")} />
        <Tab label={t("tabSlots")} />
      </Tabs>

      {tabIdx === 0 && (
        <Box>
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              label={t("newItemLabel")}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>{t("categoryLabel")}</InputLabel>
              <Select value={newCategory} label={t("categoryLabel")} onChange={(e) => setNewCategory(e.target.value)}>
                <MenuItem value="HALL">{t("categoryHall")}</MenuItem>
                <MenuItem value="KITCHEN">{t("categoryKitchen")}</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>{t("addButton")}</Button>
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
                  label={item.category === "HALL" ? t("categoryHall") : t("categoryKitchen")}
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
      )}

      {tabIdx === 1 && (
        <>
          <Tabs value={slotCatIdx} onChange={(_, v) => setSlotCatIdx(v)} sx={{ mb: 2 }}>
            <Tab label={t("categoryHall")} />
            <Tab label={t("categoryKitchen")} />
          </Tabs>
          {slotCatIdx === 0 && <SlotManager category="HALL" />}
          {slotCatIdx === 1 && <SlotManager category="KITCHEN" />}
        </>
      )}
    </Box>
  );
}
