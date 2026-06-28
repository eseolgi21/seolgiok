"use client";

import { useEffect, useState } from "react";
import { Typography, Box, CircularProgress, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";

type Notice = { id: string; title: string; bodyHtml: string; publishedAt: string | null };

export default function NoticeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/staff/notices?id=${params.id}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setNotice(d.post); })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <CircularProgress />;
  if (!notice) return <Typography>공지를 찾을 수 없습니다.</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mb: 2 }}>
        목록으로
      </Button>
      <Typography variant="h6" gutterBottom>{notice.title}</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
        {new Date(notice.publishedAt ?? "").toLocaleDateString()}
      </Typography>
      <Box dangerouslySetInnerHTML={{ __html: notice.bodyHtml }} />
    </Box>
  );
}
