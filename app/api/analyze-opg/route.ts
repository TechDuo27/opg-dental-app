// app/api/analyze-opg/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Detection {
  label: string
  confidence: number
  bbox: [number, number, number, number]
}

export async function POST(request: NextRequest) {
  console.log('=== Analyze OPG API called ===')
  
  let inputPath: string | null = null
  let outputPath: string | null = null
  
  try {
    const formData = await request.formData()
    const imageUrl = formData.get('imageUrl') as string
    const userId = formData.get('userId') as string

    if (!imageUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing imageUrl or userId' },
        { status: 400 }
      )
    }

    // Create temp directory
    const tempDir = path.join(process.cwd(), 'tmp', userId)
    await fs.mkdir(tempDir, { recursive: true })

    // Download image
    console.log('1. Downloading image from:', imageUrl)
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }
    
    const buffer = await response.arrayBuffer()
    inputPath = path.join(tempDir, `input_${uuidv4()}.jpg`)
    await fs.writeFile(inputPath, Buffer.from(buffer))
    console.log('2. Image saved to:', inputPath)

    // Verify file was written
    const stats = await fs.stat(inputPath)
    console.log('3. Input file size:', stats.size, 'bytes')

    // Prepare output path
    outputPath = path.join(tempDir, `output_${uuidv4()}.jpg`)

    // Prepare Python command
    const pythonScript = path.join(process.cwd(), 'ml', 'inference.py')
    const weightsPath = path.join(process.cwd(), 'ml', 'best.pt')
    
    // Check if files exist
    try {
      await fs.access(pythonScript)
      await fs.access(weightsPath)
      console.log('3a. Verified Python script and model weights exist')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      throw new Error(`Required files not found: ${errorMessage}`)
    }
    
    // Use python.exe explicitly on Windows
    const pythonCmd = process.platform === 'win32' ? 'python.exe' : 'python'
    const args = [
      pythonScript,
      '--input', inputPath,
      '--output', outputPath,
      '--weights', weightsPath
    ]
    
    console.log('4. Running command:', pythonCmd, args.join(' '))
    
    // Log start time for performance tracking
    const startTime = Date.now()
    console.log('4a. Starting Python process at:', new Date().toISOString())
    
    // Run Python script
    const pythonProcess = spawn(pythonCmd, args, {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    })

    // Collect output
    let stdoutData = ''
    let stderrData = ''

    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString()
      stdoutData += chunk
      console.log('Python stdout:', chunk)
    })

    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString()
      stderrData += chunk
      console.log('Python stderr:', chunk)
    })
    
    // Log when process exits
    pythonProcess.on('exit', (code) => {
      const duration = Date.now() - startTime
      console.log(`Python process exited with code ${code} after ${duration}ms`)
    })

    // Wait for completion with timeout
    const timeout = 120000 // 120 seconds (2 minutes)
    const exitCode = await Promise.race([
      new Promise<number>((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          resolve(code || 0)
        })
        pythonProcess.on('error', (err) => {
          reject(new Error(`Failed to start Python: ${err.message}`))
        })
      }),
      new Promise<number>((_, reject) => 
        setTimeout(() => {
          pythonProcess.kill()
          reject(new Error('Python script timed out'))
        }, timeout)
      )
    ])

    console.log('5. Python process completed with code:', exitCode)

    if (exitCode !== 0) {
      throw new Error(`Python script failed with code ${exitCode}. Error: ${stderrData}`)
    }

    // Parse detections
    let detections: Detection[] = []
    if (stdoutData.trim()) {
      try {
        const lastLine = stdoutData.trim().split('\n').pop() || ''
        const output = JSON.parse(lastLine)
        detections = output.detections || []
        console.log('6. Parsed detections:', detections.length)
      } catch (e) {
        console.error('Failed to parse Python output:', e)
        console.log('Raw output:', stdoutData)
      }
    }

    // Check if output image exists
    try {
      const outputStats = await fs.stat(outputPath)
      console.log('7. Output file size:', outputStats.size, 'bytes')
    } catch {
      throw new Error('Python script did not create output image')
    }

    // Read annotated image
    const annotatedBuffer = await fs.readFile(outputPath)
    const base64Image = annotatedBuffer.toString('base64')

    // Cleanup
    try {
      if (inputPath) await fs.unlink(inputPath)
      if (outputPath) await fs.unlink(outputPath)
    } catch (e) {
      console.error('Cleanup error:', e)
    }

    console.log('8. Success! Returning results with', detections.length, 'detections')

    // Don't save to database here - let the frontend handle it
    // to avoid duplicates

    return NextResponse.json({
      success: true,
      annotatedImage: `data:image/jpeg;base64,${base64Image}`,
      detections: detections
    })

  } catch (error) {
    console.error('=== ML API Error ===')
    console.error(error)
    
    // Cleanup on error
    try {
      if (inputPath) await fs.unlink(inputPath).catch(() => {})
      if (outputPath) await fs.unlink(outputPath).catch(() => {})
    } catch {}
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `ML processing failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}
