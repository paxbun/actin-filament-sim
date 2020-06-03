import { IActin, Vector, dot, diff, abs, div } from "./Simulation";
import { Engine, Bodies, Body, World } from "matter-js";
import ActinManager from "./ActinManager";

/**
 * implements `IActin`.
 */
export default class Actin implements IActin {
  // Inherited from `IActin`
  public orientation: number = 2 * Math.PI * Math.random();
  public velocity: Vector = [0, 0];
  public hasAtp: boolean = false;
  public isPlusEnd: boolean = false;
  public isMinusEnd: boolean = false;
  public get isSingle() : boolean {
    return !this.plus && !this.minus;
  } 

  private internal: Body;

  public get id(): number {
    return this.internal.id;
  }

  public get body(): Body {
    return this.internal;
  }

  /**
   * another subunit in the plus end side attached to this subunit
   */
  public plus: Actin | null = null;

  /**
   * another subunit in the minus end side attached to this subunit
   */
  public minus: Actin | null = null;

  /**
   * the time point where this subunit is attached to the filament at
   */
  private attachedAt: number = 0;

  /**
   *
   */
  private detachCriterion: number = 0;

  /**
   * the time point where this subunit was created at
   */
  private createdAt: number = Date.now();

  public constructor(
    public pos: Vector,
    private radius: number,
    private engine: Engine,
    private manager: ActinManager
  ) {
    this.internal = Bodies.circle(pos[0], pos[1], radius, {
      angle: this.orientation,
      mass: 1,
      friction: 0,
      frictionAir: 0,
      restitution: 0,
    });
    World.add(engine.world, this.internal);
  }

  public update(toDetach: Actin[]) {
    this.pos = [this.internal.position.x, this.internal.position.y];
    this.velocity = [this.internal.velocity.x, this.internal.velocity.y];
    this.orientation = this.internal.angle;
    this.isPlusEnd = !!(!this.plus && this.minus);
    this.isMinusEnd = !!(this.plus && !this.minus);
    Body.applyForce(
      this.body,
      {
        x: this.pos[0],
        y: this.pos[1],
      },
      {
        x: 150 * (Math.random() * 2 - 1),
        y: 150 * (Math.random() * 2 - 1),
      }
    );
    if (this.createdAt && Date.now() - this.createdAt > 2000) {
      this.hasAtp = true;
      this.createdAt = 0;
    }
    if (this.attachedAt) {
      if (Date.now() - this.attachedAt > 2000) {
        this.hasAtp = false;
      }
      if (this.plus && !this.minus) {
        let length = 0;
        let pointer: Actin | null = this;
        while (pointer !== null) {
          pointer = pointer.plus;
          ++length;
        }
        if (
          Date.now() - this.detachCriterion >
          1400 * (1.2 - Math.exp(-length / 5))
        ) {
          if (length === 2) {
            toDetach.push(this.plus);
          } else {
            this.plus.updateDetachCriterion();
          }
          toDetach.push(this);
        }
      }
      if (!this.plus && this.minus) {
        let length = 0;
        let pointer: Actin | null = this;
        while (pointer !== null) {
          pointer = pointer.minus;
          ++length;
        }
        if (
          Date.now() - this.detachCriterion >
          5000 * (1.2 - Math.exp(-length / 5))
        ) {
          if (length === 2) {
            toDetach.push(this.minus);
          } else {
            this.minus.updateDetachCriterion();
          }
          toDetach.push(this);
        }
      }
    } else if (this.isMinusEnd === true) {
      //force get rid of
      this.attachedAt = Date.now();
    }
  }

  public attachToIfPossible(other: Actin): void {
    const cos = Math.cos(other.orientation);
    const sin = Math.sin(other.orientation);
    const xx = this.radius * 2 * cos;
    const yy = this.radius * 2 * sin;
    const dS = diff(other.pos, this.pos);
    const cosangle = dot([cos, sin], dS) / abs(dS);
    if (cosangle > 0.8) {
      // `this` is attached to the minus end
      if (other.minus) {
        return;
      }
      Body.setVelocity(this.body, { x: 0, y: 0 });
      Body.setVelocity(other.body, { x: 0, y: 0 });
      Body.setAngle(this.body, other.orientation);
      Body.setPosition(this.body, {
        x: other.pos[0] - xx,
        y: other.pos[1] - yy,
      });
      other.minus = this;
      this.plus = other;
      Body.setStatic(this.body, true);
      Body.setStatic(other.body, true);
      this.setAttachedAt(Date.now());
    } else {
      // `this` is attached to the plus end
      if (other.plus) {
        return;
      }
      Body.setVelocity(this.body, { x: 0, y: 0 });
      Body.setVelocity(other.body, { x: 0, y: 0 });
      Body.setAngle(this.body, other.orientation);
      Body.setPosition(this.body, {
        x: other.pos[0] + xx,
        y: other.pos[1] + yy,
      });
      other.plus = this;
      this.minus = other;
      Body.setStatic(this.body, true);
      Body.setStatic(other.body, true);
      this.setAttachedAt(Date.now());
    }
  }

  public makeDimerWith(other: Actin): void {
    const cos = Math.cos(this.orientation);
    const sin = Math.sin(this.orientation);
    const xx = this.radius * 2 * cos;
    const yy = this.radius * 2 * sin;
    const dS = diff(other.pos, this.pos);
    const angle = dot([cos, sin], dS);
    if (angle > 0) {
      // `this` is attached to the minus end
      Body.setPosition(other.body, {
        x: this.pos[0] + xx,
        y: this.pos[1] + yy,
      });
      this.plus = other;
      other.minus = this;
    } else {
      // `this` is attached to the plus end
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
    const now = Date.now();
    this.setAttachedAt(now);
    other.setAttachedAt(now);
  }

  public setAttachedAt(attachedAt: number): void {
    this.detachCriterion = this.attachedAt = attachedAt;
  }

  public updateDetachCriterion(): void {
    this.detachCriterion = Date.now();
  }

  public detach(): void {
    if (this.minus) this.minus.plus = null;
    if (this.plus) this.plus.minus = null;
    this.minus = this.plus = null;
    World.remove(this.engine.world, this.body);
    this.manager.remove(this);
  }
}
