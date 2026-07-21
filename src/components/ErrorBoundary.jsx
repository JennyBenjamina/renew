import { Component } from 'react'

/** Catches render errors in its subtree and shows a recoverable fallback
 *  instead of a blank white screen. Reset it by changing `resetKey`
 *  (e.g. the route path) so navigating away clears the error. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Render error caught by ErrorBoundary:', error, info)
  }

  componentDidUpdate(prevProps) {
    // Clear the error when the reset key changes (route navigation).
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="errbox">
          <h2>Something went wrong loading this page.</h2>
          <p>Please try again.</p>
          <button
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
