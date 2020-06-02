// Copyright (c) 2020 Chanjung Kim (paxbun). All rights reserved.

/**
 * represents a two-dimensional vector
 */
export type Vector = [number, number];

/**
 * represents a single actin subunit
 */
export interface IActin {
  /**
   * the position of the subunit
   */
  pos: Vector;

  /**
   * the orientation of the subunit in radian
   */
  orientation: number;

  /**
   * the velocity of the subunit
   */
  velocity: Vector;

  /**
   * `true` if has an ATP; `false` otherwise
   */
  hasAtp: boolean;
}

/**
 * represents statistics about the current state of the simulation
 */
export interface IStatistics {
  /**
   * number of filaments of each length
   */
  numberByLength: Map<number, number>;

  /**
   * number of subunits with ATP
   */
  numberWithAtp: number;

  /**
   * number of subunits with ADP
   */
  numberWithAdp: number;
}

/**
 * the abstraction of simulation class
 */
export default interface ISimulation {
  /**
   * @returns the list of the subunits in the current state
   */
  getCurrentState(): IActin[];

  /**
   * @returns the statistics about the current state
   */
  getCurrentStatistics(): IStatistics;

  /**
   * @returns the radius of subunits
   */
  getRadius(): number;

  /**
   * calculates the next state
   * @param deltaTime the length of time between the last call and the current call of this method
   */
  precede(deltaTime: number): void;

  /**
   * adds a subunit to the given position
   * @param pos the position to create a new subunit
   */
  add(pos: Vector): void;
}
