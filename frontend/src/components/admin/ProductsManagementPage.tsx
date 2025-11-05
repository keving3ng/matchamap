import React from 'react'
import { Package, Plus, Search, Edit, Trash2, AlertCircle, DollarSign, ExternalLink } from '@/components/icons'

export const ProductsManagementPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Not Implemented Banner */}
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={24} className="text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-800">Not Yet Implemented</h3>
            <p className="text-sm text-yellow-700">This page is a visual mockup. Backend integration coming soon.</p>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-xs p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2 flex items-center gap-2">
                <Package size={28} />
                Products Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Manage matcha products, merchandise, and affiliate links
              </p>
            </div>

            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition">
              <Plus size={20} />
              Add Product
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-xs p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-800">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xs p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-800">$28</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xs p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ExternalLink size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Affiliate Links</p>
                <p className="text-2xl font-bold text-gray-800">12</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {[
            { name: 'Premium Ceremonial Matcha', brand: 'Ippodo Tea', price: '$32', type: 'Matcha Powder', stock: 'In Stock' },
            { name: 'Bamboo Whisk (Chasen)', brand: 'Artisan Tools', price: '$18', type: 'Accessories', stock: 'In Stock' },
            { name: 'Matcha Bowl Set', brand: 'Traditional Ceramics', price: '$45', type: 'Accessories', stock: 'Low Stock' },
          ].map((product, i) => (
            <div key={i} className="bg-white rounded-lg shadow-xs p-4 hover:shadow-xs transition">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Product Image Placeholder */}
                <div className="w-full md:w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={32} className="text-green-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.brand}</p>
                    </div>
                    <span className="text-lg font-bold text-green-600">{product.price}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {product.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      product.stock === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {product.stock}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    <Edit size={16} />
                    Edit
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductsManagementPage
