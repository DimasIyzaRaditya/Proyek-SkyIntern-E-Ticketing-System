export const formatRupiah = (value: number) =>
  `Rp ${value.toLocaleString("id-ID")}`;

export const formatRibuan = (value: string): string => {
  const numeric = value.replace(/[^0-9]/g, "").replace(/^0+/, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
