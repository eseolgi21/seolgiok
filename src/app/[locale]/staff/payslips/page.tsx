"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useTranslations } from "next-intl";

type Payslip = {
  id: string;
  year: number;
  month: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PayslipsPage() {
  const t = useTranslations("staffPortal");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewPayslip = payslips.find((p) => p.id === previewId);

  useEffect(() => {
    fetch("/api/staff/payslips")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPayslips(d.payslips); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t("payslips.pageTitle")}
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : payslips.length === 0 ? (
        <Typography color="text.secondary">{t("payslips.empty")}</Typography>
      ) : (
        <List disablePadding>
          {payslips.map((p, i) => (
            <Box key={p.id}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => setPreviewId(p.id)}>
                  <ListItemText
                    primary={`${p.year}년 ${String(p.month).padStart(2, "0")}월 급여명세서`}
                    secondary={`${formatBytes(p.fileSize)} · ${new Date(p.uploadedAt).toLocaleDateString("ko-KR")}`}
                  />
                </ListItemButton>
              </ListItem>
              {i < payslips.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      <Dialog
        open={!!previewId}
        onClose={() => setPreviewId(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { height: "90vh" } } }}
      >
        <DialogTitle>
          {previewPayslip
            ? `${previewPayslip.year}년 ${String(previewPayslip.month).padStart(2, "0")}월 급여명세서`
            : t("payslips.pageTitle")}
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          {previewId && (
            <iframe
              src={`/api/staff/payslips/${previewId}/file`}
              style={{ flex: 1, width: "100%", border: "none", minHeight: 0 }}
              title="급여명세서"
            />
          )}
        </DialogContent>
        <DialogActions>
          {previewId && (
            <Button
              component="a"
              href={`/api/staff/payslips/${previewId}/file`}
              download
              startIcon={<DownloadIcon />}
              size="small"
            >
              {t("payslips.download")}
            </Button>
          )}
          <Button onClick={() => setPreviewId(null)}>{t("payslips.close")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
