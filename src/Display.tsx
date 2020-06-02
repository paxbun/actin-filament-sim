import React from "react";
import ISimulation, { IStatistics } from "./Simulation";
import "./Display.scss";

/**
 * properties used by `Display`
 */
export interface IDisplayProperties {
  /**
   *
   */
  simulation: ISimulation;

  /**
   * the width of the display
   */
  width: number;

  /**
   * the height of the display
   */
  height: number;

  /**
   * invoked when the user pressed the `reset` button
   */
  onReset: () => void;
}

/**
 * state used by `Display`
 */
export interface IDisplayState {
  /**
   * Statistics retrieved within the last 20 seconds
   */
  statistics: IStatistics[];
}

/**
 * displays the current state of the simulation
 */
export default class Display extends React.Component<
  IDisplayProperties,
  IDisplayState
> {
  /**
   * function handler returned by `window.setInterval`; used to update the canvas
   */
  private ticker: number = 0;

  /**
   * function handler returned by `window.setInterval`; used to update the graphs
   */
  private statisticsTicker: number = 0;

  /**
   * the last time when `this.props.simulation.precede` was called
   */
  private lastPoint: number = Date.now();

  /**
   * the canvas to draw
   */
  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

  public constructor(props: IDisplayProperties) {
    super(props);
    this.state = {
      statistics: [],
    };
  }

  public componentDidMount() {
    this.lastPoint = Date.now();
    this.ticker = window.setInterval(() => {
      this.tick();
      this.draw();
    }, 1000 / 60);
    this.statisticsTicker = window.setInterval(() => {
      this.updateGraphs();
    }, 1000);
  }

  public componentWillUnmount() {
    window.clearInterval(this.ticker);
    window.clearInterval(this.statisticsTicker);
    this.ticker = 0;
  }

  public render() {
    return (
      <div
        style={{
          position: "relative",
          display: "inline-block",
          width: `${this.props.width}px`,
          height: `${this.props.height}px`,
        }}
      >
        <canvas
          ref={this.canvasRef}
          width={this.props.width}
          height={this.props.height}
          style={{
            left: "0px",
            top: "0px",
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
          onClick={(event) => {
            this.props.simulation.add([event.clientX, event.clientY]);
          }}
        />
        <div
          className="display-ui display-ui-btn"
          style={{
            position: "absolute",
            left: "20px",
            top: "20px",
            color: "white",
          }}
          onClick={(event) => {
            this.setState({
              statistics: []
            });
            this.props.onReset();
          }}
        >
          Reset
        </div>
      </div>
    );
  }

  /**
   * calculates the next state
   */
  private tick(): void {
    const newPoint = Date.now();
    this.props.simulation.precede((newPoint - this.lastPoint) / 1000);
    this.lastPoint = newPoint;
  }

  /**
   * draws the current state
   */
  private draw(): void {
    const current = this.props.simulation.getCurrentState();
    const radius = this.props.simulation.getRadius();
    const c = this.canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.globalCompositeOperation = "destination-over";
        ctx.clearRect(0, 0, this.props.width, this.props.height);
        for (const subunit of current) {
          const [x, y] = subunit.pos;
          const cos = radius * Math.cos(subunit.orientation);
          const sin = radius * Math.sin(subunit.orientation);
          ctx.beginPath();
          const grad = ctx.createLinearGradient(
            x - cos,
            y - sin,
            x + cos,
            y + sin
          );
          grad.addColorStop(0, "red");
          grad.addColorStop(1, "yellow");
          ctx.fillStyle = grad;
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }

  /**
   * Retrieve
   */
  private updateGraphs(): void {
    const statistics = this.state.statistics;
    statistics.push(this.props.simulation.getCurrentStatistics());
    if (statistics.length > 20) {
      statistics.splice(0, 1);
    }
    console.log(statistics);
  }
}
