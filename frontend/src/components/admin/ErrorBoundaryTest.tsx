import React, { useState } from 'react'
import { ComponentErrorBoundary } from './ComponentErrorBoundary'
import { PrimaryButton, SecondaryButton } from '../ui/Button'

/**
 * Test component to demonstrate error boundary functionality in admin
 * This component can be used to manually trigger errors for testing
 */
const ErrorGeneratorComponent: React.FC = () => {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('Test error for error boundary demonstration')
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Error Boundary Test Component</h3>
      <p className="text-sm text-gray-600 mb-4">
        This component demonstrates error boundary functionality. Click the button below to trigger an error.
      </p>
      <SecondaryButton
        onClick={() => setShouldError(true)}
        className="mr-3"
      >
        Trigger Error
      </SecondaryButton>
    </div>
  )
}

export const ErrorBoundaryTest: React.FC = () => {
  const [showTest, setShowTest] = useState(false)

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="font-semibold text-gray-800 mb-2">Error Boundary Testing</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test the error boundary functionality in the admin panel. When you trigger an error,
          it will be caught by the ComponentErrorBoundary and display a user-friendly error message.
        </p>
        <PrimaryButton
          onClick={() => setShowTest(!showTest)}
        >
          {showTest ? 'Hide Test' : 'Show Error Test Component'}
        </PrimaryButton>
      </div>

      {showTest && (
        <ComponentErrorBoundary componentName="Error Test Component">
          <ErrorGeneratorComponent />
        </ComponentErrorBoundary>
      )}
    </div>
  )
}

export default ErrorBoundaryTest