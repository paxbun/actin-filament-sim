import React from "react";
import ISimulation from "./Simulation";
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
}

/**
 * displays the current state of the simulation
 */
export default class Display extends React.Component<IDisplayProperties> {
  /**
   * the function handler returned by `window.setInterval`
   */
  private ticker: number = 0;

  /**
   * the last time when `this.props.simulation.precede` was called
   */
  private lastPoint: number = Date.now();

  /**
   * teh canvas to draw
   */
  private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

  public componentDidMount() {
    this.lastPoint = Date.now();
    this.ticker = window.setInterval(() => {
      this.tick();
      this.draw();
    }, 1000 / 60);
  }

  public componentWillUnmount() {
    window.clearInterval(this.ticker);
    this.ticker = 0;
  }

  public render() {
    return (
      <canvas
        className="display"
        ref={this.canvasRef}
        width={this.props.width}
        height={this.props.height}
        style={{
          width: `${this.props.width}px`,
          height: `${this.props.height}px`
        }}
        onClick={(event) => {
          this.props.simulation.add([event.clientX, event.clientY])
        }}
      ></canvas>
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
    const c = this.canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      ctx?.clearRect(0, 0, 1920, 1080);
      if (ctx) {
        for (const subunit of current) {
          const [x, y] = subunit.pos;
          ctx.beginPath();
          const grad = ctx.createLinearGradient(x - 20, y - 20, x + 20, y + 20);
          grad.addColorStop(0, "red");
          grad.addColorStop(1, "yellow");
          ctx.fillStyle = grad;
          ctx.arc(x, y, 20, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }
}
