"use client";

import { useMemo } from "react";
import type {
  FormState,
  Option,
  SignupValidation,
} from "@/app/[locale]/(site)/auth/signup/types/signup/form";

export function useSignupValidation(
  f: FormState,
  countryOptions: Option[]
): SignupValidation {
  const usernameOk = useMemo(
    () => /^[a-z0-9_]{4,16}$/.test(f.username),
    [f.username]
  );

  const emailOk = useMemo(() => {
    if (!f.email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  }, [f.email]);

  const pwLenOk = f.password.length >= 8 && f.password.length <= 18;
  const pwHasLetter = /[A-Za-z]/.test(f.password);
  const pwHasDigit = /\d/.test(f.password);
  const pwHasUpper = /[A-Z]/.test(f.password);
  const pwHasSymbol = /[^A-Za-z0-9]/.test(f.password);
  const pwAllOk =
    pwLenOk && pwHasLetter && pwHasDigit && pwHasUpper && pwHasSymbol;

  const confirmOk = f.password2.length > 0 && f.password === f.password2;

  const nameOk = f.name.trim().length > 0;
  const agreementsOk = f.agreeTerms && f.agreePrivacy;

  const trimmed = f.countryCode.trim();
  const countryCodeOk =
    trimmed === "" ||
    (/^[A-Za-z]{2}$/.test(trimmed) &&
      countryOptions.some((op) => op.value === trimmed.toUpperCase()));

  return {
    usernameOk,
    emailOk,
    pwLenOk,
    pwHasLetter,
    pwHasDigit,
    pwHasUpper,
    pwHasSymbol,
    pwAllOk,
    confirmOk,
    nameOk,
    agreementsOk,
    countryCodeOk,
  };
}
