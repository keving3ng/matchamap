import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft, Copy, ExternalLink, Bug } from '@/components/icons'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton, TertiaryButton } from '../ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showErrorDetails: boolean
}

interface ErrorFallbackUIProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onRetry: () => void
  onGoBack: () => void
  onShowDetails: () => void
  onReportIssue: () => void
  showDetails: boolean
}

/**
 * ErrorFallbackUI - User-friendly error display component
 * Matches admin panel aesthetic with recovery options
 */
const ErrorFallbackUI: React.FC<ErrorFallbackUIProps> = ({
  error,
  errorInfo,
  onRetry,
  onGoBack,
  onShowDetails,
  onReportIssue,
  showDetails
}) => {
  const errorMessage = error?.message || 'An unexpected error occurred'
  const errorStack = error?.stack || 'No stack trace available'
  const componentStack = errorInfo?.componentStack || 'No component stack available'

  const formatErrorForCopy = () => {
    const timestamp = new Date().toISOString()
    const userAgent = navigator.userAgent
    const url = window.location.href
    
    return `MatchaMap Admin Error Report
Generated: ${timestamp}
URL: ${url}
User Agent: ${userAgent}

Error Message: ${errorMessage}

Stack Trace:
${errorStack}

Component Stack:
${componentStack}

Additional Context:
- User was in admin panel
- Error boundary caught the error and prevented app crash
`
  }

  const copyErrorToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatErrorForCopy())
      // You could add a toast notification here if available
    } catch (err) {
      console.warn('Failed to copy error details to clipboard:', err)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-green-50 to-green-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Error Icon and Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {COPY.admin.errorBoundary.title}
          </h1>
          <p className="text-gray-600">
            {COPY.admin.errorBoundary.description}
          </p>
        </div>

        {/* Error Message Card */}
        <div className="bg-white rounded-lg shadow-xs p-6 border border-red-200">
          <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Bug size={18} className="text-red-600" />
            Error Details
          </h2>
          <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg font-mono">
            {errorMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <PrimaryButton
            onClick={onRetry}
            icon={RefreshCw}
            className="flex-1"
          >
            {COPY.admin.errorBoundary.tryAgain}
          </PrimaryButton>
          
          <SecondaryButton
            onClick={onGoBack}
            icon={ArrowLeft}
            className="flex-1"
          >
            {COPY.admin.errorBoundary.goBack}
          </SecondaryButton>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <TertiaryButton
            onClick={onShowDetails}
            className="flex-1"
          >
            {showDetails ? COPY.admin.errorBoundary.hideDetails : COPY.admin.errorBoundary.showDetails}
          </TertiaryButton>
          
          <TertiaryButton
            onClick={onReportIssue}
            icon={Copy}
            className="flex-1"
          >
            {COPY.admin.errorBoundary.copyReport}
          </TertiaryButton>
        </div>

        {/* Technical Details (Collapsible) */}
        {showDetails && (
          <div className="bg-white rounded-lg shadow-xs p-6 border">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ExternalLink size={18} />
              Technical Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Stack Trace:</h4>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto border font-mono text-gray-800">
                  {errorStack}
                </pre>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Component Stack:</h4>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto border font-mono text-gray-800">
                  {componentStack}
                </pre>
              </div>

              <div className="pt-2">
                <TertiaryButton
                  onClick={copyErrorToClipboard}
                  icon={Copy}
                  fullWidth
                >
                  {COPY.admin.errorBoundary.copyReport}
                </TertiaryButton>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          <p>
            {COPY.admin.errorBoundary.helpText}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * AdminErrorBoundary - React error boundary for admin pages
 * Catches JavaScript errors in admin components and displays user-friendly fallback UI
 */
export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console with full details for debugging
    console.error('Admin Error Boundary caught an error:', {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })

    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // In a real app, you might want to log this to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleRetry = () => {
    // Reset error state to try rendering the component again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false
    })
  }

  handleGoBack = () => {
    // Navigate back or to admin root
    window.history.back()
  }

  handleShowDetails = () => {
    this.setState(prevState => ({
      showErrorDetails: !prevState.showErrorDetails
    }))
  }

  handleReportIssue = () => {
    // Copy error details to clipboard
    const { error, errorInfo } = this.state
    
    const timestamp = new Date().toISOString()
    const userAgent = navigator.userAgent
    const url = window.location.href
    
    const errorReport = `MatchaMap Admin Error Report
Generated: ${timestamp}
URL: ${url}
User Agent: ${userAgent}

Error Message: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

Additional Context:
- User was in admin panel
- Error boundary caught the error and prevented app crash
`

    navigator.clipboard.writeText(errorReport).then(() => {
      // Show success feedback - you could add a toast here
      console.log('Error report copied to clipboard')
    }).catch(err => {
      console.warn('Failed to copy error report:', err)
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoBack={this.handleGoBack}
          onShowDetails={this.handleShowDetails}
          onReportIssue={this.handleReportIssue}
          showDetails={this.state.showErrorDetails}
        />
      )
    }

    return this.props.children
  }
}

export default AdminErrorBoundary