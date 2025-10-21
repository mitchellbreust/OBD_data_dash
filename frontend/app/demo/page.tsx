"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, RefreshCw, Gauge, Thermometer, Zap, ArrowLeft } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import Link from "next/link"

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

// Generate realistic sample data
const generateSampleData = (): OBDData[] => {
  const data: OBDData[] = []
  const baseTime = Date.now()

  for (let i = 0; i < 50; i++) {
    const time = i * 2 // 2 second intervals
    const speed = 40 + Math.sin(i / 5) * 30 + Math.random() * 5
    const rpm = 1500 + Math.sin(i / 4) * 800 + Math.random() * 100

    data.push({
      timestamp: new Date(baseTime + time * 1000).toISOString(),
      "Vehicle Speed": Math.max(0, speed),
      "Engine Coolant Temperature": 85 + Math.random() * 5,
      "Throttle Position": 30 + Math.sin(i / 6) * 20 + Math.random() * 5,
      "Intake Manifold Pressure": 35 + Math.random() * 10,
      "Intake Air Temperature": 25 + Math.random() * 3,
      "MAF Air Flow Rate": 15 + Math.sin(i / 5) * 8 + Math.random() * 2,
      "Run Time Since Engine Start": time,
      "Barometric Pressure": 101 + Math.random() * 2,
      RPM: Math.max(800, rpm),
    })
  }

  return data
}

export default function DemoPage() {
  const [data, setData] = useState<OBDData[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    // Initialize with sample data
    setData(generateSampleData())
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate new data coming in
      setData(generateSampleData())
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

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

  const speedStats = calculateStats("Vehicle Speed")
  const rpmStats = calculateStats("RPM")
  const tempStats = calculateStats("Engine Coolant Temperature")

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Demo Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Demo Mode</h2>
                <p className="text-sm text-muted-foreground">
                  Viewing sample vehicle telemetry data. Sign up to connect your own OBD device.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="border-border bg-transparent">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>

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
              onClick={() => setData(generateSampleData())}
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
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#f0f9ff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#3b82f6"
                  name="Speed (km/h)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="rpm"
                  stroke="#fb923c"
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
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#f0f9ff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Engine Coolant Temperature"
                  stroke="#ef4444"
                  name="Coolant Temp (°C)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Intake Air Temperature"
                  stroke="#22c55e"
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#f0f9ff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Throttle Position"
                    stroke="#a855f7"
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#f0f9ff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="MAF Air Flow Rate"
                    stroke="#ec4899"
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
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#f0f9ff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Intake Manifold Pressure"
                  stroke="#3b82f6"
                  name="Manifold Pressure (kPa)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Barometric Pressure"
                  stroke="#fb923c"
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
