"use client";

import { useMemo } from "react";
import type {
  FormState,
  SignupValidation,
} from "@/app/[locale]/(site)/auth/signup/types/signup/form";

export function useSignupValidation(f: FormState): SignupValidation {
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

  const agreementsOk = f.agreeTerms && f.agreePrivacy;

  return {
    emailOk,
    pwLenOk,
    pwHasLetter,
    pwHasDigit,
    pwHasUpper,
    pwHasSymbol,
    pwAllOk,
    confirmOk,
    agreementsOk,
  };
}
