"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { User } from "@supabase/supabase-js"
import AuthWrapper from "@/components/AuthWrapper"
import { Download, Upload, AlertCircle, Activity, FileImage, History, TrendingUp, CheckCircle, Sparkles, Brain, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

type Detection = {
  label: string
  confidence: number
  bbox: [number, number, number, number]
}

type AnalysisResult = {
  originalImage: string
  annotatedImage: string
  detections: Detection[]
  timestamp: string
}

function ImageUploadDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [savingHistory, setSavingHistory] = useState(false)
  const [stats, setStats] = useState({
    totalScans: 0,
    recentIssues: 0,
    lastScanDate: null as string | null
  })

  useEffect(() => {
    getUser()
    fetchUserStats()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserName(profile.name)
      }
    }
  }

  const fetchUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: history } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (history) {
      const recentIssues = history.slice(0, 5).reduce((acc, item) => 
        acc + (item.total_detections || 0), 0
      )
      
      setStats({
        totalScans: history.length,
        recentIssues: recentIssues,
        lastScanDate: history[0]?.created_at || null
      })
    }
  }

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

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload({ target: { files } } as any)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file.")
      return
    }

    setUploading(true)
    setAnalyzing(false)
    setErrorMsg(null)
    setAnalysisResult(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error("Session error:", sessionError)
        setErrorMsg("Session expired. Please refresh the page.")
        setUploading(false)
        return
      }

      const user = session.user
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const filePath = `user-uploads/${user.id}/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file, { 
          upsert: false,
          contentType: file.type
        })

      if (uploadError) {
        console.error("Upload failed:", uploadError)
        setErrorMsg(`Upload failed: ${uploadError.message}`)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        setErrorMsg("Could not retrieve image URL.")
        setUploading(false)
        return
      }

      setUploading(false)
      setAnalyzing(true)
      setImageUrl(urlData.publicUrl)
      await simulateMLAnalysis(urlData.publicUrl)

    } catch (error) {
      console.error("Unexpected error:", error)
      setErrorMsg("An unexpected error occurred.")
      setUploading(false)
      setAnalyzing(false)
    }
  }

  const simulateMLAnalysis = async (imageUrl: string) => {
    try {
      console.log('Starting ML analysis for:', imageUrl)
      
      const formData = new FormData()
      formData.append('imageUrl', imageUrl)
      formData.append('userId', user?.id || '')

      // Increased timeout for ML processing
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

      try {
        const response = await fetch('/api/analyze-opg', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        })

        clearTimeout(timeoutId)
        console.log('Response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Analysis response error:', errorText)
          
          // Handle specific timeout errors
          if (response.status === 500 && errorText.includes('timed out')) {
            throw new Error('Analysis is taking longer than expected. This may be due to image size or server load. Please try with a smaller image or retry in a few minutes.')
          }
          
          throw new Error(`Analysis failed: ${response.status} - ${errorText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        const result: AnalysisResult = {
          originalImage: imageUrl,
          annotatedImage: data.annotatedImage || imageUrl, // Fallback to original if no annotated image
          detections: data.detections || [],
          timestamp: new Date().toISOString()
        }

        setAnalysisResult(result)
        setAnalyzing(false)

        // Save to analysis history
        if (!savingHistory && data.detections) {
          setSavingHistory(true)
          try {
            const { error: historyError } = await supabase
              .from('analysis_history')
              .insert({
                user_id: user?.id,
                original_image_url: imageUrl,
                annotated_image_url: data.annotatedImage || imageUrl,
                detections: data.detections,
                total_detections: data.detections.length
              })

            if (!historyError) {
              fetchUserStats()
            }
          } catch (historyError) {
            console.error('History save error:', historyError)
          } finally {
            setSavingHistory(false)
          }
        }

      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Analysis timed out. Please try with a smaller image or check your internet connection.')
        }
        
        throw fetchError
      }

    } catch (error) {
      console.error('ML analysis error:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to analyze image: '
      
      if (error instanceof Error) {
        if (error.message.includes('timed out') || error.message.includes('timeout')) {
          errorMessage += 'The analysis is taking too long. This usually happens with large images. Please try:\n\n• Using a smaller image file (under 5MB)\n• Compressing your image before upload\n• Retrying in a few minutes when server load is lower'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage += 'Network connection issue. Please check your internet connection and try again.'
        } else {
          errorMessage += error.message
        }
      } else {
        errorMessage += 'Unknown error occurred. Please try again.'
      }
      
      setErrorMsg(errorMessage)
      setAnalyzing(false)
    }
  }

  const downloadReport = () => {
    if (!analysisResult) return

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>AI Dental Analysis Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
    .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 2.5em; font-weight: 700; }
    .header p { margin: 0; opacity: 0.9; font-size: 1.1em; }
    .content { padding: 40px; }
    .section { margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 15px; border-left: 5px solid #4f46e5; }
    .section h2 { color: #1e293b; margin: 0 0 20px 0; font-size: 1.8em; display: flex; align-items: center; gap: 10px; }
    .detection { margin: 20px 0; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid #6366f1; transition: transform 0.2s; }
    .detection:hover { transform: translateY(-2px); }
    .confidence { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .high { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #dc2626; }
    .medium { background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); color: #d97706; }
    .low { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #059669; }
    .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 14px; padding: 30px; background: #f8fafc; border-radius: 15px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 25px 0; }
    .info-item { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .label { font-weight: 600; color: #475569; display: block; margin-bottom: 8px; }
    .ai-badge { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .image-section { margin: 30px 0; }
    @media (max-width: 768px) { 
      .info-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦷 AI Dental Analysis Report</h1>
      <p>Powered by Advanced Machine Learning Technology</p>
      <div class="ai-badge">
        🧠 Custom AI Model • Generated ${new Date().toLocaleString()}
      </div>
    </div>

    <div class="content">
      <div class="section">
        <h2>👤 Patient Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Patient Name:</span>
            <strong>${userName || 'N/A'}</strong>
          </div>
          <div class="info-item">
            <span class="label">Email:</span>
            <strong>${user?.email}</strong>
          </div>
          <div class="info-item">
            <span class="label">Analysis Date:</span>
            <strong>${new Date(analysisResult.timestamp).toLocaleDateString()}</strong>
          </div>
          <div class="info-item">
            <span class="label">Analysis Time:</span>
            <strong>${new Date(analysisResult.timestamp).toLocaleTimeString()}</strong>
          </div>
        </div>
      </div>

      <div class="image-section">
        <div class="section">
          <h2>📸 AI Analysis Results</h2>
          <div style="text-align: center; margin: 20px 0;">
            <img src="${analysisResult.annotatedImage}" alt="AI Annotated X-Ray" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);" />
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🔍 AI Detection Results (${analysisResult.detections.length})</h2>
        <div style="background: #eff6ff; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af; font-size: 0.9em;"><strong>Understanding Confidence Scores:</strong> The confidence percentage indicates how certain our AI model is about each detection, with higher percentages representing greater certainty in the finding.</p>
        </div>
        ${analysisResult.detections.length === 0 ? `
          <div style="text-align: center; padding: 40px;">
            <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
            <h3 style="color: #059669; margin-bottom: 10px;">Excellent News!</h3>
            <p style="color: #6b7280;">No dental issues detected by our AI analysis</p>
          </div>
        ` : analysisResult.detections.map(d => {
          const severity = d.confidence > 0.8 ? 'high' : d.confidence > 0.6 ? 'medium' : 'low';
          const severityText = d.confidence > 0.8 ? 'High Priority' : d.confidence > 0.6 ? 'Medium Priority' : 'Low Priority';
          const action = d.confidence > 0.8 
            ? 'Immediate consultation recommended' 
            : d.confidence > 0.6 
            ? 'Schedule follow-up appointment'
            : 'Monitor and track progress';
          
          return `
          <div class="detection">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 1.3em;">${d.label}</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div>
                <strong>AI Confidence:</strong> ${(d.confidence * 100).toFixed(1)}%
              </div>
              <div>
                <strong>Priority:</strong> <span class="confidence ${severity}">${severityText}</span>
              </div>
              <div>
                <strong>Recommendation:</strong> ${action}
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>

      <div class="section">
        <h2>📋 Summary & Next Steps</h2>
        <p style="font-size: 1.1em; line-height: 1.6; margin-bottom: 20px;">
          Our advanced AI system has analyzed your dental X-ray and detected <strong>${analysisResult.detections.length}</strong> area(s) requiring attention.
        </p>
        <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #4f46e5; margin: 0 0 15px 0;">Recommended Actions:</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Schedule a consultation with your dental professional to review these findings</li>
            <li>Bring this AI analysis report to your appointment for reference</li>
            <li>Continue regular dental check-ups for optimal oral health monitoring</li>
            <li>Maintain excellent oral hygiene practices daily</li>
            <li>Consider preventive treatments as recommended by your dentist</li>
          </ul>
        </div>
      </div>

      <div class="footer">
        <div class="ai-badge" style="margin-bottom: 15px;">
          🤖 Powered by Custom Machine Learning Models
        </div>
        <p><strong>Important:</strong> This AI-generated analysis is for informational purposes and should not replace professional dental diagnosis.</p>
        <p>Always consult with qualified dental professionals for treatment decisions.</p>
        <p>&copy; ${new Date().getFullYear()} Advanced Dental AI Analysis System</p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AI-Dental-Analysis-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto p-8 relative z-10">
        {/* Enhanced Header */}
        <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent">
                  Welcome back, {userName || user?.email?.split('@')[0]}!
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <p className="text-gray-600 font-medium">Your AI-powered dental companion</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.push('/history')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-medium"
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-medium"
              >
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-2xl transform hover:-translate-y-2 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Scans</p>
                <p className="text-4xl font-bold">{stats.totalScans}</p>
              </div>
              <FileImage className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl transform hover:-translate-y-2 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">AI Detections</p>
                <p className="text-4xl font-bold">{stats.recentIssues}</p>
              </div>
              <Activity className="w-12 h-12 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl transform hover:-translate-y-2 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Last Scan</p>
                <p className="text-xl font-bold">
                  {stats.lastScanDate 
                    ? new Date(stats.lastScanDate).toLocaleDateString()
                    : 'None yet'}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-emerald-200" />
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">AI-Powered Analysis</h2>
              <p className="text-gray-600">Upload for instant custom ML analysis</p>
            </div>
          </div>
          
          <div
            className={`border-3 border-dashed rounded-3xl p-16 text-center transition-all ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading || analyzing}
            />
            
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <FileImage className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Drop your X-ray here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
              Advanced custom machine learning model analysis
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Secure & Private • JPG, PNG supported</span>
            </div>
          </div>

          {(uploading || analyzing) && (
            <div className="mt-8 bg-indigo-50 rounded-2xl p-6">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                <div>
                  <p className="text-indigo-800 font-bold text-lg">
                    {uploading ? "Uploading..." : "AI analyzing..."}
                  </p>
                  <p className="text-indigo-600 text-sm">Custom ML model processing</p>
                </div>
              </div>
            </div>
          )}
          
          {errorMsg && (
            <div className="mt-8 flex items-center gap-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
              <AlertCircle className="w-6 h-6" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Analysis Complete</h2>
                  <p className="text-gray-600">Custom AI model results</p>
                </div>
              </div>
              <button
                onClick={downloadReport}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
              >
                <Download className="w-5 h-5" />
                Download Report
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="font-bold text-xl">Original Image</h3>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={analysisResult.originalImage}
                    alt="Original"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-xl">AI Analysis</h3>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={analysisResult.annotatedImage}
                    alt="Analyzed"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-600" />
                AI Detection Results
              </h3>
              {analysisResult.detections.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                  <h4 className="text-2xl font-bold text-green-700">No issues detected!</h4>
                  <p className="text-gray-600">Your X-ray appears healthy</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analysisResult.detections.map((detection, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-xl">{detection.label}</h4>
                          <p className="text-gray-600">
                            Confidence: {(detection.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          detection.confidence > 0.8 ? 'bg-red-100 text-red-700' : 
                          detection.confidence > 0.6 ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-green-100 text-green-700'
                        }`}>
                          {detection.confidence > 0.8 ? 'High' : detection.confidence > 0.6 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <ImageUploadDashboard />
    </AuthWrapper>
  )
}