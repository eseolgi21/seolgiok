"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { console.error(error); }, [error]);
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <h2 className="text-xl font-bold">오류가 발생했습니다</h2>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={reset} variant="outline">다시 시도</Button>
        </div>
    );
}
