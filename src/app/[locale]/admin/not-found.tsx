import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <h2 className="text-xl font-bold">페이지를 찾을 수 없습니다</h2>
            <Button asChild variant="outline">
                <Link href="/admin/dashboard">대시보드로 이동</Link>
            </Button>
        </div>
    );
}
