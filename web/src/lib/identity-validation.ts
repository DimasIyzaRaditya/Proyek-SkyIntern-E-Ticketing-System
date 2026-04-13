export const MINIMUM_AGE_YEARS = 17;

export const validateIdentityNumber = (idType: "KTP" | "PASSPORT", identityNumber: string): string | null => {
  const normalized = identityNumber.trim();

  if (!normalized) {
    return "Nomor identitas wajib diisi.";
  }

  if (idType === "KTP") {
    if (!/^\d{16}$/.test(normalized)) {
      return "NIK harus 16 digit angka.";
    }
    return null;
  }

  if (!/^[A-Za-z0-9]{8,20}$/.test(normalized)) {
    return "Nomor paspor harus 8-20 karakter alfanumerik.";
  }

  return null;
};

export const validateDateOfBirth = (dob: string, minimumAgeYears: number = MINIMUM_AGE_YEARS): string | null => {
  if (!dob) {
    return "Tanggal lahir wajib diisi.";
  }

  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) {
    return "Format tanggal lahir tidak valid.";
  }

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dobOnly = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

  if (dobOnly > todayOnly) {
    return "Tanggal lahir tidak boleh lebih dari hari ini.";
  }

  const minAllowedDob = new Date(todayOnly);
  minAllowedDob.setFullYear(minAllowedDob.getFullYear() - minimumAgeYears);

  if (dobOnly > minAllowedDob) {
    return `Usia minimum ${minimumAgeYears} tahun.`;
  }

  return null;
};
