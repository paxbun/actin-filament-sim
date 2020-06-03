import React from "react";
import ISimulation, { IStatistics, Vector } from "./Simulation";
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
   * color of subunits with ATP
   */
  atpSubunitColor: string;

  /**
   * color of subunits with ADP
   */
  adpSubunitColor: string;

  /**
   * color of binding domain in subunits
   */
  subunitBindingDomainColor: string;

  /**
   * size of cells in the grid
   */
  cellSize: number;

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

  /**
   * fps
   */
  fps: number;
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

  /**
   * font used by canvas
   */
  private font: string;

  /**
   * true if the mouse is pressed; false otherwise
   */
  private mouseDown: boolean = false;

  public constructor(props: IDisplayProperties) {
    super(props);
    this.state = {
      statistics: [],
      fps: 0,
    };
    this.font = `${Math.round(
      this.props.graphSize * 0.05
    )}px Segoe UI, Tahoma, Geneva, Verdana, sans-serif`;
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
          onMouseDown={() => (this.mouseDown = true)}
          onMouseUp={() => (this.mouseDown = false)}
          onMouseMove={(event) => {
            if (this.mouseDown) {
              this.props.simulation.add(
                this.convertLeftToRight([event.clientX, event.clientY])
              );
            }
          }}
          onClick={(event) => {
            this.props.simulation.add(
              this.convertLeftToRight([event.clientX, event.clientY])
            );
          }}
        />
        <div className="display-ui-wrapper">
          <div
            className="display-ui display-ui-graph"
            style={{ width: this.props.graphSize + 10 }}
          >
            <div>FPS: {this.state.fps}</div>
          </div>
          <br />
          <div
            className="display-ui display-ui-graph"
            style={{ width: this.props.graphSize + 10 }}
          >
            <span>Number of subunits with ATP or ADP</span>
            <canvas
              width={this.props.graphSize}
              height={this.props.graphSize}
              ref={this.atpGraphCanvasRef}
            />
          </div>
          <br />
          <div
            className="display-ui display-ui-graph"
            style={{ width: this.props.graphSize + 10 }}
          >
            <span>Number of Filaments by Length</span>
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
    const interval = (newPoint - this.lastPoint) / 1000;
    const fps = Math.round(1 / interval);
    this.setState({
      fps: fps,
    });
    this.props.simulation.precede(interval);
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
        ctx.clearRect(0, 0, this.props.width, this.props.height);
        // Draw grid
        this.drawGrid(ctx);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        for (const subunit of current) {
          const [x, y] = this.convertRightToLeft(subunit.pos);
          if (isNaN(x) || isNaN(y)) {
            continue;
          }
          const xx = radius * Math.cos(subunit.orientation);
          const yy = radius * Math.sin(subunit.orientation);
          ctx.beginPath();
          const grad = ctx.createLinearGradient(x - xx, y - yy, x + xx, y + yy);
          grad.addColorStop(
            0,
            subunit.hasAtp
              ? this.props.atpSubunitColor
              : this.props.adpSubunitColor
          );
          // if (subunit.isPlusEnd) {
          //   grad.addColorStop(1, "blue");
          // } else if (subunit.isMinusEnd) {
          //   grad.addColorStop(1, "green");
          // } else
          
          {
            grad.addColorStop(1, this.props.subunitBindingDomainColor);
          }
          ctx.fillStyle = grad;

          // ctx.fillStyle = subunit.hasAtp
          //   ? this.props.atpSubunitColor
          //   : this.props.adpSubunitColor;
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }

  /**
   * draws the grid
   * @param ctx canvas to draw graph on
   */
  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const width = this.props.width;
    const height = this.props.height;
    const center = this.convertRightToLeft([0, 0]);
    const xMinus = this.convertRightToLeft([-width / 2, 0]);
    const xPlus = this.convertRightToLeft([width / 2, 0]);
    const yMinus = this.convertRightToLeft([0, -height / 2]);
    const yPlus = this.convertRightToLeft([0, height / 2]);
    // Draw axes
    ctx.lineWidth = 3;
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    ctx.lineTo(...xMinus);
    ctx.lineTo(...xPlus);
    ctx.stroke();
    ctx.beginPath();
    ctx.lineTo(...yMinus);
    ctx.lineTo(...yPlus);
    ctx.stroke();

    ctx.lineWidth = 0.5;

    let x = 0;
    while (x < width / 2) {
      ctx.beginPath();
      ctx.lineTo(center[0] + x, yMinus[1]);
      ctx.lineTo(center[0] + x, yPlus[1]);
      ctx.stroke();
      ctx.beginPath();
      ctx.lineTo(center[0] - x, yMinus[1]);
      ctx.lineTo(center[0] - x, yPlus[1]);
      ctx.stroke();
      x += this.props.cellSize;
    }

    let y = 0;
    while (y < height / 2) {
      ctx.beginPath();
      ctx.lineTo(xMinus[0], center[1] + y);
      ctx.lineTo(xPlus[0], center[1] + y);
      ctx.stroke();
      ctx.beginPath();
      ctx.lineTo(xMinus[0], center[1] - y);
      ctx.lineTo(xPlus[0], center[1] - y);
      ctx.stroke();
      y += this.props.cellSize;
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
        ctx.lineWidth = 1;

        // Draw texts
        ctx.font = `normal bold ${this.font}`;
        ctx.textAlign = "left";
        ctx.fillStyle = this.props.atpSubunitColor;
        ctx.fillText("ATP", rel(0.14), rel(0.97));
        ctx.fillStyle = this.props.adpSubunitColor;
        ctx.fillText("ADP", rel(0.25), rel(0.97));

        if (this.state.statistics.length !== 0) {
          const maxHeight = this.state.statistics.reduce(
            (prev: number, curr: IStatistics) => {
              return Math.max(prev, curr.numberWithAtp, curr.numberWithAdp);
            },
            10
          );
          const lineTo = (value: number, idx: number): void => {
            ctx.lineTo(
              rel(0.1) +
                (rel(0.8) * idx) / (this.props.reserveStatisticsFor - 1),
              rel(0.9) - (rel(0.7) * value) / maxHeight
            );
          };
          // Draw the graph of the number of subunits with ATP
          ctx.beginPath();
          this.state.statistics
            .map((value) => value.numberWithAtp)
            .forEach(lineTo);
          ctx.strokeStyle = this.props.atpSubunitColor;
          ctx.stroke();
          // Draw the graph of the number of subunits with ADP
          ctx.beginPath();
          this.state.statistics
            .map((value) => value.numberWithAdp)
            .forEach(lineTo);
          ctx.strokeStyle = this.props.adpSubunitColor;
          ctx.stroke();
          this.drawMaxValue(maxHeight, ctx);
        } else {
          this.drawMaxValue(10, ctx);
        }
        this.drawGraphBox(ctx);
      }
    }
  }

  /**
   * draws the graph of number of filaments by length
   */
  private drawLengthGraph(): void {
    const c = this.lengthGraphCanvasRef.current;
    const size = this.props.graphSize;
    const rel = (ratio: number) => size * ratio;
    if (c) {
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        if (this.state.statistics.length !== 0) {
          const curr = this.state.statistics[this.state.statistics.length - 1]
            .numberByLength;
          if (curr.size !== 0) {
            const keys = Array.from(curr.keys());
            const maxNumber = keys.reduce(
              (prev: number, key: number) =>
                Math.max(prev, curr.get(key) as number),
              10
            );
            const maxLength = Math.max(...keys);
            const minLength = Math.min(...keys);
            const domainSize = maxLength - minLength + 1;
            const fillRect = (keyValue: [number, number]): void => {
              const [length, number] = keyValue;
              const width = rel(0.8) / domainSize;
              const height = (rel(0.7) * number) / maxNumber;
              const x = rel(0.1) + (length - minLength) * width;
              ctx.fillRect(
                x + 0.1 * width,
                rel(0.9) - height,
                width * 0.8,
                height
              );
              ctx.textAlign = "center";
              ctx.fillText(length.toString(), x + 0.5 * width, rel(0.97));
            };

            ctx.fillStyle = this.props.subunitBindingDomainColor;
            keys
              .map((key) => [key, curr.get(key) as number] as [number, number])
              .forEach(fillRect);

            this.drawMaxValue(maxNumber, ctx);
          } else {
            this.drawMaxValue(10, ctx);
          }
        } else {
          this.drawMaxValue(10, ctx);
        }
        this.drawGraphBox(ctx);
      }
    }
  }

  /**
   * draws graph axis
   * @param ctx canvas to draw graph on
   */
  private drawGraphBox(ctx: CanvasRenderingContext2D) {
    const rel = (ratio: number) => this.props.graphSize * ratio;
    ctx.beginPath();
    ctx.moveTo(rel(0.1), rel(0.1));
    ctx.lineTo(rel(0.1), rel(0.9));
    ctx.lineTo(rel(0.9), rel(0.9));
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.lineTo(rel(0.1), rel(0.2));
    ctx.lineTo(rel(0.9), rel(0.2));
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * draws the given value
   * @param maxValue value to draw
   * @param ctx canvas to draw the value on
   */
  private drawMaxValue(maxValue: number, ctx: CanvasRenderingContext2D) {
    const rel = (ratio: number) => this.props.graphSize * ratio;
    ctx.font = this.font;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText(Math.floor(maxValue).toString(), rel(0.88), rel(0.18));
  }

  /**
   * Retrieve statistics from the simulation implementation
   */
  private updateGraphs(): void {
    const statistics = this.state.statistics;
    statistics.push(this.props.simulation.getCurrentStatistics());
    if (statistics.length > this.props.reserveStatisticsFor) {
      statistics.splice(0, 1);
    }
  }

  /**
   * converts vector of left-handed coordinate system to vector of right-handed coordinate system
   * @param left vector of left-handed coordinate system
   */
  private convertLeftToRight(left: Vector): Vector {
    const width = this.props.width;
    const height = this.props.height;
    let [x, y] = left;
    x -= width / 2;
    y -= height / 2;
    y *= -1;
    return [x, y];
  }

  /**
   * converts vector of right-handed coordinate system to vector of left-handed coordinate system
   * @param right vector of right-handed coordinate system
   */
  private convertRightToLeft(right: Vector): Vector {
    const width = this.props.width;
    const height = this.props.height;
    let [x, y] = right;
    x += width / 2;
    y *= -1;
    y += height / 2;
    return [x, y];
  }
}
