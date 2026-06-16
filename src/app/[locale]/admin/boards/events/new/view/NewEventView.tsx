"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
// import { useEventCreate } from "../hooks/useEventCreate";
import type { AdminPostFormInput } from "../../types";
import EventEditor from "./EventEditor";
import { useEventCreate } from "../../hooks/useEventCreate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

export default function NewEventView() {
  const { createOne, creating } = useEventCreate();

  const [form, setForm] = useState<AdminPostFormInput>({
    title: "",
    bodyRaw: "",
    bodyHtml: "",
    visibility: "PUBLIC",
    isPublished: false,

    eventStartAt: null,
    eventEndAt: null,
    bannerUrl: "",
    ctaLinkUrl: "",
  });

  const setField = useCallback(
    <K extends keyof AdminPostFormInput>(
      key: K,
      value: AdminPostFormInput[K]
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const onHtmlChange = useCallback((next: string) => {
    setForm((prev) => ({ ...prev, bodyHtml: next }));
  }, []);

  const onRawChange = useCallback((raw: string) => {
    setForm((prev) => ({ ...prev, bodyRaw: raw }));
  }, []);

  const onSubmitCreate = useCallback(async () => {
    const payload: AdminPostFormInput = {
      ...form,
      bannerUrl:
        form.bannerUrl && form.bannerUrl.trim().length > 0
          ? form.bannerUrl.trim()
          : null,
      ctaLinkUrl:
        form.ctaLinkUrl && form.ctaLinkUrl.trim().length > 0
          ? form.ctaLinkUrl.trim()
          : null,
    };

    const res = await createOne(payload);
    if (res.ok) {
      window.location.href = "/admin/boards/events";
      return;
    }
    alert(`[생성 실패] ${res.error ?? "unknown error"}`);
  }, [createOne, form]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">이벤트 글쓰기</h1>
        <div className="flex gap-2">
          <Link href="/admin/boards/events" className="inline-flex items-center justify-center text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 rounded-md">
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

          {/* 이벤트 메타 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>이벤트 시작</Label>
              <Input
                type="datetime-local"
                value={toDatetimeLocalValue(form.eventStartAt ?? null)}
                onChange={(e) =>
                  setField(
                    "eventStartAt",
                    fromDatetimeLocalValue(e.currentTarget.value)
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label>이벤트 종료</Label>
              <Input
                type="datetime-local"
                value={toDatetimeLocalValue(form.eventEndAt ?? null)}
                onChange={(e) =>
                  setField(
                    "eventEndAt",
                    fromDatetimeLocalValue(e.currentTarget.value)
                  )
                }
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>배너 URL(선택)</Label>
              <Input
                value={typeof form.bannerUrl === "string" ? form.bannerUrl : ""}
                onChange={(e) => setField("bannerUrl", e.currentTarget.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>CTA 링크 URL(선택)</Label>
              <Input
                value={
                  typeof form.ctaLinkUrl === "string" ? form.ctaLinkUrl : ""
                }
                onChange={(e) => setField("ctaLinkUrl", e.currentTarget.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* 본문 */}
          <div className="space-y-1">
            <Label>본문(Tiptap)</Label>
            <EventEditor
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
                  onCheckedChange={(checked) =>
                    setField("isPublished", checked)
                  }
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
