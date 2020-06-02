import ISimulation, { IStatistics, IActin, Vector } from './Simulation';

/**
 * the implementation of `ISimulation'
 */
export default class ActinSimulation implements ISimulation {

    private actins: IActin[] = [];

    public getCurrentState(): IActin[] {
        return this.actins;
    }

    public getCurrentStatistics(): IStatistics {
        return {
            numberByLength: new Map<number, number>(),
            numberWithAdp: 100,
            numberWithAtp: 50,
        };
    }

    public getRadius(): number {
        return 10;
    }

    public precede(deltaTime: number): void {
        for (const actin of this.actins) {
            const [x, y] = actin.pos;
            const [vx, vy] = actin.velocity;
            actin.pos = [x + vx * deltaTime, y + vy * deltaTime];
        }
    }

    public add(pos: Vector): void {
        this.actins.push({
            pos: pos,
            orientation: Math.random() * 2 * Math.PI,
            velocity: [(Math.random() * 2 - 1) * 10, (Math.random() * 2 - 1) * 10],
            hasAtp: false
        });
    }
}