"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Payslip = {
  id: string;
  year: number;
  month: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  user: { id: string; name: string };
  uploader: { name: string };
};

type StaffUser = { id: string; name: string; level: number };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PayslipsView() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    userId: "",
    year: String(CURRENT_YEAR),
    month: String(new Date().getMonth() + 1),
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPayslips = () =>
    fetch("/api/admin/staff/payslips")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPayslips(d.payslips); });

  const fetchStaffUsers = () =>
    fetch("/api/admin/staff/payslips?type=staff-users")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setStaffUsers(d.users); });

  useEffect(() => {
    fetchPayslips();
    fetchStaffUsers();
  }, []);

  const handleUpload = async () => {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("PDF 파일을 선택해주세요."); return; }
    if (!form.userId) { setError("직원을 선택해주세요."); return; }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("userId", form.userId);
    fd.append("year", form.year);
    fd.append("month", form.month);

    setUploading(true);
    try {
      const res = await fetch("/api/admin/staff/payslips", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        setUploadOpen(false);
        setForm({ userId: "", year: String(CURRENT_YEAR), month: String(new Date().getMonth() + 1) });
        if (fileRef.current) fileRef.current.value = "";
        fetchPayslips();
      } else {
        const msgMap: Record<string, string> = {
          INVALID_FILE_TYPE: "PDF 파일만 업로드 가능합니다.",
          FILE_TOO_LARGE: "파일 크기는 10MB 이하여야 합니다.",
          USER_NOT_FOUND: "해당 직원을 찾을 수 없습니다.",
        };
        setError(msgMap[data.code] ?? "업로드 실패");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected.length) return;
    await fetch("/api/admin/staff/payslips", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    setSelected([]);
    fetchPayslips();
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const allSelected = payslips.length > 0 && selected.length === payslips.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>급여명세서 관리</CardTitle>
          <div className="flex gap-2">
            {selected.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                선택 삭제 ({selected.length})
              </Button>
            )}
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              급여명세서 업로드
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) =>
                    setSelected(v ? payslips.map((p) => p.id) : [])
                  }
                />
              </TableHead>
              <TableHead>직원명</TableHead>
              <TableHead>연도/월</TableHead>
              <TableHead>파일명</TableHead>
              <TableHead>파일 크기</TableHead>
              <TableHead>업로드일</TableHead>
              <TableHead>업로더</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  등록된 급여명세서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{p.user.name}</TableCell>
                  <TableCell>{p.year}년 {String(p.month).padStart(2, "0")}월</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                    {p.fileName}
                  </TableCell>
                  <TableCell className="text-sm">{formatBytes(p.fileSize)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(p.uploadedAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.uploader.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewId(p.id)}
                    >
                      미리보기
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* 업로드 다이얼로그 */}
      <Dialog open={uploadOpen} onOpenChange={(v) => { setUploadOpen(v); setError(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>급여명세서 업로드</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>직원 선택</Label>
              <Select value={form.userId} onValueChange={(v) => setForm((p) => ({ ...p, userId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="직원을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {staffUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>연도</Label>
                <Select value={form.year} onValueChange={(v) => setForm((p) => ({ ...p, year: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>월</Label>
                <Select value={form.month} onValueChange={(v) => setForm((p) => ({ ...p, month: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={String(m)}>{m}월</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>PDF 파일</Label>
              <Input ref={fileRef} type="file" accept="application/pdf" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
                취소
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "업로드 중..." : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF 미리보기 다이얼로그 */}
      <Dialog open={!!previewId} onOpenChange={(v) => !v && setPreviewId(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>급여명세서 미리보기</DialogTitle>
          </DialogHeader>
          {previewId && (
            <div className="flex-1 flex flex-col gap-2">
              <iframe
                src={`/api/admin/staff/payslips/${previewId}/file`}
                className="flex-1 w-full rounded border"
                title="급여명세서"
              />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/admin/staff/payslips/${previewId}/file`} download>
                    다운로드
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
