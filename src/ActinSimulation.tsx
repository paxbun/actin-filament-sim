import ISimulation, {
  IStatistics,
  IActin,
  Vector,
  IActinGroup,
  sum,
} from "./Simulation";

class SingleActinGroup implements IActinGroup {
  public constructor(private actin: IActin) {}

  public actins(): IActin[] {
    return [this.actin];
  }
}

/**
 * the implementation of `ISimulation'
 */
export default class ActinSimulation implements ISimulation {
  private actinGroups: IActinGroup[] = [];

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
    return 10;
  }

  public precede(deltaTime: number): void {
    for (const group of this.actinGroups) {
      for (const actin of group.actins()) {
        const [x, y] = actin.pos;
        const [vx, vy] = actin.velocity;
        actin.pos = [x + vx * deltaTime, y + vy * deltaTime];
      }
    }
  }

  public add(pos: Vector): void {
    this.actinGroups.push(
      new SingleActinGroup({
        pos: pos,
        orientation: Math.random() * 2 * Math.PI,
        velocity: [(Math.random() * 2 - 1) * 10, (Math.random() * 2 - 1) * 10],
        hasAtp: false,
      })
    );
  }
}
