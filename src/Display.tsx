import React from "react";
import ISimulation, { IStatistics } from "./Simulation";
import "./Display.scss";
import Button from "./Button";

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
   * the width and the height of the graphs
   */
  graphSize: number;

  /**
   * Number of seconds where statistics are reserved
   */
  reserveStatisticsFor: number;

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
   * Statistics retrieved within the last few seconds
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
   * the canvas to draw subunits
   */
  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

  /**
   * the canvas to draw graph of number of subunits
   */
  private atpGraphCanvasRef: React.RefObject<
    HTMLCanvasElement
  > = React.createRef();

  /**
   * the canvas to draw graph of number of filaments by length
   */
  private lengthGraphCanvasRef: React.RefObject<
    HTMLCanvasElement
  > = React.createRef();

  public constructor(props: IDisplayProperties) {
    super(props);
    this.state = {
      statistics: [],
    };
  }

  public componentDidMount() {
    this.lastPoint = Date.now();
    this.draw();
    this.ticker = window.setInterval(() => this.tick(), 1000 / 60);
    this.statisticsTicker = window.setInterval(() => this.updateGraphs(), 1000);
  }

  public componentWillUnmount() {
    window.clearInterval(this.ticker);
    window.clearInterval(this.statisticsTicker);
    this.ticker = 0;
  }

  public render() {
    return (
      <div
        className="display"
        style={{
          width: `${this.props.width}px`,
          height: `${this.props.height}px`,
        }}
      >
        <canvas
          ref={this.canvasRef}
          width={this.props.width}
          height={this.props.height}
          style={{
            position: "absolute",
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
        <div className="display-ui-wrapper">
          <div className="display-ui">
            <canvas
              width={this.props.graphSize}
              height={this.props.graphSize}
              ref={this.atpGraphCanvasRef}
            />
          </div>
          <br />
          <div className="display-ui">
            <canvas
              width={this.props.graphSize}
              height={this.props.graphSize}
              ref={this.lengthGraphCanvasRef}
            />
          </div>
          <br />
          <Button
            onClick={() => {
              this.setState({
                statistics: [],
              });
              this.props.onReset();
            }}
          >
            Reset
          </Button>
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
    this.drawSubunits();
    this.drawAtpGraph();
    this.drawLengthGraph();
    window.requestAnimationFrame(() => this.draw());
  }

  /**
   * draws the subunits
   */
  private drawSubunits(): void {
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
          if (subunit.hasAtp) {
            grad.addColorStop(0, "red");
          } else {
            grad.addColorStop(0, "#ff6a4d");
          }
          grad.addColorStop(1, "#ffd17d");
          ctx.fillStyle = grad;
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }

  /**
   * draws the graph of number of subunits
   */
  private drawAtpGraph(): void {
    const c = this.atpGraphCanvasRef.current;
    const size = this.props.graphSize;
    const rel = (ratio: number) => size * ratio;
    if (c) {
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.moveTo(rel(0.1), rel(0.1));
        ctx.lineTo(rel(0.1), rel(0.9));
        ctx.lineTo(rel(0.9), rel(0.9));
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.stroke();
        if (this.state.statistics.length !== 0) {
          const maxHeight = this.state.statistics.reduce(
            (prev: number, curr: IStatistics) => {
              return Math.max(prev, curr.numberWithAtp, curr.numberWithAdp);
            },
            0
          );
          const lineTo = (value: number, idx: number): void => {
            ctx.lineTo(
              rel(0.1) +
                (rel(0.8) * idx) / (this.props.reserveStatisticsFor - 1),
              rel(0.9) - (rel(0.7) * value) / maxHeight
            );
          };
          ctx.beginPath();
          this.state.statistics
            .map((value) => value.numberWithAtp)
            .forEach(lineTo);
          ctx.strokeStyle = "red";
          ctx.stroke();
          ctx.beginPath();
          this.state.statistics
            .map((value) => value.numberWithAdp)
            .forEach(lineTo);
          ctx.strokeStyle = "#ff6a4d";
          ctx.stroke();
        }
      }
    }
  }

  /**
   * draws the graph of number of filaments by length
   */
  private drawLengthGraph(): void {}
  /**
   * Retrieve
   */
  private updateGraphs(): void {
    const statistics = this.state.statistics;
    statistics.push(this.props.simulation.getCurrentStatistics());
    if (statistics.length > this.props.reserveStatisticsFor) {
      statistics.splice(0, 1);
    }
  }
}
