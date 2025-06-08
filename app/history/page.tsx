// app/history/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import AuthWrapper from "@/components/AuthWrapper"
import { Calendar, FileText, ArrowLeft, Download } from "lucide-react"

interface AnalysisRecord {
  id: string
  original_image_url: string
  annotated_image_url: string
  detections: any[]
  total_detections: number
  analysis_date: string
  created_at: string
}

function HistoryContent() {
  const router = useRouter()
  const [history, setHistory] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    fetchHistory()
    getUserInfo()
  }, [])

  const getUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || "")

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserName(profile.name)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setHistory(data || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Complete Dental Analysis Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
    .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 2.5em; font-weight: 700; }
    .header p { margin: 0; opacity: 0.9; font-size: 1.1em; }
    .content { padding: 40px; }
    .section { margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 15px; border-left: 5px solid #4f46e5; }
    .section h2 { color: #1e293b; margin: 0 0 20px 0; font-size: 1.8em; display: flex; align-items: center; gap: 10px; }
    .scan-item { margin: 40px 0; padding: 30px; background: white; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); border-left: 6px solid #6366f1; }
    .scan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; }
    .scan-date { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .detection { margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 10px; border-left: 4px solid #6366f1; }
    .confidence { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .high { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #dc2626; }
    .medium { background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); color: #d97706; }
    .low { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #059669; }
    .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 14px; padding: 30px; background: #f8fafc; border-radius: 15px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 25px 0; }
    .info-item { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .label { font-weight: 600; color: #475569; display: block; margin-bottom: 8px; }
    .ai-badge { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .image-section { margin: 25px 0; }
    .image-container { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin: 20px 0; }
    .image-item { text-align: center; }
    .image-item h4 { margin-bottom: 12px; color: #1e293b; font-size: 1.1em; }
    .image-item img { max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.1); max-height: 300px; object-fit: contain; }
    .summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 25px 0; }
    .stat-item { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .stat-number { font-size: 2em; font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
    .stat-label { color: #6b7280; font-size: 0.9em; }
    .no-issues { text-align: center; padding: 30px; background: #f0fdf4; border-radius: 10px; }
    .no-issues-icon { font-size: 40px; margin-bottom: 10px; }
    @media (max-width: 768px) { 
      .image-container { grid-template-columns: 1fr; } 
      .info-grid { grid-template-columns: 1fr; }
      .summary-stats { grid-template-columns: 1fr; }
      .scan-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦷 Complete Dental Analysis Report</h1>
      <p>Comprehensive AI Analysis History</p>
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
            <strong>${userEmail}</strong>
          </div>
          <div class="info-item">
            <span class="label">Report Date:</span>
            <strong>${new Date().toLocaleDateString()}</strong>
          </div>
          <div class="info-item">
            <span class="label">Total Scans:</span>
            <strong>${history.length}</strong>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📊 Analysis Summary</h2>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-number">${history.length}</div>
            <div class="stat-label">Total Scans</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${history.reduce((acc, scan) => acc + (scan.total_detections || 0), 0)}</div>
            <div class="stat-label">Total Detections</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${history.filter(scan => (scan.total_detections || 0) > 0).length}</div>
            <div class="stat-label">Scans with Issues</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${history.filter(scan => (scan.total_detections || 0) === 0).length}</div>
            <div class="stat-label">Clean Scans</div>
          </div>
        </div>
      </div>

      ${history.map((scan, index) => `
        <div class="scan-item">
          <div class="scan-header">
            <h3 style="margin: 0; color: #1e293b; font-size: 1.4em;">Scan #${index + 1}</h3>
            <div class="scan-date">${formatDate(scan.created_at)}</div>
          </div>

          ${scan.original_image_url ? `
            <div class="image-section">
              <div class="image-container">
                <div class="image-item">
                  <h4>Original X-Ray</h4>
                  <img src="${scan.original_image_url}" alt="Original X-Ray ${index + 1}" onerror="this.style.display='none'" />
                </div>
                ${scan.annotated_image_url ? `
                  <div class="image-item">
                    <h4>AI Analysis Results</h4>
                    <img src="${scan.annotated_image_url}" alt="AI Analysis ${index + 1}" onerror="this.style.display='none'" />
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <div style="margin-top: 20px;">
            <h4 style="color: #1e293b; margin-bottom: 15px;">🔍 AI Detections (${(scan.detections || []).length})</h4>
            ${(scan.detections || []).length === 0 ? `
              <div class="no-issues">
                <div class="no-issues-icon">✅</div>
                <p style="color: #059669; font-weight: 600; margin: 0;">No issues detected in this scan</p>
              </div>
            ` : (scan.detections || []).map(detection => {
              const severity = detection.confidence > 0.8 ? 'high' : detection.confidence > 0.6 ? 'medium' : 'low';
              const severityText = detection.confidence > 0.8 ? 'High Priority' : detection.confidence > 0.6 ? 'Medium Priority' : 'Low Priority';
              const action = detection.confidence > 0.8 
                ? 'Immediate consultation recommended' 
                : detection.confidence > 0.6 
                ? 'Schedule follow-up appointment'
                : 'Monitor and track progress';
              
              return `
                <div class="detection">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                      <h5 style="margin: 0 0 8px 0; color: #1e293b; font-size: 1.1em;">${detection.label}</h5>
                      <p style="margin: 0 0 5px 0; color: #6b7280;">AI Confidence: ${(detection.confidence * 100).toFixed(1)}%</p>
                      <p style="margin: 0; color: #6b7280; font-size: 0.9em;"><strong>Recommendation:</strong> ${action}</p>
                    </div>
                    <span class="confidence ${severity}">${severityText}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}

      <div class="section">
        <h2>📋 Overall Recommendations</h2>
        <div style="background: white; padding: 25px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #4f46e5; margin: 0 0 20px 0;">Based on your complete analysis history:</h3>
          <ul style="margin: 0; padding-left: 25px; line-height: 2;">
            <li>Schedule regular consultations with your dental professional</li>
            <li>Share this comprehensive report with your dentist for thorough review</li>
            <li>Continue monitoring your dental health with periodic AI scans</li>
            <li>Maintain excellent oral hygiene practices consistently</li>
            ${history.some(scan => scan.detections?.some(d => d.confidence > 0.8)) ? '<li><strong>Follow up on high-priority detections immediately</strong></li>' : ''}
            <li>Consider this data for long-term dental health planning</li>
          </ul>
        </div>
      </div>

      <div class="footer">
        <div class="ai-badge" style="margin-bottom: 15px;">
          🤖 Powered by Custom Machine Learning Models
        </div>
        <p><strong>Important:</strong> This comprehensive AI analysis report is for informational purposes and should not replace professional dental diagnosis.</p>
        <p>Always consult with qualified dental professionals for treatment decisions and health planning.</p>
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
      a.download = `Complete-Dental-Analysis-Report-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading scans:', error)
      alert('Failed to download scans. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityColor = (detections: any[]) => {
    if (!detections || detections.length === 0) return 'bg-green-100 text-green-700'
    
    const hasHighConfidence = detections.some(d => d.confidence > 0.8)
    if (hasHighConfidence) return 'bg-red-100 text-red-700'
    
    const hasMediumConfidence = detections.some(d => d.confidence > 0.6)
    if (hasMediumConfidence) return 'bg-yellow-100 text-yellow-700'
    
    return 'bg-green-100 text-green-700'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-3 hover:bg-white/50 rounded-2xl transition-all duration-300 transform hover:-translate-x-1"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Analysis History
                </h1>
                <p className="text-gray-600 mt-2 font-medium">Track your dental health journey over time</p>
              </div>
            </div>
            {history.length > 0 && (
              <button 
                onClick={handleDownloadAll}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-semibold"
              >
                <Download className="w-5 h-5" />
                Download Complete Report
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-16 text-center border border-white/20">
            <FileText className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-4">No Analysis History</h3>
            <p className="text-gray-500 mb-8 text-lg">You haven't analyzed any X-rays yet. Start your dental health journey!</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-semibold"
            >
              Analyze Your First X-Ray
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {history.map((record) => (
              <div key={record.id} className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                      <span className="text-lg font-medium text-gray-700">
                        {formatDate(record.analysis_date || record.created_at)}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-bold text-2xl mb-2 text-gray-900">
                        AI Analysis Results
                      </h3>
                      <p className="text-gray-600 text-lg">
                        {record.total_detections} condition{record.total_detections !== 1 ? 's' : ''} detected by our AI model
                      </p>
                    </div>

                    {record.detections && record.detections.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {record.detections.map((detection, idx) => (
                          <span
                            key={idx}
                            className={`text-sm px-4 py-2 rounded-full font-semibold ${getSeverityColor([detection])}`}
                          >
                            {detection.label} ({(detection.confidence * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ml-8">
                    {record.original_image_url && (
                      <img
                        src={record.original_image_url}
                        alt="X-Ray thumbnail"
                        className="w-32 h-32 object-cover rounded-2xl border-2 border-white shadow-lg"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function HistoryPage() {
  return (
    <AuthWrapper>
      <HistoryContent />
    </AuthWrapper>
  )
}