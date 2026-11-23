export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("brecho_token");
  const isFormData = options.body instanceof FormData;
  const response = await fetch("/api" + path, {
    ...options,
    headers: {
      // Não definir Content-Type para FormData — o browser define automaticamente com boundary
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {})
    }
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, body.erro?.mensagem || "Não foi possível concluir a ação.");
  return body;
}
