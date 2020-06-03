import Actin from "./Actin";
import { Body } from "matter-js";

export default class ActinManager {
  private map: Map<number, Actin> = new Map();

  public get actinMap() {
    return this.map;
  }

  public constructor(actins: Actin[] = []) {
    for (const actin of actins) {
      this.register(actin);
    }
  }

  public register(actin: Actin) {
    if (!this.map.has(actin.id)) {
      this.map.set(actin.id, actin);
    }
  }

  public retrieve(body: Body): Actin | undefined {
    return this.map.get(body.id);
  }

  public remove(actin: Actin) {
    if (this.map.has(actin.id)) {
      this.map.delete(actin.id);
    }
  }

  public get length(): number {
    return this.map.size;
  }

  public toArray(): Actin[] {
    return Array.from(this.actinMap.keys()).map(
      (key) => this.actinMap.get(key) as Actin
    );
  }
}
