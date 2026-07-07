// src/app/[locale]/admin/stores/view/ListView.tsx
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { Store, UseStoresListReturn } from "../types";

const COMMON_TIMEZONES = [
  "Asia/Seoul",
  "Asia/Ho_Chi_Minh",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "America/New_York",
];

function buildTimezoneOptions(): string[] {
  try {
    const all =
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : COMMON_TIMEZONES;
    return Array.from(new Set([...COMMON_TIMEZONES, ...all]));
  } catch {
    return COMMON_TIMEZONES;
  }
}

// API 코드/내부 결과 코드 → adminStores.toast.* 번역 키 매핑
function toastKeyFor(code: string): string {
  const map: Record<string, string> = {
    createSuccess: "toast.createSuccess",
    updateSuccess: "toast.updateSuccess",
    toggleActiveSuccess: "toast.toggleActiveSuccess",
    deleteSuccess: "toast.deleteSuccess",
    STORE_IN_USE: "toast.storeInUse",
    STORE_NOT_FOUND: "toast.notFound",
    STORE_NAME_DUPLICATE: "toast.storeNameDuplicate",
    VALIDATION_ERROR: "toast.validationError",
    INVALID_JSON: "toast.validationError",
    INVALID_RESPONSE: "toast.loadError",
    NETWORK_ERROR: "toast.networkError",
    DELETE_FAILED: "toast.genericError",
    CREATE_FAILED: "toast.genericError",
    UPDATE_FAILED: "toast.genericError",
  };
  return map[code] ?? "toast.genericError";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return iso;
  }
}

function StoresTable(props: {
  rows: Store[];
  onEdit: (store: Store) => void;
  onToggleActive: (store: Store) => void;
  togglingId: string | null;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}) {
  const {
    rows, onEdit, onToggleActive, togglingId,
    selectedIds, toggleSelect, toggleSelectAll, isAllSelected, isIndeterminate,
  } = props;
  const t = useTranslations("adminStores");

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={toggleSelectAll}
              />
            </TableCell>
            <TableCell>{t("table.name")}</TableCell>
            <TableCell>{t("table.address")}</TableCell>
            <TableCell>{t("table.coordinates")}</TableCell>
            <TableCell>{t("table.radiusMeters")}</TableCell>
            <TableCell>{t("table.timezone")}</TableCell>
            <TableCell>{t("table.memberCount")}</TableCell>
            <TableCell>{t("table.isActive")}</TableCell>
            <TableCell>{t("table.updatedAt")}</TableCell>
            <TableCell>{t("table.actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((store) => (
            <TableRow key={store.id} selected={selectedIds.has(store.id)} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedIds.has(store.id)}
                  onChange={() => toggleSelect(store.id)}
                />
              </TableCell>
              <TableCell>{store.name}</TableCell>
              <TableCell>{store.address ?? "-"}</TableCell>
              <TableCell>
                {store.latitude.toFixed(5)}, {store.longitude.toFixed(5)}
              </TableCell>
              <TableCell>{store.radiusMeters}m</TableCell>
              <TableCell>{store.timezone}</TableCell>
              <TableCell>{store._count.members}</TableCell>
              <TableCell>
                <Switch
                  size="small"
                  checked={store.isActive}
                  disabled={togglingId === store.id}
                  onChange={() => onToggleActive(store)}
                />
              </TableCell>
              <TableCell>{formatDate(store.updatedAt)}</TableCell>
              <TableCell>
                <Tooltip title={t("actions.edit")}>
                  <IconButton size="small" onClick={() => onEdit(store)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} align="center">
                {t("table.noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function StoreFormDialog(props: {
  open: boolean;
  mode: "create" | "edit";
  form: UseStoresListReturn["form"];
  setForm: UseStoresListReturn["setForm"];
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { open, mode, form, setForm, submitting, onClose, onSubmit } = props;
  const t = useTranslations("adminStores");
  const timezoneOptions = useMemo(buildTimezoneOptions, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === "create" ? t("form.createTitle") : t("form.editTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t("form.name")}
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label={t("form.address")}
            value={form.address}
            onChange={(e) => setForm({ address: e.target.value })}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label={t("form.latitude")}
              value={form.latitude}
              onChange={(e) => setForm({ latitude: e.target.value })}
              type="number"
              slotProps={{ htmlInput: { step: "any" } }}
              fullWidth
              required
            />
            <TextField
              label={t("form.longitude")}
              value={form.longitude}
              onChange={(e) => setForm({ longitude: e.target.value })}
              type="number"
              slotProps={{ htmlInput: { step: "any" } }}
              fullWidth
              required
            />
          </Stack>
          <TextField
            label={t("form.radiusMeters")}
            value={form.radiusMeters}
            onChange={(e) => setForm({ radiusMeters: e.target.value })}
            type="number"
            slotProps={{ htmlInput: { step: 1, min: 10, max: 2000 } }}
            fullWidth
            required
          />
          <Autocomplete
            options={timezoneOptions}
            value={form.timezone}
            onChange={(_, value) => setForm({ timezone: value ?? "Asia/Seoul" })}
            noOptionsText={t("timezoneSearch.noOptions")}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("timezoneSearch.label")}
                placeholder={t("timezoneSearch.placeholder")}
              />
            )}
          />
          <Typography variant="caption" color="text.secondary">
            {t("form.timezoneHelper")}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Switch
              checked={form.isActive}
              onChange={(e) => setForm({ isActive: e.target.checked })}
            />
            <Typography variant="body2">{t("form.isActive")}</Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("form.cancel")}
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : t("form.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ListView(props: UseStoresListReturn) {
  const {
    loading, stores, refresh,
    isFormOpen, formMode, form, setForm, openCreateForm, openEditForm, closeForm,
    submitting, submitForm,
    togglingId, toggleActive,
    selectedIds, toggleSelect, toggleSelectAll, isAllSelected, isIndeterminate,
    deleteSelected, deletingSelected,
    snackbar, closeSnackbar,
  } = props;
  const t = useTranslations("adminStores");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const selectedCount = selectedIds.size;

  const handleConfirmDelete = async () => {
    setDeleteConfirmOpen(false);
    await deleteSelected();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {t("page.title")}
        </Typography>
        <Stack direction="row" spacing={1}>
          {selectedCount > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={deletingSelected}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              {deletingSelected ? <CircularProgress size={18} /> : t("actions.deleteSelected", { count: selectedCount })}
            </Button>
          )}
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refresh}>
            {t("refresh")}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
            {t("actions.create")}
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress size={24} />
          <Typography>{t("loading")}</Typography>
        </Stack>
      ) : (
        <StoresTable
          rows={stores}
          onEdit={openEditForm}
          onToggleActive={toggleActive}
          togglingId={togglingId}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
        />
      )}

      <StoreFormDialog
        open={isFormOpen}
        mode={formMode}
        form={form}
        setForm={setForm}
        submitting={submitting}
        onClose={closeForm}
        onSubmit={() => void submitForm()}
      />

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t("deleteDialog.confirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography>{t("deleteDialog.confirmDesc", { count: selectedCount })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>{t("deleteDialog.cancel")}</Button>
          <Button color="error" variant="contained" onClick={() => void handleConfirmDelete()}>
            {t("deleteDialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {t(toastKeyFor(snackbar.message))}
        </Alert>
      </Snackbar>
    </Box>
  );
}
