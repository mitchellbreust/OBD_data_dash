"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Upload, FileText, CheckCircle2 } from "lucide-react"
import { dataAPI } from "@/services/api"

interface UploadSummary {
  fileName: string
  recordCount: number
  avgSpeed: number
  maxSpeed: number
  avgRPM: number
  maxRPM: number
  avgTemp: number
}

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("token")
    if (!authToken) {
      router.push("/login")
    }
  }, [router])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const parseCSVData = (csvText: string) => {
    const lines = csvText.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",")

    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",")
      const row: any = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim()
      })
      data.push(row)
    }

    // Calculate summary statistics
    const speeds = data.map((d) => Number.parseFloat(d["Vehicle Speed"]) || 0)
    const rpms = data.map((d) => Number.parseFloat(d["RPM"]) || 0)
    const temps = data.map((d) => Number.parseFloat(d["Engine Coolant Temperature"]) || 0)

    return {
      recordCount: data.length,
      avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
      maxSpeed: Math.max(...speeds),
      avgRPM: rpms.reduce((a, b) => a + b, 0) / rpms.length,
      maxRPM: Math.max(...rpms),
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)

    try {
      // Read and parse the CSV file
      const text = await file.text()
      const stats = parseCSVData(text)

      // TODO: Replace with real API call
      await dataAPI.uploadCSV(file)

      setSummary({
        fileName: file.name,
        ...stats,
      })
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">OBD Dashboard</h1>
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl text-foreground">Manual Data Upload</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Upload CSV files containing OBD-II telemetry data for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!summary ? (
              <>
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    {file ? file.name : "Drop your CSV file here"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="border-border text-foreground bg-transparent" asChild>
                      <span>Select File</span>
                    </Button>
                  </label>
                </div>

                {file && (
                  <div className="flex items-center justify-between bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loading ? "Uploading..." : "Upload & Analyze"}
                    </Button>
                  </div>
                )}

                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">Expected CSV Format</h4>
                  <p className="text-sm text-muted-foreground mb-2">Your CSV should include the following columns:</p>
                  <code className="text-xs bg-card border border-border rounded p-2 block overflow-x-auto text-foreground">
                    timestamp, Vehicle Speed, Engine Coolant Temperature, Throttle Position, Intake Manifold Pressure,
                    Intake Air Temperature, MAF Air Flow Rate, Run Time Since Engine Start, Barometric Pressure, RPM
                  </code>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                  <h3 className="text-xl font-semibold text-foreground">Upload Successful!</h3>
                </div>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">Data Summary</CardTitle>
                    <CardDescription className="text-muted-foreground">{summary.fileName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Records</p>
                        <p className="text-2xl font-bold text-foreground">{summary.recordCount}</p>
                      </div>
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Avg Speed</p>
                        <p className="text-2xl font-bold text-foreground">{summary.avgSpeed.toFixed(1)} km/h</p>
                      </div>
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Max Speed</p>
                        <p className="text-2xl font-bold text-foreground">{summary.maxSpeed.toFixed(1)} km/h</p>
                      </div>
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Avg RPM</p>
                        <p className="text-2xl font-bold text-foreground">{summary.avgRPM.toFixed(0)}</p>
                      </div>
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Max RPM</p>
                        <p className="text-2xl font-bold text-foreground">{summary.maxRPM.toFixed(0)}</p>
                      </div>
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Avg Temp</p>
                        <p className="text-2xl font-bold text-foreground">{summary.avgTemp.toFixed(1)}°C</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setFile(null)
                      setSummary(null)
                    }}
                    variant="outline"
                    className="flex-1 border-border text-foreground"
                  >
                    Upload Another File
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
