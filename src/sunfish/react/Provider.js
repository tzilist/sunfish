import { Children, Component } from 'react';
import { object } from 'prop-types';

export default class Provider extends Component {
  constructor(props) {
    super(props);
    this.store = props.state;
  }

  getChildContext() {
    return { store: this.store };
  }

  render() {
    return Children.only(this.props.children);
  }
}

Provider.childContextTypes = {
  store: object.isRequired,
};