"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import { sanitizeHtmlAllowBasic } from "@/app/[locale]/admin/boards/announcements/gaurd/announcements";

type Post = {
  id: string;
  title: string;
  bodyHtml: string;
  createdAt: string;
  author: { name: string };
};

export default function StaffSuggestionsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/staff/suggestions")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPosts(d.posts);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        직원 건의글
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : posts.length === 0 ? (
        <Typography color="text.secondary">건의글이 없습니다.</Typography>
      ) : (
        <List>
          {posts.map((p, i) => (
            <>
              <ListItem key={p.id} alignItems="flex-start">
                <ListItemText
                  primary={p.title}
                  secondary={
                    <>
                      <strong>{p.author.name}</strong> ·{" "}
                      {new Date(p.createdAt).toLocaleDateString()}
                      <br />
                      <span
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtmlAllowBasic(p.bodyHtml),
                        }}
                      />
                    </>
                  }
                />
              </ListItem>
              {i < posts.length - 1 && <Divider />}
            </>
          ))}
        </List>
      )}
    </Box>
  );
}
