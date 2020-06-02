import { IActin, Vector } from "./Simulation";
import { Engine, Bodies, Body, World } from "matter-js";

/**
 * implements `IActin`.
 */
export default class Actin implements IActin {
  public orientation: number = Math.random() * 2 * Math.PI;

  public velocity: Vector = [0, 0];

  public hasAtp: boolean = true;

  private body: Body;

  public constructor(public pos: Vector, engine: Engine) {
    this.body = Bodies.circle(pos[0], pos[1], 10, {
      angle: this.orientation,
      mass: 10,
      friction: 0,
      frictionAir: 0,
      restitution: 0,
    });
    Body.setVelocity(this.body, {
        x: (Math.random() * 2 - 1) * 5,
        y: (Math.random() * 2 - 1) * 5,
    });
    World.add(engine.world, this.body);
  }

  public update() {
    this.pos = [this.body.position.x, this.body.position.y];
    this.velocity = [this.body.velocity.x, this.body.velocity.y];
    this.orientation = this.body.angle;
  }
}
