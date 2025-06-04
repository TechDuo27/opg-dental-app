"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { User } from "@supabase/supabase-js"
import AuthWrapper from "@/components/AuthWrapper"
import { Download, Upload, AlertCircle, Activity, FileImage, History, TrendingUp, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type Detection = {
  label: string
  confidence: number
  bbox: [number, number, number, number] // [x, y, width, height]
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
      setImageUrl(urlData.publicUrl) // Store the URL
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

      const response = await fetch('/api/analyze-opg', {
        method: 'POST',
        body: formData
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Analysis failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const result: AnalysisResult = {
        originalImage: imageUrl,
        annotatedImage: data.annotatedImage,
        detections: data.detections,
        timestamp: new Date().toISOString()
      }

      setAnalysisResult(result)
      setAnalyzing(false)

      // Save to analysis history only once
      if (!savingHistory && data.detections) {
        setSavingHistory(true)
        try {
          const { error: historyError } = await supabase
            .from('analysis_history')
            .insert({
              user_id: user?.id,
              original_image_url: imageUrl,
              annotated_image_url: imageUrl,
              detections: data.detections,
              total_detections: data.detections.length
            })

          if (!historyError) {
            fetchUserStats() // Refresh stats
          }
        } catch (historyError) {
          console.error('History save error:', historyError)
        } finally {
          setSavingHistory(false)
        }
      }

    } catch (error) {
      console.error('ML analysis error:', error)
      setErrorMsg(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setAnalyzing(false)
    }
  }

  const downloadReport = () => {
    if (!analysisResult) return

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>OPG Analysis Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #2563eb; margin-bottom: 10px; }
    .section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .section h2 { color: #1f2937; margin-bottom: 15px; }
    .detection { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #3b82f6; }
    .confidence { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 14px; font-weight: bold; }
    .high { background: #fee2e2; color: #dc2626; }
    .medium { background: #fef3c7; color: #d97706; }
    .low { background: #d1fae5; color: #059669; }
    .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 14px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .info-item { background: white; padding: 15px; border-radius: 5px; }
    .label { font-weight: bold; color: #4b5563; }
  </style>
</head>
<body>
  <div class="header">
    <h1>OPG X-Ray Analysis Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Patient Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Patient Name:</span> ${userName || 'N/A'}
      </div>
      <div class="info-item">
        <span class="label">Email:</span> ${user?.email}
      </div>
      <div class="info-item">
        <span class="label">Analysis Date:</span> ${new Date(analysisResult.timestamp).toLocaleDateString()}
      </div>
      <div class="info-item">
        <span class="label">Analysis Time:</span> ${new Date(analysisResult.timestamp).toLocaleTimeString()}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Detected Conditions (${analysisResult.detections.length})</h2>
    ${analysisResult.detections.map(d => {
      const severity = d.confidence > 0.8 ? 'high' : d.confidence > 0.6 ? 'medium' : 'low';
      const severityText = d.confidence > 0.8 ? 'High Priority' : d.confidence > 0.6 ? 'Medium Priority' : 'Low Priority';
      const action = d.confidence > 0.8 
        ? 'Immediate attention required' 
        : d.confidence > 0.6 
        ? 'Schedule appointment soon'
        : 'Monitor condition';
      
      return `
      <div class="detection">
        <h3>${d.label}</h3>
        <p><strong>Confidence Score:</strong> ${(d.confidence * 100).toFixed(1)}%</p>
        <p><strong>Severity:</strong> <span class="confidence ${severity}">${severityText}</span></p>
        <p><strong>Recommended Action:</strong> ${action}</p>
        <p><strong>Location:</strong> Coordinates (${d.bbox[0].toFixed(0)}, ${d.bbox[1].toFixed(0)})</p>
      </div>
      `;
    }).join('')}
  </div>

  <div class="section">
    <h2>Summary & Recommendations</h2>
    <p>This automated analysis has detected ${analysisResult.detections.length} potential area(s) of concern in your OPG X-ray.</p>
    <ul style="margin-top: 15px; padding-left: 20px;">
      <li>Schedule a consultation with your dentist to discuss these findings</li>
      <li>This is an AI-assisted analysis and should be verified by a qualified dental professional</li>
      <li>Regular dental check-ups are recommended for optimal oral health</li>
      <li>Maintain good oral hygiene practices</li>
    </ul>
  </div>

  <div class="footer">
    <p>This report is generated by an AI system and is intended for informational purposes only.</p>
    <p>It should not replace professional dental diagnosis and treatment.</p>
    <p>&copy; ${new Date().getFullYear()} OPG Analysis System</p>
  </div>
</body>
</html>
    `

    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `OPG-Analysis-Report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Welcome back, {userName || user?.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600">Your AI-powered dental health companion</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/history')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Scans</p>
                <p className="text-3xl font-bold mt-1">{stats.totalScans}</p>
              </div>
              <FileImage className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Recent Issues</p>
                <p className="text-3xl font-bold mt-1">{stats.recentIssues}</p>
              </div>
              <Activity className="w-10 h-10 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Last Scan</p>
                <p className="text-lg font-bold mt-1">
                  {stats.lastScanDate 
                    ? new Date(stats.lastScanDate).toLocaleDateString() 
                    : 'No scans yet'}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-200" />
            </div>
          </div>
        </div>

        {/* Upload Section with Drag & Drop */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Upload className="w-7 h-7 text-blue-600" />
            Upload OPG X-ray
          </h2>
          
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${uploading || analyzing ? 'opacity-50 pointer-events-none' : ''}`}
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
            
            <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your X-ray image here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports JPG, PNG, and other image formats
            </p>
          </div>

          {(uploading || analyzing) && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-700 font-medium">
                  {uploading ? "Uploading image..." : "Analyzing with AI model..."}
                </p>
              </div>
              {analyzing && (
                <div className="mt-3 w-full bg-blue-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
            </div>
          )}
          
          {errorMsg && (
            <div className="mt-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-white rounded-2xl shadow-lg p-8 animate-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <CheckCircle className="w-7 h-7 text-green-600" />
                Analysis Complete
              </h2>
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-5 h-5" />
                Download Report
              </button>
            </div>

            {/* Side-by-side images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  Original Image
                </h3>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg bg-gray-100">
                  <Image
                    src={analysisResult.originalImage}
                    alt="Original OPG"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  AI Analysis
                </h3>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg bg-gray-100">
                  <Image
                    src={analysisResult.annotatedImage}
                    alt="Annotated OPG"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Detections Table */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Detected Conditions</h3>
              {analysisResult.detections.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 font-medium">No issues detected!</p>
                  <p className="text-gray-600 text-sm mt-1">Your X-ray appears to be normal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysisResult.detections.map((detection, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{detection.label}</h4>
                          <div className="mt-2 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Confidence:</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      detection.confidence > 0.8 
                                        ? 'bg-red-500' 
                                        : detection.confidence > 0.6 
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${detection.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold">
                                  {(detection.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          detection.confidence > 0.8 
                            ? 'bg-red-100 text-red-700' 
                            : detection.confidence > 0.6 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {detection.confidence > 0.8 ? 'High Priority' : detection.confidence > 0.6 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analysis timestamp */}
            <div className="mt-6 text-center text-sm text-gray-500">
              Analysis completed at {new Date(analysisResult.timestamp).toLocaleString()}
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