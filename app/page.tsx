// app/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Brain, Shield, Clock, Zap, ChevronRight, Star, Sparkles, Award, Target, Cpu } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-pulse"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex justify-between items-center backdrop-blur-sm bg-white/30 rounded-3xl px-8 py-4 border border-white/20 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Dental Analysis
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-all duration-300 rounded-2xl hover:bg-white/50"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/login?mode=signup')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 font-semibold"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center px-6 py-3 mb-8 text-sm font-semibold text-blue-700 backdrop-blur-sm bg-blue-100/80 rounded-full border border-blue-200/50 shadow-lg">
            <Sparkles className="w-4 h-4 mr-2" />
            Next-Gen AI • Instant Results • Advanced ML Models
          </div>
          
          <h2 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Transform
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent">
              Dental Diagnostics
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Upload your dental X-rays and experience the power of 
            <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> advanced AI analysis</span>.
            <br />
            Detect dental conditions with cutting-edge machine learning technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
              onClick={() => router.push('/login?mode=signup')}
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xl font-bold rounded-full hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 flex items-center"
            >
              Start AI Analysis
              <ChevronRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
            <button
              onClick={() => router.push('/demo')}
              className="px-10 py-5 backdrop-blur-sm bg-white/80 text-gray-800 text-xl font-semibold rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-white/50"
            >
              View Demo
            </button>
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-lg">
            <div className="flex items-center gap-3 backdrop-blur-sm bg-white/60 px-6 py-3 rounded-2xl border border-white/30 shadow-lg">
              <Star className="w-6 h-6 text-yellow-500" />
              <span className="font-semibold text-gray-800">Premium AI Technology</span>
            </div>
            <div className="flex items-center gap-3 backdrop-blur-sm bg-white/60 px-6 py-3 rounded-2xl border border-white/30 shadow-lg">
              <Award className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-gray-800">Clinical Grade Accuracy</span>
            </div>
            <div className="flex items-center gap-3 backdrop-blur-sm bg-white/60 px-6 py-3 rounded-2xl border border-white/30 shadow-lg">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-800">HIPAA Compliant</span>
            </div>
          </div>
        </div>


      </section>

      {/* Enhanced Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h3 className="text-5xl font-bold mb-6">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Dental Analysis
            </span>
          </h3>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">Experience the future of dental diagnostics with our advanced AI technology</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
            <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 border border-white/30">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Cpu className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors duration-300">Custom ML Models</h4>
              <p className="text-gray-600 group-hover:text-gray-100 transition-colors duration-300 text-lg leading-relaxed">
                Advanced custom machine learning models trained on extensive dental imaging datasets with state-of-the-art accuracy
              </p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
            <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 border border-white/30">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors duration-300">Lightning Speed</h4>
              <p className="text-gray-600 group-hover:text-gray-100 transition-colors duration-300 text-lg leading-relaxed">
                Get comprehensive AI analysis in seconds, not hours. Real-time processing with instant detailed reports
              </p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
            <div className="relative backdrop-blur-sm bg-white/80 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 border border-white/30">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors duration-300">Enterprise Security</h4>
              <p className="text-gray-600 group-hover:text-gray-100 transition-colors duration-300 text-lg leading-relaxed">
                Military-grade encryption with HIPAA compliance. Your patient data is protected with the highest security standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="relative z-10 overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">Powering the Future of Dentistry</h3>
            <p className="text-xl text-white/80">Advanced AI technology delivering measurable results</p>
          </div>
          <div className="grid md:grid-cols-4 gap-10 text-center text-white">
            <div className="backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20">
              <div className="text-6xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">1M+</div>
              <div className="text-white/80 text-lg font-medium">Images Analyzed</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20">
              <div className="text-6xl font-bold mb-3 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">99%</div>
              <div className="text-white/80 text-lg font-medium">Accuracy Rate</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20">
              <div className="text-6xl font-bold mb-3 bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">30s</div>
              <div className="text-white/80 text-lg font-medium">Average Analysis</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20">
              <div className="text-6xl font-bold mb-3 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">24/7</div>
              <div className="text-white/80 text-lg font-medium">Always Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Research Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="backdrop-blur-sm bg-white/80 rounded-3xl p-12 shadow-2xl border border-white/30">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Target className="w-8 h-8 text-indigo-600" />
                <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Advancing Dental Science
                </h3>
              </div>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                By using our AI Dental Analysis platform, you're contributing to the advancement of dental diagnostics. 
                Your anonymized data helps improve our machine learning models and supports global dental research initiatives.
              </p>
              <div className="backdrop-blur-sm bg-gray-50/80 rounded-2xl p-8 shadow-lg border border-gray-200/50">
                <p className="text-gray-600 leading-relaxed">
                  <strong className="text-gray-800">Research Disclosure:</strong> All uploaded images and analysis data may be used for research purposes 
                  to improve diagnostic accuracy and develop better dental health solutions. Your personal information 
                  is always kept confidential and data is fully anonymized before use in research studies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Dental Analysis
            </span>
          </div>
          <p className="text-gray-400 mb-6 text-lg">
            &copy; 2024 AI Dental Analysis. Transforming dental diagnostics with advanced machine learning.
          </p>
          <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 max-w-4xl mx-auto border border-white/20">
            <p className="text-sm text-gray-300 leading-relaxed">
              <strong>Disclaimer:</strong> This AI-powered analysis tool provides computer-assisted diagnostic support and should not replace professional dental diagnosis. 
              Always consult with qualified dental professionals for medical decisions and treatment planning.
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(30px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-40px, 30px) scale(0.9);
          }
          75% {
            transform: translate(20px, -20px) scale(1.05);
          }
        }
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  )
}