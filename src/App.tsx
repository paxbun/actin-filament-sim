import React from "react";
import Display from "./Display";
import ActinSimulation from "./ActinSimulation";
import ISimulation from "./Simulation";
import "./App.scss";

/**
 * state used by `App`
 */
export interface IAppState {
  /**
   * the implementation of the simulation
   */
  simulation: ISimulation;

  /**
   * the width of the window
   */
  width: number;

  /**
   * the height of the window
   */
  height: number;
}

export default class App extends React.Component<{}, IAppState> {
  
  public constructor(props: {}) {
    super(props);
    this.state = {
      simulation: new ActinSimulation(),
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  public render() {
    return (
      <div className="app">
        <Display
          simulation={this.state.simulation}
          width={this.state.width}
          height={this.state.height}
          graphSize={Math.min(this.state.width - 90, 250)}
          reserveStatisticsFor={8}
          atpSubunitColor="red"
          adpSubunitColor="#ff6a4d"
          subunitBindingDomainColor="#ffd17d"
          // subunitBindingDomainColor="black"
          cellSize={40}
          onReset={() => {
            this.setState({
              simulation: new ActinSimulation()
            });
          }}
        />
      </div>
    );
  }

  public componentDidMount() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  public componentWillUnmount() {
    window.removeEventListener("resize", this.resize.bind(this));
  }

  private resize() {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }
}
