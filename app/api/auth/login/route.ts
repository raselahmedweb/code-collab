import { NextResponse } from "next/server"
import { login } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await login(email, password)

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }
}
