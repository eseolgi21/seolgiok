export type ApiSuccess<TPayload> = {
  ok: true;
} & TPayload;

export type ApiError<TCode extends string> = {
  ok: false;
  code: TCode;
  message?: string;
};

export type ApiResponse<TPayload, TCode extends string> =
  | ApiSuccess<TPayload>
  | ApiError<TCode>;

export type ApiUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  countryCode: string | null;
  createdAt: string; // ISO
  level: number;
};

export type ResolvedUser = { id: string; username: string; email: string };

export type ResolveUserResponse =
  | ApiSuccess<{ user: ResolvedUser | null }>
  | ApiError<"UNKNOWN">;

export type SignupError =
  | "USERNAME_TAKEN"
  | "EMAIL_TAKEN"
  | "REFERRER_NOT_FOUND"
  | "SPONSOR_NOT_FOUND"
  | "COUNTRY_CODE_INVALID"
  | "COUNTRY_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export type SignupResponse =
  | ApiSuccess<{ user: ApiUser }>
  | ApiError<SignupError>;

export type SignupBody = {
  username: string;
  email: string;
  password: string;
  name: string;
  referrer: string | null;
  sponsor: string | null;
  countryCode: string | null;
  agreeTerms: boolean;
  agreePrivacy: boolean;
};
