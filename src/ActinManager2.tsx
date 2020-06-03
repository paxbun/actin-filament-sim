import Actin2 from "./Actin2";
import { Body } from "matter-js";

export default class ActinManager2 {
  protected map: Map<number, Actin2> = new Map();

  public register(actin: Actin2) {
    if (!this.map.has(actin.id)) {
      this.map.set(actin.id, actin);
    }
  }

  public retrieve(body: Body): Actin2 | undefined {
    return this.map.get(body.id);
  }

  public remove(actin: Actin2) {
    if (this.map.has(actin.id)) {
      this.map.delete(actin.id);
    }
  }

  public get length(): number {
    return this.map.size;
  }

  public toArray(): Actin2[] {
    return Array.from(this.map.keys()).map(
      (key) => this.map.get(key) as Actin2
    );
  }

  public forEachFilament(fun: (actin: Actin2) => void): void {
    this.map.forEach((actin) => {
      if (actin.isSingle || actin.isPlusEnd) {
        fun(actin);
      }
    });
  }
}
