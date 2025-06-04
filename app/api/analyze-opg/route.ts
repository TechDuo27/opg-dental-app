// app/api/analyze-opg/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ML processing is not available on Vercel deployment
  // Python environment is required for the ML model
  
  return NextResponse.json({
    error: 'ML processing is not available in this deployment. Please run the application locally with Python environment for full functionality.',
    success: false,
    message: 'This feature requires Python and ML dependencies which are not supported on Vercel.'
  }, { status: 503 })
}
