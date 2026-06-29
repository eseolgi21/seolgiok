"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Switch,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useTranslations } from "next-intl";

type Item = { id: string; label: string; order: number; isActive: boolean };

export default function HandoverManageClient() {
  const t = useTranslations("staffPortal.handoverManage");
  const [items, setItems] = useState<Item[]>([]);
  const [newLabel, setNewLabel] = useState("");

  const fetchItems = () =>
    fetch("/api/admin/staff/handover/items")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems(d.items);
      });

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const res = await fetch("/api/admin/staff/handover/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    if ((await res.json()).ok) {
      setNewLabel("");
      fetchItems();
    }
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
      <Typography variant="h6" gutterBottom>
        {t("pageTitle")}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          size="small"
          label={t("newItemLabel")}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          {t("addButton")}
        </Button>
      </Box>
      <List>
        {items.map((item) => (
          <ListItem
            key={item.id}
            secondaryAction={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Switch
                  size="small"
                  checked={item.isActive}
                  onChange={(e) => handleToggle(item.id, e.target.checked)}
                />
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(item.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={item.label}
              sx={{
                textDecoration: item.isActive ? "none" : "line-through",
                color: item.isActive ? "inherit" : "text.secondary",
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
