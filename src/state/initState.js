import State from './State';

export default function initState(state = {}) {
  return new State(state);
}
