import React from 'react'
import AdminLayout from './admin/AdminLayout'
import FeatureTogglesPage from './admin/FeatureTogglesPage'

export const AdminPage: React.FC = () => {
  return (
    <AdminLayout>
      <FeatureTogglesPage />
    </AdminLayout>
  )
}

export default AdminPage
