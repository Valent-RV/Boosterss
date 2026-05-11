import React from "react";
import { Link } from "react-router-dom";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Помилка рендерингу Taskero", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="screen-loader">
          <div className="surface-card not-found__card">
            <span className="badge badge--soft">Режим відновлення</span>
            <h1>У застосунку сталася помилка</h1>
            <p>
              Під час рендерингу сталася помилка, але цей екран не дає застосунку залишитися порожнім.
              Оновіть сторінку або поверніться на головну, щоб продовжити.
            </p>
            <Link className="button button--primary" to="/">
              На головну
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
