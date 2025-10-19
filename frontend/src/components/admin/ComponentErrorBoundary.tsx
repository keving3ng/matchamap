import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Copy } from '@/components/icons'
import { SecondaryButton, TertiaryButton } from '../ui/Button'
import { COPY } from '../../constants/copy'

interface Props {
  children: ReactNode
  componentName?: string
  fallbackClassName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ComponentErrorBoundary - Lightweight error boundary for individual admin components
 * Provides inline error display without taking over the entire page
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with component context
    console.error(`Component Error in ${this.props.componentName || 'Unknown Component'}:`, {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href
    })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  handleCopyError = async () => {
    const { error } = this.state
    const { componentName } = this.props
    
    const errorReport = `Component Error Report
Component: ${componentName || 'Unknown'}
Time: ${new Date().toISOString()}
URL: ${window.location.href}

Error: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}
`

    try {
      await navigator.clipboard.writeText(errorReport)
      console.log('Error report copied to clipboard')
    } catch (err) {
      console.warn('Failed to copy error report:', err)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`bg-white rounded-lg border border-red-200 p-6 ${this.props.fallbackClassName || ''}`}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">
                {this.props.componentName ? COPY.admin.errorBoundary.componentError(this.props.componentName) : 'Component Error'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {COPY.admin.errorBoundary.componentErrorDescription}
              </p>
              
              <div className="text-xs text-gray-500 bg-red-50 p-3 rounded-lg mb-4 font-mono">
                {this.state.error?.message || 'Unknown error occurred'}
              </div>
              
              <div className="flex gap-3">
                <SecondaryButton
                  onClick={this.handleRetry}
                  icon={RefreshCw}
                  className="text-sm py-2 px-4"
                >
                  {COPY.admin.errorBoundary.tryAgain}
                </SecondaryButton>
                
                <TertiaryButton
                  onClick={this.handleCopyError}
                  icon={Copy}
                  className="text-sm py-2 px-4"
                >
                  {COPY.admin.errorBoundary.copyReport}
                </TertiaryButton>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ComponentErrorBoundary