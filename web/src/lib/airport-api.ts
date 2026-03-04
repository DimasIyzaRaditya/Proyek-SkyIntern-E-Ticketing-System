const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type AirportApiItem = {
  id: number;
  code: string;
  city: string;
  country: string;
  airportName: string;
  label: string;
};

type GetAirportOptionsResponse = {
  airports: AirportApiItem[];
};

export const getAirportOptionsFromApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/flights/airports`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data bandara dari backend.");
  }

  const payload = (await response.json()) as GetAirportOptionsResponse;
  return payload.airports;
};
