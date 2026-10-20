const API_ERROR_FALLBACK = "Não foi possível concluir a operação.";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("vambora_token");
  const headers = new Headers(options.headers || {});

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    if (response.status === 401) {
      if (localStorage.getItem("vambora_token") === token) {
        localStorage.removeItem("vambora_token");
        localStorage.removeItem("vambora_usuario");
        window.dispatchEvent(
          new CustomEvent("vambora:unauthorized", { detail: { token } }),
        );
      }
    }
    const error = new Error(
      data?.erro || data?.message || data?.mensagem || API_ERROR_FALLBACK,
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export function requireAuth(navigate) {
  if (localStorage.getItem("vambora_token")) return true;
  navigate("/login");
  return false;
}
