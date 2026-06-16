// src/app/[locale]/(site)/auth/signup/view/SignupForm.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl"; // [추가] 번역 훅

import { useSignupValidation } from "@/app/[locale]/(site)/auth/signup/hooks/useSignupValidation";
import { signup } from "@/app/[locale]/(site)/auth/signup/utils/api";

import { TopPart } from "./TopPart";
import { MiddlePart } from "./MiddlePart";
import { RowPart } from "./RowPart";
import { Agreements } from "./Agreements";
import { SubmitBar } from "./SubmitBar";

import type {
  FormState,
  TopPartErrorText,
  RowPartErrorText,
} from "@/app/[locale]/(site)/auth/signup/types/signup/form";
import type {
  SignupError,
  SignupResponse,
} from "@/app/[locale]/(site)/auth/signup/types/signup/api";

export function SignupForm() {
  // [추가] 'authSignup' 네임스페이스 사용
  const t = useTranslations("authSignup");

  const router = useRouter();
  const [f, setF] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    password2: "",
    name: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [serverUsernameError, setServerUsernameError] = useState<
    string | undefined
  >();
  const [serverEmailError, setServerEmailError] = useState<
    string | undefined
  >();
  const [serverGeneralError, setServerGeneralError] = useState<
    string | undefined
  >();

  const v = useSignupValidation(f);

  const formValid =
    v.usernameOk &&
    v.emailOk &&
    v.pwAllOk &&
    v.confirmOk &&
    v.nameOk &&
    v.agreementsOk;

  function set<K extends keyof FormState>(key: K, val: FormState[K]): void {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitted(true);
    setServerUsernameError(undefined);
    setServerEmailError(undefined);
    setServerGeneralError(undefined);

    if (!formValid || loading) {
      toast.error(t("messages.inputErrorTitle"), { description: t("messages.inputErrorDesc") });
      return;
    }

    try {
      setLoading(true);
      const res: SignupResponse = await signup({
        username: f.username.toLowerCase().trim(),
        email: f.email.toLowerCase().trim(),
        password: f.password,
        name: f.name.trim(),
        agreeTerms: f.agreeTerms,
        agreePrivacy: f.agreePrivacy,
      });

      if (res.ok) {
        toast.success(t("messages.successTitle"), { description: t("messages.successDesc") });
        router.push("/auth/login");
        return;
      }

      const code: SignupError | undefined = res.code;
      // [수정] 서버 에러 메시지를 번역 키로 매핑
      switch (code) {
        case "USERNAME_TAKEN":
          setServerUsernameError(t("errors.usernameTaken"));
          break;
        case "EMAIL_TAKEN":
          setServerEmailError(t("errors.emailTaken"));
          break;
        default:
          setServerGeneralError(t("errors.checkInput"));
      }

      toast.error(code ? t("messages.failTitle") : t("messages.inputErrorTitle"), { description: t("errors.checkInput") });
    } catch {
      setServerGeneralError(t("errors.serverError")); // "서버/네트워크 오류가 발생했습니다."
      toast.error("Error", { description: t("errors.tempError") });
    } finally {
      setLoading(false);
    }
  }

  // [수정] 클라이언트 유효성 검사 메시지 번역
  const topErrorText: TopPartErrorText | undefined = useMemo(() => {
    const usernameErr =
      serverUsernameError ??
      (submitted && !v.usernameOk ? t("errors.usernameFormat") : undefined);
    const emailErr =
      serverEmailError ??
      (submitted && !v.emailOk ? t("errors.emailFormat") : undefined);
    if (usernameErr || emailErr) {
      return { username: usernameErr ?? "", email: emailErr ?? "" };
    }
    return undefined;
  }, [
    serverUsernameError,
    serverEmailError,
    submitted,
    v.usernameOk,
    v.emailOk,
    t, // t 함수 의존성 추가
  ]);

  const rowErrorText: RowPartErrorText | undefined = useMemo(() => {
    const nameErr =
      submitted && !v.nameOk ? t("errors.nicknameReq") : undefined;
    if (nameErr) {
      return { name: nameErr };
    }
    return undefined;
  }, [submitted, v.nameOk, t]);

  return (
    <section className="mx-auto max-w-screen-sm px-4 pt-4 pb-24">
      {serverGeneralError ? (
        <div className="mb-3 text-sm text-red-600 px-1">{serverGeneralError}</div>
      ) : null}

      {/* [수정] card 스타일 제거 (부모 컨테이너가 이미 스타일을 가지고 있음) */}
      <div className="bg-transparent">
        <div className="p-0">
          {/* [수정] 중복된 타이틀(회원가입) 제거 */}
          {/* <h2 className="card-title">{t("title")}</h2> */}

          <form onSubmit={onSubmit} aria-busy={loading}>
            <TopPart
              value={{ username: f.username, email: f.email }}
              onChange={(next) => {
                setF((prev) => ({
                  ...prev,
                  username: next.username,
                  email: next.email,
                }));
                if (next.username !== f.username)
                  setServerUsernameError(undefined);
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

            <RowPart
              value={{ name: f.name }}
              onChange={(next) => {
                setF((prev) => ({ ...prev, name: next.name }));
              }}
              disabled={loading}
              errorText={rowErrorText}
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
