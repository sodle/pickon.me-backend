import React from "react";
import { Route, Redirect } from "react-router-dom";

interface IPrivateRouteParams {
  component: typeof React.Component,
  authenticated: boolean,
  exact?: boolean | undefined,
  path: string
}

export default function PrivateRoute({
  component: Component,
  authenticated,
  ...rest
}: IPrivateRouteParams) {
  return (
    <Route
      {...rest}
      render={props =>
        authenticated === true ? (
          <Component {...props} {...rest} />
        ) : (
          <Redirect to={{
            pathname: `/login`,
            search: `?next=${props.location.pathname + props.location.search + props.location.hash}`
          }} />
        )
      }
    />
  );
}