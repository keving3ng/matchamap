function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-cream-200 px-4 py-4 md:px-6 sticky top-0 md:top-16 z-40">
        <h1 className="text-xl font-bold text-matcha-600">About MatchaMap</h1>
        <p className="text-sm text-charcoal-600 mt-1">Your guide to Toronto's matcha scene</p>
      </div>

      <div className="px-4 py-6 md:px-6 max-w-4xl mx-auto space-y-6">
        {/* Mission */}
        <div className="bg-white rounded-lg border border-cream-200 p-6 text-center">
          <div className="text-4xl mb-4">🍵</div>
          <h2 className="text-xl font-bold text-charcoal-900 mb-3">Our Mission</h2>
          <p className="text-charcoal-700 leading-relaxed">
            MatchaMap curates Toronto's finest matcha cafes, helping you discover authentic 
            Japanese tea culture throughout the city. We focus on quality over quantity, 
            providing expert reviews and location-based discovery.
          </p>
        </div>

        {/* Rating System */}
        <div className="bg-white rounded-lg border border-cream-200 p-6">
          <h2 className="text-xl font-bold text-charcoal-900 mb-4">How We Rate</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🍃</span>
              <div>
                <h3 className="font-semibold text-charcoal-900">Matcha Quality (Primary Score)</h3>
                <p className="text-sm text-charcoal-600">
                  Authenticity, preparation method, taste, and sourcing of matcha
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="font-semibold text-charcoal-900">Overall Experience (Secondary Score)</h3>
                <p className="text-sm text-charcoal-600">
                  Atmosphere, service, menu variety, and value for money
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg border border-cream-200 p-6">
          <h2 className="text-xl font-bold text-charcoal-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 mb-2">How often do you update the map?</h3>
              <p className="text-charcoal-700 text-sm">
                We update cafe information weekly, including new locations, menu changes, and hours.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Can I suggest a cafe to be reviewed?</h3>
              <p className="text-charcoal-700 text-sm">
                Absolutely! Send us suggestions and we'll prioritize them for upcoming reviews.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-900 mb-2">Do you plan to expand beyond Toronto?</h3>
              <p className="text-charcoal-700 text-sm">
                We're focusing on perfecting the Toronto experience first, but have plans for other cities in the future.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg border border-cream-200 p-6">
          <h2 className="text-xl font-bold text-charcoal-900 mb-4">Get in Touch</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="font-medium text-charcoal-900">Email</p>
                <p className="text-sm text-matcha-600">hello@matchamap.ca</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xl">📱</span>
              <div>
                <p className="font-medium text-charcoal-900">Social Media</p>
                <p className="text-sm text-matcha-600">@MatchaMapTO</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="font-medium text-charcoal-900">Suggestions</p>
                <p className="text-sm text-charcoal-600">We'd love to hear about new cafes to review!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="bg-matcha-50 border border-matcha-200 rounded-lg p-4 text-center">
          <p className="text-sm text-matcha-700">
            Made with 🍵 for Toronto's matcha community
          </p>
          <p className="text-xs text-matcha-600 mt-1">
            © 2024 MatchaMap. Built with React + Vite + Tailwind
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage