export type FormState = {
  username: string;
  email: string;
  password: string;
  password2: string;
  name: string;
  referrer: string;
  sponsor: string;
  countryCode: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
};

export type Option = {
  value: string;
  label: string;
};

export type TopPartValue = {
  username: string;
  email: string;
};

export type TopPartErrorText = {
  username: string;
  email: string;
};

export type RowPartValue = {
  name: string;
  countryCode: string;
  ref: string;
};

export type RowPartErrorText = {
  name: string;
  countryCode: string;
  ref: string;
};

export type ChecklistState = {
  len: boolean;
  letter: boolean;
  digit: boolean;
  upper: boolean;
  symbol: boolean;
  confirmShown: boolean;
  confirmOk: boolean;
};

export type SignupValidation = {
  usernameOk: boolean;
  emailOk: boolean;
  pwLenOk: boolean;
  pwHasLetter: boolean;
  pwHasDigit: boolean;
  pwHasUpper: boolean;
  pwHasSymbol: boolean;
  pwAllOk: boolean;
  confirmOk: boolean;
  nameOk: boolean;
  agreementsOk: boolean;
  countryCodeOk: boolean;
};

export type SubmitBarProps = {
  loading: boolean;
  disabled?: boolean;
};

export type TopPartProps = {
  value: TopPartValue;
  onChange: (next: TopPartValue) => void;
  disabled: boolean;
  errorText?: TopPartErrorText;
};

export type MiddlePartProps = {
  password: string;
  password2: string;
  onPasswordChange: (v: string) => void;
  onPassword2Change: (v: string) => void;
  disabled: boolean;
  checklist: ChecklistState;
};

export type RowPartProps = {
  value: RowPartValue;
  onChange: (next: RowPartValue) => void;
  options: Option[];
  disabled: boolean;
  errorText?: RowPartErrorText;
};

export type AgreementsProps = {
  agreeTerms: boolean;
  agreePrivacy: boolean;
  onChangeTerms: (b: boolean) => void;
  onChangePrivacy: (b: boolean) => void;
  submitted: boolean;
  disabled: boolean;
  agreementsOk: boolean;
};
