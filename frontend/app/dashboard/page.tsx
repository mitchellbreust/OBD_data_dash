"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, RefreshCw, Gauge, Thermometer, Zap } from "lucide-react"
import { dataAPI } from "@/services/api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface OBDData {
  timestamp: string
  "Vehicle Speed": number
  "Engine Coolant Temperature": number
  "Throttle Position": number
  "Intake Manifold Pressure": number
  "Intake Air Temperature": number
  "MAF Air Flow Rate": number
  "Run Time Since Engine Start": number
  "Barometric Pressure": number
  RPM: number
}

interface Stats {
  min: number
  max: number
  avg: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<OBDData[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("token")
    if (!authToken) {
      router.push("/login")
      return
    }

    fetchData()
  }, [router])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchData = async () => {
    try {
      const response = await dataAPI.getData()
      if (response.success) {
        setData(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (key: keyof OBDData): Stats => {
    if (data.length === 0) return { min: 0, max: 0, avg: 0 }

    const values = data.map((d) => Number(d[key])).filter((v) => !Number.isNaN(v))
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }
  }

  const formatChartData = () => {
    return data.map((d, index) => ({
      time: index,
      speed: d["Vehicle Speed"],
      rpm: d.RPM / 10, // Scale down for better visualization
      temp: d["Engine Coolant Temperature"],
      throttle: d["Throttle Position"],
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const speedStats = calculateStats("Vehicle Speed")
  const rpmStats = calculateStats("RPM")
  const tempStats = calculateStats("Engine Coolant Temperature")

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Vehicle Telemetry</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`border-border ${autoRefresh ? "bg-primary/10 text-primary" : "text-foreground"}`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-border text-foreground bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vehicle Speed</CardTitle>
              <Gauge className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{speedStats.avg.toFixed(1)} km/h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Min: {speedStats.min.toFixed(0)} | Max: {speedStats.max.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engine RPM</CardTitle>
              <Zap className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{rpmStats.avg.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Min: {rpmStats.min.toFixed(0)} | Max: {rpmStats.max.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Coolant Temp</CardTitle>
              <Thermometer className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{tempStats.avg.toFixed(1)}°C</div>
              <p className="text-xs text-muted-foreground mt-1">
                Min: {tempStats.min.toFixed(0)} | Max: {tempStats.max.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Speed & RPM Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Speed & RPM Over Time</CardTitle>
            <CardDescription className="text-muted-foreground">
              Real-time vehicle speed and engine RPM (scaled)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="hsl(var(--primary))"
                  name="Speed (km/h)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="rpm"
                  stroke="hsl(var(--secondary))"
                  name="RPM (÷10)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temperature Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Temperature Monitoring</CardTitle>
            <CardDescription className="text-muted-foreground">
              Engine coolant and intake air temperature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Engine Coolant Temperature"
                  stroke="hsl(var(--destructive))"
                  name="Coolant Temp (°C)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Intake Air Temperature"
                  stroke="hsl(var(--chart-3))"
                  name="Intake Air Temp (°C)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Additional Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Throttle Position</CardTitle>
              <CardDescription className="text-muted-foreground">Current throttle opening percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Throttle Position"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">MAF Air Flow Rate</CardTitle>
              <CardDescription className="text-muted-foreground">Mass air flow in grams per second</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="MAF Air Flow Rate"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pressure Metrics */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Pressure Monitoring</CardTitle>
            <CardDescription className="text-muted-foreground">
              Intake manifold and barometric pressure (kPa)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Intake Manifold Pressure"
                  stroke="hsl(var(--primary))"
                  name="Manifold Pressure (kPa)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Barometric Pressure"
                  stroke="hsl(var(--secondary))"
                  name="Barometric Pressure (kPa)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
