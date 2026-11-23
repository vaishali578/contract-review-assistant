const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiRequest = async (
  getToken,
  endpoint,
  options = {}
) => {
  const token = await getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const headers = new Headers(options.headers || {});

  headers.set("Authorization", `Bearer ${token}`);

  let body = options.body;

  // JSON body handling
  if (
    body &&
    !(body instanceof FormData) &&
    typeof body !== "string"
  ) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(
    `${API_URL}/api${endpoint}`,
    {
      ...options,
      headers,
      body,
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || "Something went wrong"
    );
  }

  return data;
};