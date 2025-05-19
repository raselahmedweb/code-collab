"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: any) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
}

export function useWebSocket({ url, onMessage, onOpen, onClose, onError }: UseWebSocketOptions) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Event | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  // Mock WebSocket for demonstration
  useEffect(() => {
    // In a real implementation, this would connect to a WebSocket server
    console.log(`Connecting to WebSocket: ${url}`)

    // Simulate connection
    const timeout = setTimeout(() => {
      setConnected(true)
      if (onOpen) onOpen()
    }, 1000)

    return () => {
      clearTimeout(timeout)
      setConnected(false)
      if (onClose) onClose()
    }
  }, [url, onOpen, onClose])

  const send = useCallback(
    (data: any) => {
      if (connected) {
        console.log("Sending data via WebSocket:", data)
        // In a real implementation, this would send data through the WebSocket
        if (onMessage) {
          // Simulate receiving a response
          setTimeout(() => {
            onMessage({
              type: "ack",
              data: { received: true },
            })
          }, 200)
        }
      }
    },
    [connected, onMessage],
  )

  return {
    connected,
    error,
    send,
  }
}
