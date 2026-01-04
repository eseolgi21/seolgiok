
"use client";

import { useState } from "react";

export default function CardUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false); // Replaces 'uploading'
    const [message, setMessage] = useState(""); // Replaces 'result'

    // Delete State
    const [delYear, setDelYear] = useState(new Date().getFullYear());
    const [delMonth, setDelMonth] = useState(new Date().getMonth() + 1);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("파일을 선택해주세요.");
            return;
        }

        setLoading(true);
        setMessage("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/sales/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(`업로드 성공! ${data.count}건이 처리되었습니다.`);
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                setMessage(`오류 발생: ${data.error}`);
            }
        } catch (error) {
            setMessage("업로드 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`${delYear}년 ${delMonth}월 데이터를 삭제하시겠습니까?`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch("/api/admin/sales/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year: delYear, month: delMonth, type: 'monthly' }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
            } else {
                alert(`삭제 실패: ${data.error}`);
            }
        } catch (e) {
            alert("삭제 중 오류가 발생했습니다.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("정말로 모든 카드 내역을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
        if (!confirm("확인을 위해 한번 더 묻습니다. 정말 삭제하시겠습니까?")) return;

        setIsDeletingAll(true);
        try {
            const res = await fetch("/api/admin/sales/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: 'all' }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
            } else {
                alert(`전체 삭제 실패: ${data.error}`);
            }
        } catch (e) {
            alert("삭제 중 오류가 발생했습니다.");
        } finally {
            setIsDeletingAll(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">카드 내역 업로드</h1>

            {/* Upload Section */}
            <div className="card bg-base-100 border shadow-sm">
                <div className="card-body">
                    <h2 className="card-title text-base mb-4">엑셀 파일 업로드</h2>
                    <div className="flex gap-2">
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx, .xls"
                            className="file-input file-input-bordered w-full max-w-md"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={!file || loading}
                        >
                            {loading ? <span className="loading loading-spinner"></span> : "업로드"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Section */}
            <div className="card bg-base-100 border shadow-sm">
                <div className="card-body">
                    <h2 className="card-title text-base mb-4 text-error">데이터 삭제</h2>
                    <div className="flex items-center gap-2">
                        <select
                            className="select select-bordered"
                            value={delYear}
                            onChange={(e) => setDelYear(Number(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                <option key={y} value={y}>{y}년</option>
                            ))}
                        </select>
                        <select
                            className="select select-bordered"
                            value={delMonth}
                            onChange={(e) => setDelMonth(Number(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{m}월</option>
                            ))}
                        </select>
                        <button
                            className="btn btn-error text-white"
                            onClick={handleDelete}
                            disabled={isDeleting || isDeletingAll}
                        >
                            {isDeleting ? <span className="loading loading-spinner"></span> : "해당 월 데이터 삭제"}
                        </button>
                    </div>

                    <div className="divider my-4"></div>

                    <div className="flex items-center justify-between">
                        <span className="text-error font-bold">⚠️ 전체 데이터 초기화</span>
                        <button
                            className="btn btn-outline btn-error btn-sm"
                            onClick={handleDeleteAll}
                            disabled={isDeleting || isDeletingAll}
                        >
                            {isDeletingAll ? <span className="loading loading-spinner"></span> : "전체 삭제"}
                        </button>
                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                        * 선택한 "확정일" 기준의 월 데이터가 모두 삭제됩니다.<br />
                        * 카드 지출 분석에서 데이터가 중복되거나 잘못된 경우 삭제 후 다시 업로드하세요.<br />
                        * "전체 삭제"를 누르면 모든 카드 내역이 영구적으로 삭제됩니다.
                    </p>
                </div>
            </div>

            {message && (
                <div className={`alert ${message.includes("오류") ? "alert-error" : "alert-success"}`}>
                    <span>{message}</span>
                </div>
            )}
        </div>
    );
}
