// API service layer for OBD Dashboard
// All API calls are currently mocked and clearly marked with TODO comments

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Authentication APIs
export const authAPI = {
  register: async (email: string, password: string) => {
    // TODO: Replace with real API call
    // return fetch(`${API_BASE_URL}/api/register`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // })
    console.log("[v0] Mock API: register", { email })
    return Promise.resolve({ success: true })
  },

  login: async (email: string, password: string) => {
    // TODO: Replace with real API call
    // return fetch(`${API_BASE_URL}/api/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // })
    console.log("[v0] Mock API: login", { email })
    return Promise.resolve({
      success: true,
      token: "mock-jwt-token-12345",
    })
  },
}

// Token APIs
export const tokenAPI = {
  createToken: async () => {
    // TODO: Replace with real API call
    // const token = localStorage.getItem('token')
    // return fetch(`${API_BASE_URL}/api/create-token`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   }
    // })
    console.log("[v0] Mock API: createToken")
    return Promise.resolve({
      success: true,
      token: "OBD-" + Math.random().toString(36).substring(2, 15).toUpperCase(),
    })
  },
}

// Data APIs
export const dataAPI = {
  uploadCSV: async (file: File) => {
    // TODO: Replace with real API call
    // const token = localStorage.getItem('token')
    // const formData = new FormData()
    // formData.append('file', file)
    // return fetch(`${API_BASE_URL}/api/upload`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${token}` },
    //   body: formData
    // })
    console.log("[v0] Mock API: uploadCSV", { fileName: file.name })
    return Promise.resolve({ success: true })
  },

  getData: async () => {
    // TODO: Replace with real API call
    // const token = localStorage.getItem('token')
    // return fetch(`${API_BASE_URL}/api/data`, {
    //   headers: { 'Authorization': `Bearer ${token}` }
    // })
    console.log("[v0] Mock API: getData")

    // Return mock OBD data
    const mockData = []
    const now = new Date()
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - (50 - i) * 1000)
      mockData.push({
        timestamp: timestamp.toISOString(),
        "Vehicle Speed": Math.floor(Math.random() * 120),
        "Engine Coolant Temperature": 80 + Math.floor(Math.random() * 20),
        "Throttle Position": Math.floor(Math.random() * 100),
        "Intake Manifold Pressure": 95 + Math.floor(Math.random() * 15),
        "Intake Air Temperature": 60 + Math.floor(Math.random() * 20),
        "MAF Air Flow Rate": 15 + Math.random() * 10,
        "Run Time Since Engine Start": i * 10,
        "Barometric Pressure": 98 + Math.floor(Math.random() * 6),
        RPM: 800 + Math.floor(Math.random() * 3000),
      })
    }

    return Promise.resolve({ success: true, data: mockData })
  },
}
