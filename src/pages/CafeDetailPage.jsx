import { useParams } from 'react-router-dom'

function CafeDetailPage() {
  const { id } = useParams()
  
  return (
    <div className="min-h-screen">
      {/* Hero Image */}
      <div className="h-64 bg-matcha-200 flex items-center justify-center md:h-80">
        <span className="text-6xl">🍵</span>
      </div>

      {/* Content */}
      <div className="px-4 py-6 md:px-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Cafe Name {id}</h1>
            <div className="flex items-center space-x-4 text-sm text-charcoal-600">
              <span>📍 Neighborhood</span>
              <span>⏰ 8AM - 8PM</span>
              <span>💰 $$</span>
            </div>
          </div>

          {/* Ratings */}
          <div className="bg-white rounded-lg p-4 border border-cream-200">
            <h2 className="text-lg font-semibold text-charcoal-900 mb-4">Ratings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-matcha-600">4.5</div>
                <div className="text-sm text-charcoal-600">Matcha Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-matcha-600">4.2</div>
                <div className="text-sm text-charcoal-600">Overall Experience</div>
              </div>
            </div>
          </div>

          {/* Review */}
          <div className="bg-white rounded-lg p-4 border border-cream-200">
            <h2 className="text-lg font-semibold text-charcoal-900 mb-3">Expert Review</h2>
            <p className="text-charcoal-700 leading-relaxed">
              This is a placeholder review for cafe {id}. The actual review content will describe 
              the matcha quality, atmosphere, service, and overall experience at this location.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button className="flex-1 bg-matcha-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-matcha-600 focus-ring">
              🗺️ Get Directions
            </button>
            <button className="flex-1 bg-white border border-matcha-300 text-matcha-600 py-3 px-4 rounded-lg font-medium hover:bg-matcha-50 focus-ring">
              ✓ Mark as Visited
            </button>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg p-4 border border-cream-200">
            <h2 className="text-lg font-semibold text-charcoal-900 mb-3">Contact & Hours</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-600">Address</span>
                <span className="text-charcoal-900">123 Main St, Toronto</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-600">Phone</span>
                <span className="text-charcoal-900">(416) 123-4567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-600">Website</span>
                <span className="text-matcha-600">cafe-website.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CafeDetailPage