"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { File } from "@/lib/files"
import { updateFileContent } from "@/lib/files"
import { useWebSocket } from "@/lib/use-websocket"
import { useAuth } from "@/lib/auth-provider"
import * as Y from "yjs"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { javascript } from "@codemirror/lang-javascript"
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css"
import { markdown } from "@codemirror/lang-markdown"
import { json } from "@codemirror/lang-json"
import { python } from "@codemirror/lang-python"
import { yCollab } from "y-codemirror.next"

interface EditorProps {
  file: File
  projectId: string
}

export default function Editor({ file, projectId }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Connect to WebSocket for real-time collaboration
  const { connected, error } = useWebSocket({
    url: `/api/collaboration?projectId=${projectId}&fileId=${file.id}`,
    onMessage: (message) => {
      // Handle incoming WebSocket messages for collaboration
      console.log("Received message:", message)
    },
  })

  // Determine language based on file extension
  const getLanguage = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return javascript()
      case "html":
        return html()
      case "css":
        return css()
      case "md":
        return markdown()
      case "json":
        return json()
      case "py":
        return python()
      default:
        return javascript()
    }
  }

  useEffect(() => {
    if (!editorRef.current || !file) return

    // Clean up previous editor instance
    if (editorViewRef.current) {
      editorViewRef.current.destroy()
    }

    // Set up Yjs document for collaboration
    const yDoc = new Y.Doc()
    const yText = yDoc.getText("codemirror")

    // Initialize with file content
    yText.insert(0, file.content || "")

    // Set up CodeMirror editor
    const state = EditorState.create({
      doc: file.content || "",
      extensions: [basicSetup, getLanguage(file.name), yCollab(yText, { undoManager: true })],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    editorViewRef.current = view

    // Auto-save changes periodically
    const saveInterval = setInterval(() => {
      const content = yText.toString()
      handleSave(content)
    }, 10000) // Save every 10 seconds

    return () => {
      clearInterval(saveInterval)
      if (editorViewRef.current) {
        editorViewRef.current.destroy()
      }
    }
  }, [file]) // Updated dependency to file

  const handleSave = async (content: string) => {
    if (!user || isSaving) return

    setIsSaving(true)
    try {
      await updateFileContent(file.id, content)
      setLastSaved(new Date())
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/40 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{file.name}</span>
          <div className="flex items-center gap-2">
            {connected ? (
              <span className="flex items-center text-xs text-green-600">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-600"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center text-xs text-yellow-600">
                <span className="mr-1 h-2 w-2 rounded-full bg-yellow-600"></span>
                Connecting...
              </span>
            )}
            {lastSaved && (
              <span className="text-xs text-muted-foreground">Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div ref={editorRef} className="h-full w-full" />
      </div>
    </div>
  )
}
