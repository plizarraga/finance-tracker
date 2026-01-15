"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function IncomesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Incomes error:", error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Incomes</h2>
        <p className="text-sm text-muted-foreground">
          Track your income sources
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Error Loading Incomes</CardTitle>
          </div>
          <CardDescription>
            Unable to load your income records at this time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {error.message}
            </p>
          )}
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  )
}
