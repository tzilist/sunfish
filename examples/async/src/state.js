import { initState } from 'sunfish';

const INITIAL_STATE = {
  isFetchingData: false,
  fetchDataError: false,
  fetchDataSuccess: false,
  data: [],
};


export default initState(INITIAL_STATE);
