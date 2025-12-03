import React from 'react'
import { Heart, Users, Calendar, TrendingUp } from 'lucide-react'
import { BDCLogo } from '../BDCLogo'

const schoolStaff = [
  { name: 'Chris Cherry', email: 'ccherry@bdc.nsw.edu.au', role: 'Teacher PDHPE/HPP' },
  { name: 'Nat Titcume', email: 'ntitcume@bdc.nsw.edu.au', role: 'Teacher PDHPE/HPP' },
  { name: 'Sarah Stokes', email: 'sstokes@bdc.nsw.edu.au', role: 'Head of Primary' },
  { name: 'Sue Oconnor', email: 'sueoconnor@bdc.nsw.edu.au', role: 'Head of Secondary' },
  { name: 'Pat Galvin', email: 'pgalvin@bdc.nsw.edu.au', role: 'Primary Wellbeing Support' },
  { name: 'Andrea Wiffen', email: 'awiffen@bdc.nsw.edu.au', role: 'Director of Student Wellbeing' }
]

interface SkipConfirmationProps {
  onCompleteCheckIn: () => void
  onViewProgress: () => void
}

export function SkipConfirmation({ onCompleteCheckIn, onViewProgress }: SkipConfirmationProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BDCLogo className="h-12 sm:h-16 w-auto" />
          </div>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            No worries at all!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-2">
            You can complete your check-in anytime you're ready.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              It's completely okay to skip
            </h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>There are no consequences for skipping a check-in</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Your position in the HPP squad is not affected</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Research findings are not impacted by your individual choices</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>You can participate again whenever you feel ready</span>
              </li>
            </ul>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Support is always available
            </h3>
            <p className="text-sm text-orange-800 mb-3">
              If you're concerned about your wellbeing, you can speak to someone anytime, regardless of whether you complete check-ins:
            </p>
            <div className="space-y-2">
              {schoolStaff.map((staff, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-orange-900 text-sm">{staff.name}</p>
                      <p className="text-xs text-orange-700">{staff.role}</p>
                    </div>
                    <a
                      href={`mailto:${staff.email}`}
                      className="text-xs text-orange-600 hover:text-orange-800 underline"
                    >
                      Email
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              You can still view your progress
            </h3>
            <p className="text-sm text-blue-800">
              Even when you skip a check-in, you can still access your past data, view trends, and track your overall wellbeing journey.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCompleteCheckIn}
            className="flex-1 bg-gradient-to-r from-blue-900 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-800 hover:to-blue-600 transition-all"
          >
            Changed my mind - Complete check-in today
          </button>
          <button
            onClick={onViewProgress}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all border-2 border-gray-300"
          >
            Continue to my progress
          </button>
        </div>
      </div>
    </div>
  )
}
