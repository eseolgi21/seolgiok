"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, TextField, Button, List, ListItem,
  ListItemText, Divider, CircularProgress, Paper,
} from "@mui/material";
import { useTranslations } from "next-intl";

type Post = { id: string; title: string; createdAt: string };

export default function SuggestionsPage() {
  const t = useTranslations("staffPortal");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(() => {
    fetch("/api/staff/suggestions")
      .then(r => r.json())
      .then(d => { if (d.ok) setPosts(d.posts); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/staff/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim() }),
    });
    const data = await res.json();
    if (data.ok) {
      setTitle("");
      setBody("");
      fetchPosts();
    }
    setSubmitting(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t("suggestions.pageTitle")}</Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          sx={{ mb: 2 }}
          size="small"
        />
        <TextField
          fullWidth
          multiline
          rows={4}
          label={t("suggestions.placeholder")}
          value={body}
          onChange={e => setBody(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !body.trim()}
        >
          {t("suggestions.submit")}
        </Button>
      </Paper>
      <Typography variant="subtitle2" gutterBottom>{t("suggestions.myList")}</Typography>
      {loading ? (
        <CircularProgress />
      ) : posts.length === 0 ? (
        <Typography color="text.secondary">{t("suggestions.empty")}</Typography>
      ) : (
        <List dense>
          {posts.map((p, i) => (
            <Box key={p.id}>
              <ListItem>
                <ListItemText
                  primary={p.title}
                  secondary={new Date(p.createdAt).toLocaleDateString()}
                />
              </ListItem>
              {i < posts.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}
