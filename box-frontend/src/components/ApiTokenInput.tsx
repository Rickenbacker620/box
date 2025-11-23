import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'

interface ApiTokenInputProps {
  onTokenSubmit: (token: string) => void
}

export function ApiTokenInput({ onTokenSubmit }: ApiTokenInputProps) {
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token.trim()) {
      setIsSubmitting(true)
      onTokenSubmit(token.trim())
      // Reset submitting state after a short delay
      setTimeout(() => setIsSubmitting(false), 500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">API Token Required</CardTitle>
          <CardDescription>
            Please enter your API token to access the application. The token will be stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-token">API Token</Label>
              <Input
                id="api-token"
                type="password"
                placeholder="Enter your API token..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={!token.trim() || isSubmitting}
            >
              {isSubmitting ? 'Loading...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}