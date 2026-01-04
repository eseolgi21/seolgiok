"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
// import { useEventCreate } from "../hooks/useEventCreate";
import type { AdminPostFormInput } from "../../types";
import EventEditor from "./EventEditor";
import { useEventCreate } from "../../hooks/useEventCreate";

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
          <Link href="/admin/boards/events" className="btn btn-sm">
            목록
          </Link>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          {/* 제목 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">제목</span>
            </label>
            <input
              className="input input-bordered"
              value={form.title}
              onChange={(e) => setField("title", e.currentTarget.value)}
              placeholder="제목을 입력하세요"
            />
          </div>

          {/* 이벤트 메타 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">이벤트 시작</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={toDatetimeLocalValue(form.eventStartAt ?? null)}
                onChange={(e) =>
                  setField(
                    "eventStartAt",
                    fromDatetimeLocalValue(e.currentTarget.value)
                  )
                }
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">이벤트 종료</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={toDatetimeLocalValue(form.eventEndAt ?? null)}
                onChange={(e) =>
                  setField(
                    "eventEndAt",
                    fromDatetimeLocalValue(e.currentTarget.value)
                  )
                }
              />
            </div>

            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">배너 URL(선택)</span>
              </label>
              <input
                className="input input-bordered"
                value={typeof form.bannerUrl === "string" ? form.bannerUrl : ""}
                onChange={(e) => setField("bannerUrl", e.currentTarget.value)}
                placeholder="https://..."
              />
            </div>

            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">CTA 링크 URL(선택)</span>
              </label>
              <input
                className="input input-bordered"
                value={
                  typeof form.ctaLinkUrl === "string" ? form.ctaLinkUrl : ""
                }
                onChange={(e) => setField("ctaLinkUrl", e.currentTarget.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* 본문 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">본문(Tiptap)</span>
            </label>
            <EventEditor
              initialHtml={form.bodyHtml}
              onHtmlChange={onHtmlChange}
              onRawChange={onRawChange}
            />
            <label className="label">
              <span className="label-text-alt">
                붙여넣기 시 이미지 data-src/srcset 정규화 적용
              </span>
            </label>
          </div>

          {/* 가시성/발행 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">가시성</span>
              </label>
              <select
                className="select select-bordered"
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
            <div className="form-control">
              <label className="label">
                <span className="label-text">발행 여부</span>
              </label>
              <input
                type="checkbox"
                className="toggle"
                checked={form.isPublished}
                onChange={(e) =>
                  setField("isPublished", e.currentTarget.checked)
                }
              />
            </div>
          </div>

          {/* 액션 */}
          <div className="card-actions justify-end mt-2">
            <button
              className="btn btn-primary"
              onClick={onSubmitCreate}
              disabled={creating}
            >
              {creating ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
