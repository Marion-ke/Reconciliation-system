import { TRANSITION_TABLE } from "./transitionTable.js";

/**
 * Determines the next state of an asset
 * based on its current state and event type.
 */
export function getNextState(currentState, eventType) {
  return (
    TRANSITION_TABLE[currentState.toUpperCase()]?.[eventType.toUpperCase()] ??
    null
  );
}
