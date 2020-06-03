import { IActin, Vector, dot, abs, sum, diff } from "./Simulation";
import { Engine, Bodies, Body, World } from "matter-js";
import ActinSimulation2 from "./ActinSimulation2";

enum ActinState2 {
  CREATED,
  ACTIVATED,
  ATTACHED,
  DEACTIVATED,
  DETACHED,
}

export default class Actin2 implements IActin {
  public get pos(): Vector {
    return [this.internal.position.x, this.internal.position.y];
  }
  public get orientation(): number {
    return this.internal.angle;
  }
  public get velocity(): Vector {
    return [this.internal.velocity.x, this.internal.velocity.y];
  }
  public get hasAtp(): boolean {
    switch (this.state) {
      case ActinState2.CREATED:
        return false;
      case ActinState2.ACTIVATED:
        return true;
      case ActinState2.ATTACHED:
        return true;
      case ActinState2.DEACTIVATED:
        return false;
      case ActinState2.DETACHED:
        return false;
    }
  }
  public get isPlusEnd(): boolean {
    return !!(!this.plus && this.minus);
  }
  public get isMinusEnd(): boolean {
    return !!(this.plus && !this.minus);
  }
  public get isSingle(): boolean {
    return !this.plus && !this.minus;
  }
  public get id(): number {
    return this.internal.id;
  }
  public get body(): Body {
    return this.internal;
  }
  public get length(): number {
    let rtn = 1;
    let pointer: Actin2 = this;
    while (pointer.minus) {
      pointer = pointer.minus;
      ++rtn;
    }
    return rtn;
  }
  public get lengthInverse(): number {
    let rtn = 1;
    let pointer: Actin2 = this;
    while (pointer.plus) {
      pointer = pointer.plus;
      ++rtn;
    }
    return rtn;
  }
  public plus: Actin2 | null = null;
  public minus: Actin2 | null = null;
  private state: ActinState2 = ActinState2.CREATED;
  private internal: Body;
  private stateChangedAt: number = Date.now();

  public constructor(
    pos: Vector,
    private radius: number,
    private engine: Engine,
    private sim: ActinSimulation2
  ) {
    this.internal = Bodies.circle(pos[0], pos[1], radius, {
      angle: 2 * Math.PI * Math.random(),
      mass: 1,
      friction: 0,
      frictionAir: 0,
      restitution: 0,
    });
    World.add(this.engine.world, this.internal);
  }

  public update(toDetach: Actin2[]): void {
    switch (this.state) {
      case ActinState2.CREATED:
        if (Date.now() - this.stateChangedAt > 3000) {
          this.changeStateTo(ActinState2.ACTIVATED);
        }
      case ActinState2.ACTIVATED:
        this.applyRandomForce();
        if (abs(this.pos) > 500) {
          toDetach.push(this);
        }
        break;
      case ActinState2.ATTACHED:
        if (Date.now() - this.stateChangedAt > 3000) {
          this.changeStateTo(ActinState2.DEACTIVATED);
        }
      case ActinState2.DEACTIVATED:
        if (this.isPlusEnd) {
          this.handlePlusEndTasks(toDetach);
        } else if (this.isMinusEnd) {
          this.handleMinusEndTasks(toDetach);
        }
        break;
    }
  }
  public applyRandomForce(): void {
    Body.applyForce(
      this.body,
      {
        x: this.pos[0],
        y: this.pos[1],
      },
      {
        x: 1000 * (Math.random() * 2 - 1),
        y: 1000 * (Math.random() * 2 - 1),
      }
    );
  }

  private changeStateTo(newState: ActinState2): void {
    this.state = newState;
    this.stateChangedAt = Date.now();
  }

  private handlePlusEndTasks(toDetach: Actin2[]): void {
    const length = this.length;
    if (
      Date.now() - this.stateChangedAt >
      5000 * (1.2 - Math.exp(-length / 5))
    ) {
      const minus = this.minus as Actin2;
      if (length === 2) {
        this.breakDimer(toDetach, minus);
      } else {
        toDetach.push(this);
        this.minus = null;
        minus.plus = null;
        World.remove(this.engine.world, this.internal);
        this.changeStateTo(ActinState2.DETACHED);
        if (minus.state === ActinState2.DEACTIVATED) {
          minus.changeStateTo(ActinState2.DEACTIVATED);
        }
      }
    }
  }

  private handleMinusEndTasks(toDetach: Actin2[]): void {
    const length = this.lengthInverse;
    if (
      Date.now() - this.stateChangedAt >
      2000 * (1.2 - Math.exp(-length / 5))
    ) {
      const plus = this.plus as Actin2;
      if (length === 2) {
        this.breakDimer(toDetach, plus);
      } else {
        toDetach.push(this);
        this.plus = null;
        plus.minus = null;
        World.remove(this.engine.world, this.internal);
        this.changeStateTo(ActinState2.DETACHED);
        if (plus.state === ActinState2.DEACTIVATED) {
          plus.changeStateTo(ActinState2.DEACTIVATED);
        }
      }
    }
  }

  private breakDimer(toDetach: Actin2[], actin: Actin2): void {
    actin.plus = actin.minus = null;
    this.plus = this.minus = null;
    toDetach.push(this, actin);
    this.changeStateTo(ActinState2.DETACHED);
    actin.changeStateTo(ActinState2.DETACHED);
  }

  public forEach(fun: (actin: Actin2) => void): void {
    let pointer: Actin2 = this;
    fun(pointer);
    while (pointer.minus) {
      pointer = pointer.minus;
      fun(pointer);
    }
  }

  public moveForwardIfValid(actin: Actin2): void {
    const xx = 2 * this.radius * Math.cos(actin.orientation);
    const yy = 2 * this.radius * Math.sin(actin.orientation);
    const target = sum(actin.pos, [xx, yy]);
    const dS = diff(target, this.pos);
    const dist = abs(dS);
    if (dist < this.radius * 20) {
      Body.applyForce(
        this.body,
        {
          x: this.pos[0],
          y: this.pos[1],
        },
        {
          x: dS[0] * dist * 10,
          y: dS[1] * dist * 10,
        }
      );
    }
  }

  public makeDimerWith(other: Actin2): void {
    const cos = Math.cos(this.orientation);
    const sin = Math.sin(this.orientation);
    const xx = this.radius * 2 * cos;
    const yy = this.radius * 2 * sin;
    const dS = diff(other.pos, this.pos);
    const angle = dot([cos, sin], dS);
    if (angle > 0.9) {
      // `this` is attached to the minus end
      if (this.sim.willCollide([this.pos[0] + xx, this.pos[1] + yy])) {
        return;
      }
      Body.setPosition(other.body, {
        x: this.pos[0] + xx,
        y: this.pos[1] + yy,
      });
      this.plus = other;
      other.minus = this;
    } else if (angle < -0.9) {
      // `this` is attached to the plus end
      if (this.sim.willCollide([this.pos[0] - xx, this.pos[1] - yy])) {
        return;
      }
      Body.setPosition(other.body, {
        x: this.pos[0] - xx,
        y: this.pos[1] - yy,
      });
      other.plus = this;
      this.minus = other;
    }
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setVelocity(other.body, { x: 0, y: 0 });
    Body.setAngle(other.body, this.orientation);
    Body.setStatic(this.body, true);
    Body.setStatic(other.body, true);
    this.changeStateTo(ActinState2.ATTACHED);
    other.changeStateTo(ActinState2.ATTACHED);
  }

  public attachToIfPossible(other: Actin2): void {
    const cos = Math.cos(other.orientation);
    const sin = Math.sin(other.orientation);
    const xx = this.radius * 2 * cos;
    const yy = this.radius * 2 * sin;
    if (other.minus) {
      // `this` is attached to the plus end
      if (other.plus) {
        return;
      }
      if (this.sim.willCollide([other.pos[0] + xx, other.pos[1] + yy])) {
        return;
      }
      Body.setPosition(this.body, {
        x: other.pos[0] + xx,
        y: other.pos[1] + yy,
      });
    } else {
      // `this` is attached to the minus end
      if (other.minus) {
        return;
      }
      if (this.sim.willCollide([other.pos[0] - xx, other.pos[1] - yy])) {
        return;
      }
      Body.setPosition(this.body, {
        x: other.pos[0] - xx,
        y: other.pos[1] - yy,
      });
    }
    Body.setVelocity(this.body, { x: 0, y: 0 });
    Body.setAngle(this.body, other.orientation);
    other.plus = this;
    this.minus = other;
    Body.setStatic(this.body, true);
    this.changeStateTo(ActinState2.ATTACHED);
  }
}
