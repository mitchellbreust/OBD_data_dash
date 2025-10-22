"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, RefreshCw, Gauge, Thermometer, Zap } from "lucide-react"
import { dataAPI } from "@/services/api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface OBDDataRow {
  id?: number
  timestamp: string
  speed?: number
  rpm?: number
  cool_temp?: number
  throttle_pos?: number
  intake_mani_pres?: number
  intake_air_temp?: number
  maf_air_flow_rate?: number
  baro_pressure?: number
  control_module_voltage?: number
  engine_load?: number
  fuel_level?: number
  fuel_pressure?: number
  ambient_air_temp?: number
  timing_advance?: number
}

interface Stats {
  min: number
  max: number
  avg: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<OBDDataRow[]>([])
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
      const response = await dataAPI.getData({
        limit: 500,
      })
      if (response?.data) {
        if (response.data.length > 0) {
          // Log the first row returned by the backend
          console.log("/data first row:", response.data[0])
        } else {
          console.log("/data returned no rows")
        }
      }
      setData(response?.data || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const hasData = (key: keyof OBDDataRow) => data.some((d) => typeof d[key] === "number")

  const calculateStats = (key: keyof OBDDataRow): Stats => {
    const values = data
      .map((d) => (typeof d[key] === "number" ? (d[key] as number) : NaN))
      .filter((v) => !Number.isNaN(v))
    if (values.length === 0) return { min: 0, max: 0, avg: 0 }
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return ""
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const formatSpeedRpmData = () => {
    return data.map((d, index) => ({
      time: formatTime(d.timestamp),
      speed: d.speed ?? null,
      rpm: typeof d.rpm === "number" ? d.rpm / 10 : null,
    }))
  }

  const formatTempsData = () => {
    return data.map((d, index) => ({
      time: formatTime(d.timestamp),
      cool_temp: d.cool_temp ?? null,
      intake_air_temp: d.intake_air_temp ?? null,
    }))
  }

  const formatSeries = (key: keyof OBDDataRow) => {
    return data.map((d, index) => ({ time: formatTime(d.timestamp), value: (d[key] as number) ?? null }))
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

  const speedStats = calculateStats("speed")
  const rpmStats = calculateStats("rpm")
  const tempStats = calculateStats("cool_temp")

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
              {hasData("speed") ? (
                <>
                  <div className="text-3xl font-bold text-foreground">{speedStats.avg.toFixed(1)} km/h</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: {speedStats.min.toFixed(0)} | Max: {speedStats.max.toFixed(0)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No speed data available for this vehicle.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engine RPM</CardTitle>
              <Zap className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              {hasData("rpm") ? (
                <>
                  <div className="text-3xl font-bold text-foreground">{rpmStats.avg.toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: {rpmStats.min.toFixed(0)} | Max: {rpmStats.max.toFixed(0)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No RPM data available for this vehicle.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Coolant Temp</CardTitle>
              <Thermometer className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {hasData("cool_temp") ? (
                <>
                  <div className="text-3xl font-bold text-foreground">{tempStats.avg.toFixed(1)}°C</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: {tempStats.min.toFixed(0)} | Max: {tempStats.max.toFixed(0)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No coolant temperature data available.</p>
              )}
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
              <LineChart data={formatSpeedRpmData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                {hasData("speed") && (
                  <Line type="monotone" dataKey="speed" stroke="#60A5FA" name="Speed (km/h)" strokeWidth={2} dot={false} />
                )}
                {hasData("rpm") && (
                  <Line type="monotone" dataKey="rpm" stroke="#F59E0B" name="RPM (÷10)" strokeWidth={2} dot={false} />
                )}
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
              <LineChart data={formatTempsData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                {hasData("cool_temp") && (
                  <Line type="monotone" dataKey="cool_temp" stroke="#EF4444" name="Coolant Temp (°C)" strokeWidth={2} dot={false} />
                )}
                {hasData("intake_air_temp") && (
                  <Line type="monotone" dataKey="intake_air_temp" stroke="#34D399" name="Intake Air Temp (°C)" strokeWidth={2} dot={false} />
                )}
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
                <LineChart data={formatSeries("throttle_pos")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  {hasData("throttle_pos") ? (
                    <Line type="monotone" dataKey="value" stroke="#A78BFA" strokeWidth={2} dot={false} />
                  ) : (
                    <text x={20} y={20} fill="hsl(var(--muted-foreground))">No throttle position data available.</text>
                  )}
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
                <LineChart data={formatSeries("maf_air_flow_rate")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  {hasData("maf_air_flow_rate") ? (
                    <Line type="monotone" dataKey="value" stroke="#F472B6" strokeWidth={2} dot={false} />
                  ) : (
                    <text x={20} y={20} fill="hsl(var(--muted-foreground))">No MAF data available.</text>
                  )}
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
              <LineChart data={data.map((d) => ({
                time: formatTime(d.timestamp),
                intake_mani_pres: d.intake_mani_pres ?? null,
                baro_pressure: d.baro_pressure ?? null,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                {hasData("intake_mani_pres") && (
                  <Line type="monotone" dataKey="intake_mani_pres" stroke="#38BDF8" name="Manifold Pressure (kPa)" strokeWidth={2} dot={false} />
                )}
                {hasData("baro_pressure") && (
                  <Line type="monotone" dataKey="baro_pressure" stroke="#FBBF24" name="Barometric Pressure (kPa)" strokeWidth={2} dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Control Module Voltage */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Control Module Voltage</CardTitle>
            <CardDescription className="text-muted-foreground">Electrical system voltage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formatSeries("control_module_voltage")}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                {hasData("control_module_voltage") ? (
                  <Line type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2} dot={false} />
                ) : (
                  <text x={20} y={20} fill="hsl(var(--muted-foreground))">No voltage data available.</text>
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Additional Common PIDs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Engine Load</CardTitle>
              <CardDescription className="text-muted-foreground">Calculated engine load (%)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={formatSeries("engine_load")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  {hasData("engine_load") ? (
                    <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                  ) : (
                    <text x={20} y={20} fill="hsl(var(--muted-foreground))">No engine load data available.</text>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Fuel Level</CardTitle>
              <CardDescription className="text-muted-foreground">Estimated fuel level (%)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={formatSeries("fuel_level")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  {hasData("fuel_level") ? (
                    <Line type="monotone" dataKey="value" stroke="#06B6D4" strokeWidth={2} dot={false} />
                  ) : (
                    <text x={20} y={20} fill="hsl(var(--muted-foreground))">No fuel level data available.</text>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Ambient Air Temperature</CardTitle>
              <CardDescription className="text-muted-foreground">Ambient temperature (°C)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={formatSeries("ambient_air_temp")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  {hasData("ambient_air_temp") ? (
                    <Line type="monotone" dataKey="value" stroke="#F87171" strokeWidth={2} dot={false} />
                  ) : (
                    <text x={20} y={20} fill="hsl(var(--muted-foreground))">No ambient air temp data available.</text>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Fuel Pressure</CardTitle>
              <CardDescription className="text-muted-foreground">Fuel rail pressure (kPa)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={formatSeries("fuel_pressure")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  {hasData("fuel_pressure") ? (
                    <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  ) : (
                    <text x={20} y={20} fill="hsl(var(--muted-foreground))">No fuel pressure data available.</text>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
