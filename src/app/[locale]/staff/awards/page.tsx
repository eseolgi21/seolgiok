"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Avatar, Button,
  Chip, CircularProgress, Grid,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslations } from "next-intl";

type Ranking = { targetId: string; name: string; count: number };

export default function AwardsPage() {
  const t = useTranslations("staffPortal");
  const [ranking, setRanking] = useState<Ranking[]>([]);
  const [votedToday, setVotedToday] = useState(false);
  const [votedTargetId, setVotedTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/staff/awards")
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setRanking(d.ranking);
          setVotedToday(d.votedToday);
          setVotedTargetId(d.votedTargetId);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVote = async (targetId: string) => {
    if (submitting || votedToday) return;
    setSubmitting(true);
    const res = await fetch("/api/staff/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    const data = await res.json();
    if (data.ok) {
      setVotedToday(true);
      setVotedTargetId(targetId);
      fetchData();
    }
    setSubmitting(false);
  };

  const MEDAL_COLORS = ["gold", "silver", "#cd7f32"] as const;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <EmojiEventsIcon color="warning" />{t("awards.pageTitle")}
      </Typography>
      {ranking.length > 0 && (
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t("awards.top3")}
        </Typography>
      )}
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {ranking.length === 0 ? (
            <Grid size={12}>
              <Typography color="text.secondary">
                아직 투표가 없습니다. 동료에게 투표해 보세요!
              </Typography>
            </Grid>
          ) : (
            ranking.map((r, i) => (
              <Grid size={{ xs: 12, sm: 6 }} key={r.targetId}>
                <Card
                  variant={i < 3 ? "outlined" : "elevation"}
                  sx={{ borderColor: i === 0 ? "gold" : undefined }}
                >
                  <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: i < 3 ? MEDAL_COLORS[i] : "grey.400" }}>
                      {i < 3 ? <EmojiEventsIcon /> : r.name[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography>
                      <Chip
                        label={t("awards.voteCount").replace("{count}", String(r.count))}
                        size="small"
                      />
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={votedToday || submitting}
                      onClick={() => handleVote(r.targetId)}
                      color={votedTargetId === r.targetId ? "success" : "primary"}
                    >
                      {votedTargetId === r.targetId
                        ? t("awards.alreadyVoted")
                        : t("awards.voteButton")}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
}
