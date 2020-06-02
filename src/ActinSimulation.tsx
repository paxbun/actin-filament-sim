import ISimulation, { IStatistics, IActin, Vector } from './Simulation';

/**
 * the implementation of `ISimulation'
 */
export default class ActinSimulation implements ISimulation {

    private actins: IActin[] = [
        {
            pos: [100, 100],
            orientation: 5,
            velocity: [0, 0],
            hasAtp: false,
        }
    ];

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
        return 20;
    }

    public precede(deltaTime: number): void {
        // TODO
    }

    public add(pos: Vector): void {
        this.actins.push({
            pos: pos,
            orientation: 0,
            velocity: [0, 0],
            hasAtp: false
        });
    }
}