// app/profile/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import AuthWrapper from "@/components/AuthWrapper"
import { ArrowLeft, User, Mail, Calendar, Activity, Save, Camera, MapPin, Download } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  age: number
  sex: string
  smoking_status: string | null
  created_at: string
}

function ProfileContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "",
    smoking_status: "",
    country: "",
    state: "",
    area: ""
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email || "")

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setFormData({
          name: data.name,
          age: data.age.toString(),
          sex: data.sex,
          smoking_status: data.smoking_status || "",
          country: data.country || "",
          state: data.state || "",
          area: data.area || ""
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: formData.name,
          age: parseInt(formData.age),
          sex: formData.sex,
          smoking_status: formData.smoking_status || null,
          country: formData.country,
          state: formData.state,
          area: formData.area,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
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

  const handleDownloadAllScans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all analysis history
      const { data: history, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!history || history.length === 0) {
        alert('No scans found to download')
        return
      }

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
    .summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 25px 0; }
    .stat-item { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .stat-number { font-size: 2em; font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
    .stat-label { color: #6b7280; font-size: 0.9em; }
    .no-issues { text-align: center; padding: 30px; background: #f0fdf4; border-radius: 10px; }
    .no-issues-icon { font-size: 40px; margin-bottom: 10px; }
    @media (max-width: 768px) { 
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
            <strong>${formData.name || 'N/A'}</strong>
          </div>
          <div class="info-item">
            <span class="label">Email:</span>
            <strong>${email}</strong>
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
        <div style="background: #eff6ff; padding: 15px; border-radius: 10px; margin-top: 20px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af; font-size: 0.9em;"><strong>Understanding Confidence Scores:</strong> The confidence percentage indicates how certain our AI model is about each detection, with higher percentages representing greater certainty in the finding.</p>
        </div>
      </div>

      ${history.map((scan, index) => `
        <div class="scan-item">
          <div class="scan-header">
            <h3 style="margin: 0; color: #1e293b; font-size: 1.4em;">Scan #${index + 1}</h3>
            <div class="scan-date">${formatDate(scan.created_at)}</div>
          </div>

          ${scan.annotated_image_url ? `
            <div class="image-section">
              <div style="text-align: center; margin: 20px 0;">
                <h4 style="margin-bottom: 15px; color: #1e293b; font-size: 1.2em;">AI Analysis Results</h4>
                <img src="${scan.annotated_image_url}" alt="AI Analysis ${index + 1}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); max-height: 400px; object-fit: contain;" onerror="this.style.display='none'" />
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-3 hover:bg-white/50 rounded-2xl transition-all duration-300 transform hover:-translate-x-1"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Profile Settings
              </h1>
              <p className="text-gray-600 mt-2 font-medium">Manage your account information and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="text-center">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
                  <User className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.name}</h2>
                <p className="text-gray-600 font-medium">{email}</p>
                
                <div className="mt-8 space-y-4 text-left">
                  <div className="flex items-center gap-4 text-sm backdrop-blur-sm bg-gray-50/50 rounded-2xl p-3">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="text-gray-700 font-medium">
                      Joined {profile ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm backdrop-blur-sm bg-gray-50/50 rounded-2xl p-3">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700 font-medium">{formData.age} years old</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm backdrop-blur-sm bg-gray-50/50 rounded-2xl p-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700 font-medium">
                      {formData.area && formData.state ? `${formData.area}, ${formData.state}` : 'Location not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2">
            <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-8 text-gray-900">Personal Information</h3>
              
              <form className="space-y-6" onSubmit={(e) => { 
                e.preventDefault(); 
                handleSave(); 
              }}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-gray-50 cursor-not-allowed"
                      value={email}
                    />
                    <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Biological Sex
                    </label>
                    <select
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Country
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="e.g., India"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      State/Province
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="e.g., Karnataka"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      City/Area
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="e.g., Bengaluru"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Smoking Status
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      value={formData.smoking_status}
                      onChange={(e) => setFormData({ ...formData, smoking_status: e.target.value })}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="never">Never smoked</option>
                      <option value="former">Former smoker</option>
                      <option value="current">Current smoker</option>
                    </select>
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Additional Settings */}
            <div className="backdrop-blur-sm bg-white/80 rounded-3xl shadow-2xl p-8 mt-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-8 text-gray-900">Privacy & Security</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 backdrop-blur-sm bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-200/30">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">Download Complete Analysis Report</h4>
                    <p className="text-gray-600">Get a comprehensive report of all your X-ray analyses with AI insights</p>
                  </div>
                  <button 
                    onClick={handleDownloadAllScans}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return (
    <AuthWrapper>
      <ProfileContent />
    </AuthWrapper>
  )
}