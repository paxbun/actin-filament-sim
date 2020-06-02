import React from "react";
import "./Button.scss";

/**
 * properties used by `Button`
 */
export interface IButtonProperties {
  /**
   * invoked when the button is clicked
   */
  onClick: () => void;
}

/**
 * represents a button
 */
export default class Button extends React.Component<IButtonProperties> {
  public render() {
    return (
      <div className="display-ui display-ui-btn" onClick={this.props.onClick}>
        {this.props.children}
      </div>
    );
  }
}
