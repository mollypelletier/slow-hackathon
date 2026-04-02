"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Cat, RefreshCw } from "lucide-react"

function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  y: number,
  maxWidth: number
) {
  // Start with a large font and shrink until it fits
  let fontSize = 48
  ctx.textAlign = "center"

  do {
    ctx.font = `bold ${fontSize}px Impact, sans-serif`
    const metrics = ctx.measureText(text)
    if (metrics.width <= maxWidth || fontSize <= 16) break
    fontSize -= 2
  } while (true)

  // If text is still too wide even at min font, wrap it
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const lineHeight = fontSize * 1.2
  const x = canvasWidth / 2

  for (let i = 0; i < lines.length; i++) {
    const lineY = y + i * lineHeight
    // Black outline
    ctx.strokeStyle = "black"
    ctx.lineWidth = fontSize / 8
    ctx.lineJoin = "round"
    ctx.strokeText(lines[i], x, lineY)
    // White fill
    ctx.fillStyle = "white"
    ctx.fillText(lines[i], x, lineY)
  }
}

export default function MemeGeneratorPage() {
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [memeDataUrl, setMemeDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function generateMeme() {
    const hasText = topText.trim() || bottomText.trim()
    if (!hasText) return

    setLoading(true)

    try {
      // Fetch a random cat image (no text overlay from the API)
      const response = await fetch(`https://cataas.com/cat?_t=${Date.now()}`)
      const blob = await response.blob()
      const imgUrl = URL.createObjectURL(blob)

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Draw the cat image
        ctx.drawImage(img, 0, 0)

        const padding = img.width * 0.05
        const maxTextWidth = img.width - padding * 2

        // Draw top text near the top
        if (topText.trim()) {
          const topY = padding + 48 // offset from top
          drawMemeText(ctx, topText.trim().toUpperCase(), img.width, topY, maxTextWidth)
        }

        // Draw bottom text near the bottom
        if (bottomText.trim()) {
          const bottomY = img.height - padding - 16 // offset from bottom
          drawMemeText(ctx, bottomText.trim().toUpperCase(), img.width, bottomY, maxTextWidth)
        }

        setMemeDataUrl(canvas.toDataURL("image/png"))
        URL.revokeObjectURL(imgUrl)
        setLoading(false)
      }

      img.onerror = () => {
        setLoading(false)
        URL.revokeObjectURL(imgUrl)
      }

      img.src = imgUrl
    } catch {
      setLoading(false)
    }
  }

  const hasText = topText.trim() || bottomText.trim()

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="flex items-center gap-3">
        <Cat className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Cat Meme Generator</h1>
      </div>
      <p className="text-muted-foreground text-center max-w-md">
        Type your meme text below and generate a random cat meme!
      </p>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Meme</CardTitle>
          <CardDescription>Enter top and/or bottom text for your cat meme</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="top-text">Top Text</Label>
            <Input
              id="top-text"
              placeholder="e.g. When the code compiles"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bottom-text">Bottom Text</Label>
            <Input
              id="bottom-text"
              placeholder="e.g. On the first try"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={generateMeme} disabled={!hasText || loading} className="flex-1">
              {loading ? "Generating..." : "Generate Meme"}
            </Button>
            {memeDataUrl && (
              <Button onClick={generateMeme} variant="outline" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                New Cat
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for drawing the meme */}
      <canvas ref={canvasRef} className="hidden" />

      {memeDataUrl && (
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={memeDataUrl}
              alt="Generated cat meme"
              className="w-full rounded-lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
