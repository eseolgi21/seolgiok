export const USER_LEVELS = {
  USER:    1,
  STAFF:  10,
  MANAGER: 15,
  ADMIN:  21,
  SUPER:  99,
} as const;

export type UserLevelValue = typeof USER_LEVELS[keyof typeof USER_LEVELS];

export const ASSIGNABLE_LEVELS = [
  { value: USER_LEVELS.USER,    labelKey: "levelLabel.user" },
  { value: USER_LEVELS.STAFF,   labelKey: "levelLabel.staff" },
  { value: USER_LEVELS.MANAGER, labelKey: "levelLabel.manager" },
] as const;
