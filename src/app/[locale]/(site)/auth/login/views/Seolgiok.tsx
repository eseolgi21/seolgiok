"use client";

import { useCallback, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button, Form } from "@/components/ui";
import type { LoginResponse } from "@/types/auth/login/types";
import { useToast } from "@/components/ui/feedback/Toast-provider";
import Image from "next/image";

export function SeolgiokLogin() {
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations("authLogin.Seolgiok");

    const [id, setId] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);

    // Simple validation
    const idOk = id.length > 0;
    const pwOk = pwd.length > 0;
    const formValid = idOk && pwOk;

    const onSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!formValid || loading) return;

            try {
                setLoading(true);
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: id.trim(), password: pwd }),
                });
                const data = (await res.json()) as LoginResponse;
                if (res.ok && data.ok) {
                    toast({
                        title: t("messages.successTitle"),
                        description: t("messages.successDesc", {
                            username: data.user.username,
                        }),
                        variant: "success",
                        position: "top-right",
                        duration: 2000,
                    });
                    const params = new URLSearchParams(window.location.search);
                    const next = params.get("next") ?? "/";
                    router.replace(next);
                    router.refresh();
                    return;
                }

                // Error handling
                if (!res.ok && !data.ok) {
                    let msg = t("messages.validationError");

                    if (data.code === "USER_NOT_FOUND") {
                        msg = t("messages.userNotFound");
                    } else if (data.code === "INVALID_PASSWORD") {
                        msg = t("messages.invalidPassword");
                    } else if (data.code === "INVALID_CREDENTIALS") {
                        msg = t("messages.invalidCredentials");
                    }

                    toast({
                        title: t("messages.failTitle"),
                        description: msg,
                        variant: "error",
                        position: "top-right",
                        duration: 3500,
                    });
                }
            } catch {
                toast({
                    title: t("messages.networkErrorTitle"),
                    description: t("messages.networkErrorDesc"),
                    variant: "error",
                    position: "top-right",
                    duration: 3500,
                });
            } finally {
                setLoading(false);
            }
        },
        [formValid, loading, id, pwd, router, toast, t]
    );

    return (
        <div className="relative w-full min-h-[calc(100svh-4rem)] flex items-center bg-cream selection:bg-gold selection:text-white">
            {/* Left: Image Section */}
            <div className="hidden lg:block w-1/2 h-full absolute top-0 left-0 overflow-hidden">
                <Image
                    src="/images/seolgiok_homescreen.png"
                    alt="Seolgiok Hero"
                    fill
                    className="object-cover object-center brightness-[0.85] sepia-[0.2]"
                    priority
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-20 left-16 text-white text-left z-10">
                    <h2 className="text-4xl font-serif font-bold mb-4 drop-shadow-lg">정성의 시간</h2>
                    <p className="text-lg font-light tracking-wide opacity-90 drop-shadow-md">
                        24시간의 기다림이 빚어낸<br />맑고 깊은 한 그릇
                    </p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="w-full lg:w-1/2 ml-auto h-full flex items-center justify-center p-8 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="w-full max-w-[420px] bg-white p-10 shadow-xl border border-cream-border">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-serif font-bold text-dark mb-2">{t("heading")}</h1>
                        <p className="text-gray-500 text-sm tracking-wide">{t("membershipLabel")}</p>
                        <div className="w-10 h-px bg-gold mx-auto mt-6" />
                    </div>

                    <Form onSubmit={onSubmit} className="space-y-6" aria-busy={loading}>
                        <div className="space-y-5">
                            {/* ID Input */}
                            <div className="w-full">
                                <label htmlFor="login-id" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    {t("fields.idLabel")}
                                </label>
                                <input
                                    id="login-id"
                                    className="w-full bg-cream border border-cream-border px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all placeholder:text-gray-400"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    placeholder={t("fields.idPlaceholder")}
                                    disabled={loading}
                                />
                            </div>

                            {/* Password Input */}
                            <div className="w-full">
                                <label htmlFor="login-password" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    {t("fields.pwLabel")}
                                </label>
                                <input
                                    id="login-password"
                                    type="password"
                                    className="w-full bg-cream border border-cream-border px-4 py-3 text-gray-900 rounded-none focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all placeholder:text-gray-400"
                                    value={pwd}
                                    onChange={(e) => setPwd(e.target.value)}
                                    placeholder={t("fields.pwPlaceholder")}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-dark text-cream hover:bg-dark-hover border border-dark rounded-none py-4 text-sm font-bold uppercase tracking-widest transition-all mt-4"
                        >
                            {loading ? <span className="loading loading-spinner text-cream" /> : t("buttons.submit")}
                        </Button>

                        <div className="flex items-center justify-between text-xs text-gray-500 mt-6 pt-6 border-t border-cream-border">
                            <div className="flex gap-4">
                                <button type="button" onClick={() => router.push("/auth/find-id")} className="hover:text-gold transition-colors">{t("buttons.findId")}</button>
                                <span className="text-gray-300">|</span>
                                <button type="button" onClick={() => router.push("/auth/find-password")} className="hover:text-gold transition-colors">{t("buttons.findPw")}</button>
                            </div>
                            <button type="button" onClick={() => router.push("/auth/signup")} className="font-bold text-dark hover:text-gold transition-colors">{t("buttons.signup")}</button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}
