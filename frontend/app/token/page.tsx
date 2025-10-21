"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Copy, Check, Key } from "lucide-react"
import { tokenAPI } from "@/services/api"

export default function TokenPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("token")
    if (!authToken) {
      router.push("/login")
    }
  }, [router])

  const generateToken = async () => {
    setLoading(true)
    try {
      const response = await tokenAPI.createToken()
      if (response.success) {
        setToken(response.token)
      }
    } catch (error) {
      console.error("Failed to generate token:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
              <Key className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl text-foreground">Device Token</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Generate a token to enable your OBD-II device to upload data remotely
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!token ? (
              <div className="space-y-4">
                <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">How to use your device token:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Click the button below to generate a unique device token</li>
                    <li>Copy the token and add it to your OBD-II device configuration</li>
                    <li>Your device will use this token to authenticate and upload telemetry data</li>
                    <li>Keep this token secure - treat it like a password</li>
                  </ol>
                </div>
                <Button
                  onClick={generateToken}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? "Generating..." : "Generate Device Token"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-card border border-primary/20 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Your Device Token</span>
                    <span className="text-xs text-primary">Active</span>
                  </div>
                  <div className="bg-muted/50 border border-border rounded p-4 font-mono text-sm break-all text-foreground">
                    {token}
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-accent bg-transparent"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Token
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-secondary mb-2 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    Important Security Notice
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Store this token securely in your OBD device. Anyone with this token can upload data to your
                    account. If compromised, generate a new token immediately.
                  </p>
                </div>

                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-accent"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
