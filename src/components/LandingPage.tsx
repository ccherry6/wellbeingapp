import React from 'react';
import { BDCLogo } from './BDCLogo';
import { Heart, Shield, TrendingUp, Users, Lock, Clock, Smartphone, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onOpenApp: () => void;
}

export function LandingPage({ onOpenApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BDCLogo className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Thrive Wellbeing</h1>
              <p className="text-xs text-gray-600">Empowering High Performance Youth Wellness</p>
            </div>
          </div>
          <button
            onClick={onOpenApp}
            className="bg-blue-900 text-white px-6 py-2.5 rounded-lg hover:bg-blue-800 transition-colors font-medium flex items-center gap-2"
          >
            Open App
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="flex justify-center mb-8">
          <BDCLogo className="h-24 w-auto" />
        </div>
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Your Daily Wellness Companion
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          Thrive Wellbeing is a comprehensive wellness monitoring platform designed specifically for high-performance youth athletes.
          Track your wellbeing, connect with coaches, and thrive in your athletic and academic journey.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={onOpenApp}
            className="bg-blue-900 text-white px-8 py-4 rounded-lg hover:bg-blue-800 transition-colors font-semibold text-lg flex items-center gap-2"
          >
            Get Started
            <ChevronRight className="h-5 w-5" />
          </button>
          <a
            href="/support.html"
            className="bg-white text-blue-900 px-8 py-4 rounded-lg border-2 border-blue-900 hover:bg-blue-50 transition-colors font-semibold text-lg"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-4">
            See It In Action
          </h3>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
            Experience the intuitive interface designed for both student-athletes and coaches
          </p>

          {/* Student Features */}
          <div className="mb-20">
            <h4 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              For Students
            </h4>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-200 bg-gray-100 mb-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="/screenshots/student-checkin-1.png"
                    alt="Daily Wellness Check-in Interface"
                    className="w-full h-auto"
                  />
                </div>
                <h5 className="font-semibold text-gray-900 text-center">Daily Check-in</h5>
                <p className="text-sm text-gray-600 text-center mt-1">Track sleep, energy, mood, and more</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-200 bg-gray-100 mb-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="/screenshots/student-checkin-2.png"
                    alt="Biometric Data and Support Request"
                    className="w-full h-auto"
                  />
                </div>
                <h5 className="font-semibold text-gray-900 text-center">Comprehensive Tracking</h5>
                <p className="text-sm text-gray-600 text-center mt-1">Optional biometric data and support requests</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-200 bg-gray-100 mb-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="/screenshots/student-checkin-3.png"
                    alt="Submit Check-in and Account Settings"
                    className="w-full h-auto"
                  />
                </div>
                <h5 className="font-semibold text-gray-900 text-center">Easy Submission</h5>
                <p className="text-sm text-gray-600 text-center mt-1">Complete your check-in in under 2 minutes</p>
              </div>
            </div>
          </div>

          {/* Coach Features */}
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              For Coaches
            </h4>
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-200 bg-gray-100 mb-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="/screenshots/coach-analytics-1.png"
                    alt="Coach Analytics Dashboard - Trend Charts"
                    className="w-full h-auto"
                  />
                </div>
                <h5 className="font-semibold text-gray-900 text-center">Analytics Dashboard</h5>
                <p className="text-sm text-gray-600 text-center mt-1">Monitor trends and identify patterns</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-200 bg-gray-100 mb-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="/screenshots/coach-analytics-2.png"
                    alt="Coach Analytics Dashboard - Spider Chart Comparison"
                    className="w-full h-auto"
                  />
                </div>
                <h5 className="font-semibold text-gray-900 text-center">Student Comparison</h5>
                <p className="text-sm text-gray-600 text-center mt-1">Compare metrics across your entire team</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Thrive Wellbeing?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-blue-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Daily Wellness Tracking</h4>
              <p className="text-gray-600">
                Monitor your sleep, energy, mood, stress, and recovery with quick daily check-ins designed for busy student-athletes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Coach Connection</h4>
              <p className="text-gray-600">
                Stay connected with your coaching team. Request support when needed and receive timely intervention from trusted mentors.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Progress Insights</h4>
              <p className="text-gray-600">
                Visualize your wellness trends over time. Understand patterns, celebrate progress, and identify areas for growth.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Privacy First</h4>
              <p className="text-gray-600">
                Your data is encrypted and secure. Only you and your approved coaching staff have access. Full compliance with Australian privacy laws.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Quick & Easy</h4>
              <p className="text-gray-600">
                Complete your daily wellness check in under 2 minutes. Set reminders to build a consistent wellbeing routine.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-blue-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Cross-Platform</h4>
              <p className="text-gray-600">
                Access on web or iOS app. Sync seamlessly across devices. Track your wellbeing wherever you are.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-900 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Sign Up</h4>
              <p className="text-gray-600">
                Register using your coach's invitation link or QR code. Create your secure account in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-900 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Track Daily</h4>
              <p className="text-gray-600">
                Complete quick wellness check-ins each day. Rate your sleep, mood, energy, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-900 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Thrive</h4>
              <p className="text-gray-600">
                Review your trends, celebrate progress, and get support when you need it. Thrive in performance and life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Wellness Journey?</h3>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of student-athletes already using Thrive Wellbeing to optimize their performance and wellbeing.
          </p>
          <button
            onClick={onOpenApp}
            className="bg-white text-blue-900 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg inline-flex items-center gap-2"
          >
            Open App Now
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BDCLogo className="h-8 w-auto" />
                <span className="font-bold text-white">Thrive Wellbeing</span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering high-performance youth wellness through daily monitoring and coaching support.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={onOpenApp} className="hover:text-white transition-colors">
                    Web App
                  </button>
                </li>
                <li>
                  <a href="https://apps.apple.com/app/thrive-wellbeing" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    iOS App
                  </a>
                </li>
                <li>
                  <a href="/support.html" className="hover:text-white transition-colors">
                    Help & Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/privacy.html" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms.html" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/support.html" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:ccherry@bdc.nsw.edu.au" className="hover:text-white transition-colors">
                    ccherry@bdc.nsw.edu.au
                  </a>
                </li>
                <li>
                  <a href="https://thrivewellbeing.me" className="hover:text-white transition-colors">
                    thrivewellbeing.me
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2024 Thrive Wellbeing. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="/privacy.html" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="/terms.html" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="/support.html" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
