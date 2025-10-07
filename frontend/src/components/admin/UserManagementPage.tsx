import React, { useState, useEffect } from 'react'
import { Users, Search, Filter, Trash2, Shield, Mail, CheckCircle, XCircle, Eye, MoreVertical } from 'lucide-react'
import { api, type AdminUserListItem, type AdminUserStats } from '../../utils/api'
import { useAuthStore } from '../../stores/authStore'
import { UserDetailModal } from './UserDetailModal'

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [stats, setStats] = useState<AdminUserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [viewingUserId, setViewingUserId] = useState<number | null>(null)

  // Fetch users and stats
  useEffect(() => {
    fetchData()
  }, [searchTerm, roleFilter])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, statsData] = await Promise.all([
        api.userAdmin.listUsers({
          limit: 100,
          search: searchTerm || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
        }),
        api.userAdmin.getStats(),
      ])
      setUsers(usersData.users)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: number, newRole: 'admin' | 'user') => {
    setOpenMenuId(null) // Close menu
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    try {
      await api.userAdmin.updateUserRole(userId, newRole)
      await fetchData() // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user role')
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    setOpenMenuId(null) // Close menu
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.userAdmin.deleteUser(userId)
      await fetchData() // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  const handleViewUser = (userId: number) => {
    setViewingUserId(userId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatLastActive = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(dateString)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-green-800 mb-2 flex items-center gap-2">
                <Users size={28} />
                User Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Manage user accounts, roles, and permissions
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search users by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition ${
                showFilters ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    roleFilter === 'all'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    roleFilter === 'admin'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Admins Only
                </button>
                <button
                  onClick={() => setRoleFilter('user')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    roleFilter === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Regular Users
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admin Users</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.adminUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active This Week</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.activeThisWeek}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.newThisMonth}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* User List */}
        {!loading && !error && (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.displayName
                            ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
                            : user.username.substring(0, 2).toUpperCase()
                          }
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {user.displayName || user.username}
                            {user.isEmailVerified && (
                              <CheckCircle className="inline ml-1 text-green-500" size={16} />
                            )}
                            {!user.isEmailVerified && (
                              <XCircle className="inline ml-1 text-gray-400" size={16} />
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">@{user.username} • {user.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 ml-[52px]">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                        <span className="text-xs">
                          {user.totalCheckins} check-ins • {user.totalReviews} reviews
                        </span>
                        <span className="text-xs">
                          Joined: {formatDate(user.createdAt)}
                        </span>
                        <span className="text-xs">
                          Last active: {formatLastActive(user.lastActiveAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Primary action: View */}
                      <button
                        onClick={() => handleViewUser(user.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      {/* Show "Your Account" badge if it's you */}
                      {user.id === currentUser?.id ? (
                        <div className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                          Your Account
                        </div>
                      ) : (
                        /* Actions menu for other users */
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-lg transition"
                            aria-label="More actions"
                          >
                            <MoreVertical size={20} className="text-gray-600" />
                          </button>

                          {/* Dropdown menu */}
                          {openMenuId === user.id && (
                            <>
                              {/* Backdrop to close menu when clicking outside */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />

                              {/* Menu */}
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                {/* Promote/Demote */}
                                <button
                                  onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition"
                                >
                                  <Shield size={16} className={user.role === 'admin' ? 'text-gray-600' : 'text-blue-600'} />
                                  <span className="text-sm">
                                    {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                  </span>
                                </button>

                                {/* Divider */}
                                <div className="border-t border-gray-200 my-1" />

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 transition text-red-600"
                                >
                                  <Trash2 size={16} />
                                  <span className="text-sm">Delete User</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {viewingUserId && (
        <UserDetailModal
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
        />
      )}
    </div>
  )
}

export default UserManagementPage
