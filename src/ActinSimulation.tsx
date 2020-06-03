import ActinManager from "./ActinManager";
import ISimulation, {
  Vector,
  IActin,
  IStatistics,
  diff,
  abs,
  sum,
} from "./Simulation";
import {
  Engine,
  World,
  Events,
  Bodies,
  IEventCollision,
  Body,
} from "matter-js";
import Actin from "./Actin";

const ACTIN_RADIUS = 3;

/**
 * the implementation of `ISimulation'
 */
export default class ActinSimulation extends ActinManager
  implements ISimulation {
  private engine = Engine.create();

  public constructor() {
    super();
    this.engine.world.gravity.y = 0;
    const number = 16;
    for (let i = 0; i < number; ++i) {
      const rect = Bodies.rectangle(
        Math.cos((2 * i * Math.PI) / number) * 400,
        Math.sin((2 * i * Math.PI) / number) * 400,
        50,
        (2 * Math.PI * 400) / number + 10,
        {
          isStatic: true,
          angle: (2 * i * Math.PI) / number,
          friction: 0,
          frictionStatic: 0,
          frictionAir: 0,
          restitution: 1,
        }
      );
      World.add(this.engine.world, rect);
    }
    Events.on(this.engine, "collisionStart", this.handleCollision.bind(this));

    for (let i = 0; i < 100; ++i) {
      const theta = 2 * Math.PI * Math.random();
      const radRandom = Math.random();
      const radius = 350 * (1.1 - radRandom * radRandom * radRandom);
      this.add([radius * Math.cos(theta), radius * Math.sin(theta)]);
    }

    setInterval(() => {
      for (let i = 0; i < 30; ++i) {
        const theta = 2 * Math.PI * Math.random();
        const radRandom = Math.random();
        const radius = 350 * (1.1 - radRandom * radRandom * radRandom);
        this.add([radius * Math.cos(theta), radius * Math.sin(theta)]);
      }
    }, 1000 / 20);
  }

  public getRadius(): number {
    return ACTIN_RADIUS;
  }

  public precede(deltaTime: number): void {
    this.actinMap.forEach((actin) => {
      actin.update();
      if (abs(actin.pos) > 500) {
        actin.detach();
      } else if (actin.isPlusEnd) {
        this.actinMap.forEach((other) => {
          if (actin !== other && other.hasAtp) {
            const xx = 2 * ACTIN_RADIUS * Math.cos(actin.orientation);
            const yy = 2 * ACTIN_RADIUS * Math.sin(actin.orientation);
            const target = sum(actin.pos, [xx, yy]);
            const dS = diff(target, other.pos);
            const dist = abs(dS);
            if (dist < ACTIN_RADIUS * 10) {
              Body.applyForce(
                other.body,
                {
                  x: other.pos[0],
                  y: other.pos[1],
                },
                {
                  x: dS[0] * dist,
                  y: dS[1] * dist,
                }
              );
            }
          }
        });
      }
    });
    Engine.update(this.engine, deltaTime / 4, 1);
  }

  public handleCollision(e: IEventCollision<Engine>) {
    for (const pair of e.pairs) {
      const { bodyA, bodyB } = pair;
      const actinA = super.retrieve(bodyA);
      const actinB = super.retrieve(bodyB);
      if (actinA && actinB) {
        const actinASingle = actinA.isSingle() && actinA.hasAtp;
        const actinBSingle = actinB.isSingle() && actinB.hasAtp;
        if (actinASingle && actinBSingle) {
          actinA.makeDimerWith(actinB);
        } else if (actinASingle) {
          actinA.attachToIfPossible(actinB);
        } else if (actinBSingle) {
          actinB.attachToIfPossible(actinA);
        }
      }
    }
  }

  public getCurrentState(): IActin[] {
    return super.toArray();
  }

  public getCurrentStatistics(): IStatistics {
    const rtn = new Map<number, number>();
    let atp = 0;
    let adp = 0;
    this.actinMap.forEach((actin) => {
      if (actin.hasAtp) {
        atp += 1;
      } else {
        adp += 1;
      }
      if (!actin.plus) {
        let length = 0;
        let pointer: Actin | null = actin;
        while (pointer !== null) {
          pointer = pointer.minus;
          ++length;
        }
        if (rtn.has(length)) {
          rtn.set(length, (rtn.get(length) as number) + 1);
        } else {
          rtn.set(length, 1);
        }
      }
    });
    return {
      numberByLength: rtn,
      numberWithAtp: atp,
      numberWithAdp: adp,
    };
  }

  public add(pos: Vector): void {
    this.register(new Actin(pos, ACTIN_RADIUS, this.engine, this));
  }
}
