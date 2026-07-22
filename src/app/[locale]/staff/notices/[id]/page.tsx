"use client";

import { useEffect, useMemo, useState } from "react";
import { Typography, Box, CircularProgress, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { sanitizeHtmlAllowBasic } from "@/app/[locale]/admin/boards/announcements/gaurd/announcements";

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

  // 방어심층: 저장 시점에 이미 살균되어야 하지만(write측), 렌더 직전에도 한 번 더 살균해
  // 이중 방어한다(Stored XSS 방어심층 갭 대응).
  const safeBodyHtml = useMemo(
    () => (notice ? sanitizeHtmlAllowBasic(notice.bodyHtml) : ""),
    [notice]
  );

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
      <Box dangerouslySetInnerHTML={{ __html: safeBodyHtml }} />
    </Box>
  );
}
