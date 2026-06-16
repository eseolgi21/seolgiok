// src/app/[locale]/admin/boards/announcements/new/view/NewAnnouncementView.tsx
"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAnnouncementCreate } from "../hooks/useAnnouncementCreate";
import type { AdminPostFormInput } from "../../types";
import AnnouncementEditor from "./AnnouncementEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function NewAnnouncementView() {
  const { createOne, creating } = useAnnouncementCreate();

  const [form, setForm] = useState<AdminPostFormInput>({
    title: "",
    bodyRaw: "",
    bodyHtml: "",
    visibility: "PUBLIC",
    isPublished: false,
  });

  // 공통 필드 업데이트
  const setField = useCallback(
    <K extends keyof AdminPostFormInput>(
      key: K,
      value: AdminPostFormInput[K]
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ✅ 에디터 콜백을 useCallback으로 고정 (불필요한 재생성 방지)
  const onHtmlChange = useCallback((next: string) => {
    setForm((prev) => ({ ...prev, bodyHtml: next }));
  }, []);

  const onRawChange = useCallback((raw: string) => {
    setForm((prev) => ({ ...prev, bodyRaw: raw }));
  }, []);

  const onSubmitCreate = useCallback(async () => {
    const res = await createOne(form);
    if (res.ok) {
      window.location.href = "/admin/boards/announcements";
      return;
    }
    alert(`[생성 실패] ${res.error ?? "unknown error"}`);
  }, [createOne, form]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">공지 글쓰기</h1>
        <div className="flex gap-2">
          <Link href="/admin/boards/announcements" className="inline-flex items-center justify-center text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 rounded-md">
            목록
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          {/* 제목 */}
          <div className="space-y-1">
            <Label>제목</Label>
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.currentTarget.value)}
              placeholder="제목을 입력하세요"
            />
          </div>

          {/* 본문(Tiptap) */}
          <div className="space-y-1">
            <Label>본문(Tiptap)</Label>
            <AnnouncementEditor
              initialHtml={form.bodyHtml}
              onHtmlChange={onHtmlChange}
              onRawChange={onRawChange}
            />
            <p className="text-xs text-muted-foreground">
              붙여넣기 시 이미지 data-src/srcset 정규화 적용
            </p>
          </div>

          {/* 가시성/발행 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>가시성</Label>
              <select
                className="border border-input bg-background rounded-md px-3 h-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.visibility}
                onChange={(e) =>
                  setField(
                    "visibility",
                    e.currentTarget.value === "PRIVATE" ? "PRIVATE" : "PUBLIC"
                  )
                }
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>발행 여부</Label>
              <div className="flex items-center pt-2">
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(checked) => setField("isPublished", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        {/* 액션 */}
        <CardFooter className="justify-end">
          <Button
            onClick={onSubmitCreate}
            disabled={creating}
          >
            {creating ? "등록 중..." : "등록하기"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
