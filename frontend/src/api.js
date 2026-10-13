export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("brecho_token");
  const response = await fetch("/api" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {})
    }
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, body.erro?.mensagem || "Não foi possível concluir a ação.");
  return body;
}
