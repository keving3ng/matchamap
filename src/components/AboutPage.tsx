import React from 'react'
import { Heart, Coffee, MapPin, Star } from 'lucide-react'
import { ContentContainer } from './ContentContainer'

export const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">About MatchaMap</h2>
        <p className="text-sm text-gray-600 mt-1">Your guide to Toronto's best matcha</p>
      </div>

      <ContentContainer maxWidth="md">
        <div className="px-4 py-8 space-y-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🍵</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Discover Toronto's Matcha Scene</h3>
            <p className="text-green-50">
              Curated reviews and ratings to help you find the perfect matcha latte
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Heart size={24} className="text-green-600" />
              Our Mission
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              MatchaMap was created out of a love for high-quality matcha and a desire to help fellow
              matcha enthusiasts navigate Toronto's growing cafe scene. We personally visit and review
              every location, evaluating the quality of the matcha, preparation technique, atmosphere,
              and overall experience.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our goal is simple: to help you find your next favorite matcha spot without the guesswork.
            </p>
          </div>

          {/* Rating System */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star size={24} className="text-green-600" />
              Our Rating System
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full font-bold text-sm flex-shrink-0">
                  9-10
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Exceptional</p>
                  <p className="text-sm text-gray-600">Outstanding matcha quality, perfect preparation, and memorable experience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full font-bold text-sm flex-shrink-0">
                  7-8
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Great</p>
                  <p className="text-sm text-gray-600">High-quality matcha with solid preparation and enjoyable atmosphere</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full font-bold text-sm flex-shrink-0">
                  5-6
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Good</p>
                  <p className="text-sm text-gray-600">Decent matcha, may have room for improvement</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm flex-shrink-0">
                  3-4
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Fair</p>
                  <p className="text-sm text-gray-600">Basic matcha experience with noticeable shortcomings</p>
                </div>
              </div>
            </div>
          </div>

          {/* What We Evaluate */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Coffee size={24} className="text-green-600" />
              What We Evaluate
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="font-semibold text-gray-800 mb-1">Matcha Quality</p>
                <p className="text-sm text-gray-600">Grade, freshness, color, and aroma</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="font-semibold text-gray-800 mb-1">Preparation</p>
                <p className="text-sm text-gray-600">Technique, temperature, and consistency</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="font-semibold text-gray-800 mb-1">Taste & Balance</p>
                <p className="text-sm text-gray-600">Flavor profile and sweetness level</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="font-semibold text-gray-800 mb-1">Overall Experience</p>
                <p className="text-sm text-gray-600">Atmosphere, service, and value</p>
              </div>
            </div>
          </div>

          {/* About the Reviewer */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">About the Reviewer</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-3xl flex-shrink-0 shadow-md">
                👤
              </div>
              <div>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Hi! I'm a Toronto-based matcha enthusiast who has been exploring the city's cafe scene
                  for over 5 years. After trying countless matcha lattes across the GTA, I created MatchaMap
                  to share my findings with fellow matcha lovers.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  All reviews are based on personal visits and reflect my honest opinions. I'm not affiliated
                  with any of the cafes listed and don't accept payment for reviews.
                </p>
              </div>
            </div>
          </div>

          {/* Coverage Area */}
          <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin size={24} className="text-green-600" />
              Coverage Area
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We currently focus on Toronto and the Greater Toronto Area (GTA). This includes neighborhoods
              from downtown Toronto to the surrounding suburbs.
            </p>
            <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3 border border-green-200">
              <strong>Want to suggest a cafe?</strong> Use our contact form to let us know about matcha
              spots we should check out!
            </p>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl border-2 border-green-200 p-6 text-center">
            <p className="text-gray-700 font-semibold mb-4">
              Follow our matcha journey on social media!
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="https://www.instagram.com/vivisual.diary"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@vivisual.diary"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-900 transition"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}

export default AboutPage
