// Copyright (c) 2020 Chanjung Kim (paxbun). All rights reserved.

/**
 * represents a two-dimensional vector
 */
export type Vector = [number, number];

/**
 * @returns the copied vector
 * @param vec the vector to copy
 */
export function copy(vec: Vector): Vector {
  const [x, y] = vec;
  return [x, y];
}

/**
 *  @returns sum of two vectors
 */
export function sum(lhs: Vector, rhs: Vector): Vector {
  return [lhs[0] + rhs[0], lhs[1] + rhs[1]];
}

/**
 * @returns difference between two vectors
 */
export function diff(lhs: Vector, rhs: Vector): Vector {
  return [lhs[0] - rhs[0], lhs[1] - rhs[1]];
}

/**
 * @returns the scalar product
 */
export function mul(scale: number, vec: Vector): Vector {
  const [x, y] = vec;
  return [scale * x, scale * y];
}

/**
 * @returns `mul(1/ div, vec)`
 */
export function div(vec: Vector, div: number): Vector {
  return mul(1 / div, vec);
}

/**
 * @returns the square of norm of `vec`
 */
export function abs2(vec: Vector): number {
  const [x, y] = vec;
  return x * x + y * y;
}

/**
 * @returns the norm of `vec`
 */
export function abs(vec: Vector): number {
  return Math.sqrt(abs2(vec));
}

/**
 * @returns the dot product of the two vectors
 */
export function dot(lhs: Vector, rhs: Vector): number {
  return lhs[0] * rhs[0] + lhs[1] * rhs[1];
}

/**
 * @returns the unit vector with the same orientation
 */
export function unit(vec: Vector): Vector {
  return div(vec, abs(vec));
}

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

  /**
   * `true` if it is at plus end; `false` otherwise
   */
  isPlusEnd: boolean;
  
  /**
   * `true` if it is at minus end; `false` otherwise
   */
  isMinusEnd: boolean;

  /**
   * `true` if it is a single unit; `false` otherwise
   */
  isSingle: boolean;
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
