// src/app/[locale]/(site)/auth/signup/view/SignupForm.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useSignupValidation } from "@/app/[locale]/(site)/auth/signup/hooks/useSignupValidation";
import { signup } from "@/app/[locale]/(site)/auth/signup/utils/api";

import { TopPart } from "./TopPart";
import { MiddlePart } from "./MiddlePart";
import { Agreements } from "./Agreements";
import { SubmitBar } from "./SubmitBar";

import type {
  FormState,
  TopPartErrorText,
} from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import type {
  SignupError,
  SignupResponse,
} from "@/app/[locale]/(site)/auth/signup/types/signup/api";

export function SignupForm() {
  const t = useTranslations("authSignup");

  const router = useRouter();
  const [f, setF] = useState<FormState>({
    email: "",
    password: "",
    password2: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [serverEmailError, setServerEmailError] = useState<
    string | undefined
  >();
  const [serverGeneralError, setServerGeneralError] = useState<
    string | undefined
  >();

  const v = useSignupValidation(f);

  const formValid =
    v.emailOk &&
    v.pwAllOk &&
    v.confirmOk &&
    v.agreementsOk;

  function set<K extends keyof FormState>(key: K, val: FormState[K]): void {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitted(true);
    setServerEmailError(undefined);
    setServerGeneralError(undefined);

    if (!formValid || loading) {
      toast.error(t("messages.inputErrorTitle"), { description: t("messages.inputErrorDesc") });
      return;
    }

    try {
      setLoading(true);
      const res: SignupResponse = await signup({
        email: f.email.toLowerCase().trim(),
        password: f.password,
        agreeTerms: f.agreeTerms,
        agreePrivacy: f.agreePrivacy,
      });

      if (res.ok) {
        toast.success(t("messages.successTitle"), { description: t("messages.successDesc") });
        router.push("/auth/login");
        return;
      }

      const code: SignupError | undefined = res.code;
      switch (code) {
        case "EMAIL_TAKEN":
          setServerEmailError(t("errors.emailTaken"));
          break;
        default:
          setServerGeneralError(t("errors.checkInput"));
      }

      toast.error(code ? t("messages.failTitle") : t("messages.inputErrorTitle"), { description: t("errors.checkInput") });
    } catch {
      setServerGeneralError(t("errors.serverError"));
      toast.error("Error", { description: t("errors.tempError") });
    } finally {
      setLoading(false);
    }
  }

  const topErrorText: TopPartErrorText | undefined = useMemo(() => {
    const emailErr =
      serverEmailError ??
      (submitted && !v.emailOk ? t("errors.emailFormat") : undefined);
    if (emailErr) {
      return { email: emailErr };
    }
    return undefined;
  }, [
    serverEmailError,
    submitted,
    v.emailOk,
    t,
  ]);

  return (
    <section className="mx-auto max-w-screen-sm px-4 pt-4 pb-24">
      {serverGeneralError ? (
        <div className="mb-3 text-sm text-red-600 px-1">{serverGeneralError}</div>
      ) : null}

      <div className="bg-transparent">
        <div className="p-0">
          <form onSubmit={onSubmit} aria-busy={loading}>
            <TopPart
              value={{ email: f.email }}
              onChange={(next) => {
                setF((prev) => ({
                  ...prev,
                  email: next.email,
                }));
                if (next.email !== f.email) setServerEmailError(undefined);
              }}
              disabled={loading}
              errorText={topErrorText}
            />

            <MiddlePart
              password={f.password}
              password2={f.password2}
              onPasswordChange={(v) => set("password", v)}
              onPassword2Change={(v) => set("password2", v)}
              disabled={loading}
              checklist={{
                len: v.pwLenOk,
                letter: v.pwHasLetter,
                digit: v.pwHasDigit,
                upper: v.pwHasUpper,
                symbol: v.pwHasSymbol,
                confirmShown: f.password2.length > 0,
                confirmOk: v.confirmOk,
              }}
            />

            <Agreements
              agreeTerms={f.agreeTerms}
              agreePrivacy={f.agreePrivacy}
              onChangeTerms={(b) => set("agreeTerms", b)}
              onChangePrivacy={(b) => set("agreePrivacy", b)}
              submitted={submitted}
              disabled={loading}
              agreementsOk={v.agreementsOk}
            />

            <SubmitBar loading={loading} disabled={!formValid && submitted} />
          </form>
        </div>
      </div>
    </section>
  );
}
