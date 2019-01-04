import React from "react";
import { Route, Redirect } from "react-router-dom";
import { exact } from "prop-types";

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
          <Redirect to="/login" />
        )
      }
    />
  );
}