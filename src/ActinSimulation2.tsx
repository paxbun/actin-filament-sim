import ISimulation, {
  IActin,
  IStatistics,
  abs,
  diff,
  Vector,
} from "./Simulation";
import ActinManager2 from "./ActinManager2";
import { Engine, Events, IEventCollision } from "matter-js";
import Actin2 from "./Actin2";

const ACTIN_RADIUS = 5;

export default class ActinSimulation2 extends ActinManager2
  implements ISimulation {
  private engine = Engine.create();

  public constructor() {
    super();
    this.engine.world.gravity.y = 0;
    Events.on(this.engine, "collisionStart", this.handleCollision.bind(this));

    for (let i = 0; i < 20; ++i) {
      const theta = 2 * Math.PI * Math.random();
      const radRandom = Math.random();
      const radius = 400 * (1.1 - radRandom * radRandom * radRandom);
      this.add([radius * Math.cos(theta), radius * Math.sin(theta)]);
    }

    setInterval(() => {
      for (let i = 0; i < 5; ++i) {
        const theta = 2 * Math.PI * Math.random();
        const radRandom = Math.random();
        const radius = 400 * (1.1 - radRandom * radRandom * radRandom);
        this.add([radius * Math.cos(theta), radius * Math.sin(theta)]);
      }
    }, 1000 / 20);
  }

  public getCurrentState(): IActin[] {
    return super.toArray();
  }

  public getCurrentStatistics(): IStatistics {
    const rtn = new Map<number, number>();
    let atp = 0;
    let adp = 0;
    this.map.forEach((actin) => {
      if (actin.hasAtp) {
        atp += 1;
      } else {
        adp += 1;
      }
      if (!actin.plus) {
        let length = 0;
        let pointer: Actin2 | null = actin;
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

  public handleCollision(e: IEventCollision<Engine>) {
    for (const pair of e.pairs) {
      const { bodyA, bodyB } = pair;
      const actinA = super.retrieve(bodyA);
      const actinB = super.retrieve(bodyB);
      if (actinA && actinB && !(bodyA.isStatic && bodyB.isStatic)) {
        const actinASingle = actinA.isSingle && actinA.hasAtp;
        const actinBSingle = actinB.isSingle && actinB.hasAtp;
        if (actinASingle && actinBSingle) {
          actinA.makeDimerWith(actinB);
        } else if (actinASingle) {
          if (!actinB.isSingle) {
            actinA.attachToIfPossible(actinB);
          }
        } else if (actinBSingle) {
          if (!actinA.isSingle) {
            actinB.attachToIfPossible(actinA);
          }
        }
      }
    }
  }

  public getRadius(): number {
    return ACTIN_RADIUS;
  }

  public precede(deltaTime: number): void {
    const toDetach: Actin2[] = [];
    super.forEachFilament((filament) => {
      if (filament.isSingle) {
        filament.update(toDetach);
      } else {
        super.forEachFilament((other) => {
          if (other.isSingle && other.hasAtp) {
            other.moveForwardIfValid(filament);
          }
        });
        filament.forEach((actin) => {
          actin.update(toDetach);
        });
      }
    });
    for (const actin of toDetach) {
      super.remove(actin);
    }
    Engine.update(this.engine, deltaTime / 4, 1);
  }

  public add(pos: Vector): void {
    if (!this.willCollide(pos)) {
      this.register(new Actin2(pos, ACTIN_RADIUS, this.engine, this));
    }
  }

  public willCollide(pos: Vector): boolean {
    for (const key of Array.from(this.map.keys())) {
      if (
        abs(diff((this.map.get(key) as Actin2).pos, pos)) <=
        ACTIN_RADIUS * 1.8
      )
        return true;
    }
    return false;
  }
}
