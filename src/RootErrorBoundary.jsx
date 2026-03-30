import { Component } from 'react'

export class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="moni-error-boundary">
          <h1 className="moni-error-boundary__title">Algo salió mal</h1>
          <p className="moni-error-boundary__text">
            Recargá la página. Si el problema sigue, revisá la consola del
            navegador.
          </p>
          <pre className="moni-error-boundary__pre">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
