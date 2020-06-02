import ISimulation, {
  IStatistics,
  IActin,
  Vector,
  IActinGroup,
  sum,
} from "./Simulation";
import Actin from "./Actin";
import { Engine, World, Bodies } from "matter-js";

class SingleActinGroup implements IActinGroup {
  public constructor(private actin: Actin) {}

  public actins(): Actin[] {
    return [this.actin];
  }
}

/**
 * the implementation of `ISimulation'
 */
export default class ActinSimulation implements ISimulation {
  private actinGroups: SingleActinGroup[] = [];

  private engine = Engine.create();

  public constructor() {
    this.engine.world.gravity.y = 0;
    const number = 16;
    for (let i = 0; i < number; ++i) {
      const rect = Bodies.rectangle(
        Math.cos((2 * i * Math.PI) / number) * 400,
        Math.sin((2 * i * Math.PI) / number) * 400,
        20,
        2 * Math.PI * 400 / number + 10,
        {
          isStatic: true,
          angle: (2 * i * Math.PI) / number,
        }
      );
      World.add(this.engine.world, rect);
    }
  }

  public getCurrentState(): IActinGroup[] {
    return this.actinGroups;
  }

  public getCurrentStatistics(): IStatistics {
    const rtn = new Map<number, number>();
    for (const group of this.actinGroups) {
      const length = group.actins().length;
      if (rtn.has(length)) {
        rtn.set(length, (rtn.get(length) as number) + 1);
      } else {
        rtn.set(length, 1);
      }
    }
    const [atp, adp] = this.actinGroups.reduce(
      (prev: Vector, curr: IActinGroup): Vector => {
        return sum(
          prev,
          curr.actins().reduce(
            (prev: Vector, actin: IActin): Vector => {
              return sum(prev, actin.hasAtp ? [1, 0] : [0, 1]);
            },
            [0, 0]
          )
        );
      },
      [0, 0]
    );
    return {
      numberByLength: rtn,
      numberWithAtp: atp,
      numberWithAdp: adp,
    };
  }

  public getRadius(): number {
    return 5;
  }

  public precede(deltaTime: number): void {
    Engine.update(this.engine, deltaTime, 1);
    for (const group of this.actinGroups) {
      for (const actin of group.actins()) {
        actin.update();
      }
    }
  }

  public add(pos: Vector): void {
    this.actinGroups.push(new SingleActinGroup(new Actin(pos, 5, this.engine)));
  }
}
