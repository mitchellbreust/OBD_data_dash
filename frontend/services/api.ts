// API service layer for OBD Dashboard (real backend integration)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://obd-data-dash.onrender.com"

function getAuthHeader() {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleJSONResponse(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      try {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      } catch {}
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }
    const message = (data && (data.error || data.message)) || `Request failed: ${res.status}`
    const err: any = new Error(message)
    err.status = res.status
    throw err
  }
  return data
}

// Authentication APIs
export const authAPI = {
  register: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    return handleJSONResponse(res)
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    return handleJSONResponse(res)
  },

  logout: async () => {
    const res = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: { ...getAuthHeader() },
    })
    return handleJSONResponse(res)
  },
}

// Data APIs
export const dataAPI = {
  uploadCSV: async (files: File[]) => {
    const formData = new FormData()
    files.forEach((f) => formData.append("files", f))

    const res = await fetch(`${API_BASE_URL}/data/upload`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: formData,
    })
    return handleJSONResponse(res)
  },

  getData: async (params?: { date?: string; data_types?: string[]; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.date) query.append("date", params.date)
    if (params?.limit) query.append("limit", String(params.limit))
    if (params?.data_types) params.data_types.forEach((t) => query.append("data_types", t))
    const qs = query.toString()
    const url = `${API_BASE_URL}/data${qs ? `?${qs}` : ""}`

    const res = await fetch(url, {
      method: "GET",
      headers: { ...getAuthHeader() },
    })
    return handleJSONResponse(res)
  },
}

// Device APIs
export const tokenAPI = {
  createToken: async () => {
    const res = await fetch(`${API_BASE_URL}/device/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({}),
    })
    const data = await handleJSONResponse(res)
    return { success: true, token: data.device_token }
  },
}
