import { Component, type ReactNode } from 'react';

/** Last line of defence: a crash shows a friendly screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[wedding site]', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="screen screen--navy screen--center">
        <h1 className="h2">Oops — something went wrong</h1>
        <p className="screen__text">
          Please reload the page. If you were answering your invitation, open your link again to check your answer was saved.
          <br />
          <br />
          Un problème est survenu. Rechargez la page ; si vous répondiez à l’invitation, rouvrez votre lien pour vérifier votre réponse.
        </p>
        <button type="button" className="btn btn--pink" onClick={() => window.location.reload()}>
          Reload / Recharger
        </button>
      </div>
    );
  }
}
