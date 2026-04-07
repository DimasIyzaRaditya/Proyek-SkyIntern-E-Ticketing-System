export type PassengerProfileData = {
  firstName: string;
  lastName: string;
  idType: "KTP" | "PASSPORT";
  idNumber: string;
  nationality: string;
  dateOfBirth: string;
};

const STORAGE_PREFIX = "skyintern_passenger_profile_";

const getStorageKey = (userId?: number) => {
  if (!userId || Number.isNaN(userId)) return null;
  return `${STORAGE_PREFIX}${userId}`;
};

export const getPassengerProfile = (userId?: number): PassengerProfileData | null => {
  if (typeof window === "undefined") return null;

  const key = getStorageKey(userId);
  if (!key) return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PassengerProfileData>;
    if (!parsed.firstName || !parsed.lastName) return null;

    return {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      idType: parsed.idType === "PASSPORT" ? "PASSPORT" : "KTP",
      idNumber: parsed.idNumber ?? "",
      nationality: parsed.nationality ?? "Indonesian",
      dateOfBirth: parsed.dateOfBirth ?? "",
    };
  } catch {
    return null;
  }
};

export const setPassengerProfile = (userId: number | undefined, payload: PassengerProfileData) => {
  if (typeof window === "undefined") return;

  const key = getStorageKey(userId);
  if (!key) return;

  window.localStorage.setItem(key, JSON.stringify(payload));
};

export const maskIdentityNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 4) return "*".repeat(trimmed.length);

  const visibleTail = trimmed.slice(-4);
  const maskedHead = "*".repeat(trimmed.length - 4);
  return `${maskedHead}${visibleTail}`;
};
