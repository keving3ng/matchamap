import React from 'react'
import { ShoppingBag, Star, TrendingUp } from '@/components/icons'
import { ContentContainer } from './ContentContainer'

interface Product {
  id: string
  name: string
  description: string
  price: string
  image: string
  featured?: boolean
}

export const StorePage: React.FC = () => {
  // Mock products - replace with real data later
  const products: Product[] = [
    {
      id: '1',
      name: 'MatchaMap T-Shirt',
      description: 'Premium cotton tee with our iconic matcha leaf logo',
      price: '$28',
      image: '👕',
      featured: true
    },
    {
      id: '2',
      name: 'Matcha Whisk Set',
      description: 'Traditional bamboo whisk and scoop for perfect matcha at home',
      price: '$35',
      image: '🎋'
    },
    {
      id: '3',
      name: 'Travel Mug',
      description: 'Insulated stainless steel mug, keeps matcha hot for hours',
      price: '$24',
      image: '🥤'
    },
    {
      id: '4',
      name: 'Matcha Bowl (Chawan)',
      description: 'Handcrafted ceramic bowl, perfect for traditional preparation',
      price: '$42',
      image: '🍵'
    },
    {
      id: '5',
      name: 'Toronto Matcha Guide',
      description: 'Digital guidebook with exclusive cafe reviews and tips',
      price: '$12',
      image: '📖'
    },
    {
      id: '6',
      name: 'MatchaMap Sticker Pack',
      description: 'Set of 10 waterproof stickers featuring Toronto landmarks',
      price: '$8',
      image: '✨'
    }
  ]

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Shop</h2>
        <p className="text-sm text-gray-600 mt-1">Matcha essentials and MatchaMap merch</p>
      </div>

      <ContentContainer maxWidth="lg">
        <div className="px-4 py-8">
          {/* Featured Banner */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white mb-8">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} />
              <span className="text-sm font-semibold">Limited Time</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">New Spring Collection</h3>
            <p className="text-green-50 mb-4">
              Fresh designs and essentials for matcha lovers. Free shipping on orders over $50.
            </p>
            <button className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition">
              Shop New Arrivals
            </button>
          </div>

          {/* Products Grid */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">All Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl shadow-md border-2 ${
                    product.featured ? 'border-green-400' : 'border-green-100'
                  } overflow-hidden hover:shadow-lg transition`}
                >
                  {product.featured && (
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 flex items-center gap-1 text-xs font-semibold">
                      <Star size={12} fill="white" />
                      Featured
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                    <span className="text-8xl">{product.image}</span>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h4 className="font-bold text-lg text-gray-800 mb-1">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">{product.price}</span>
                      <button className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md flex items-center gap-2">
                        <ShoppingBag size={16} />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-xl shadow-md border-2 border-green-100 p-4 text-center">
              <div className="text-3xl mb-2">🚚</div>
              <h4 className="font-semibold text-gray-800 mb-1">Free Shipping</h4>
              <p className="text-sm text-gray-600">On orders over $50</p>
            </div>
            <div className="bg-white rounded-xl shadow-md border-2 border-green-100 p-4 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="font-semibold text-gray-800 mb-1">Easy Returns</h4>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
            <div className="bg-white rounded-xl shadow-md border-2 border-green-100 p-4 text-center">
              <div className="text-3xl mb-2">🎁</div>
              <h4 className="font-semibold text-gray-800 mb-1">Gift Wrapping</h4>
              <p className="text-sm text-gray-600">Available at checkout</p>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
            <p className="text-gray-700 font-semibold mb-2">
              🚧 Store Coming Soon
            </p>
            <p className="text-sm text-gray-600">
              We're currently setting up our shop. Check back soon for matcha essentials and exclusive merch!
            </p>
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}

export default StorePage
