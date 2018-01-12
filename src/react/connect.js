import { Component, createElement } from 'react';
import { object } from 'prop-types';
import hoistStatics from 'hoist-non-react-statics';

export default function connect(mapStateToProps, mapActionsToProps) {
  return (Child) => {
    class Wrapper extends Component {
      constructor(props) {
        super(props);

        this.childPropsMappedState = null;

        this.getChildProps = this.getChildProps.bind(this);
        this.update = this.update.bind(this);
      }

      componentDidMount() {
        const { store } = this.context;
        store.subscribe(this.update);
      }

      shouldComponentUpdate() {
        return false;
      }

      componentWillUnmount() {
        const { store } = this.context;
        store.unsubscribe(this.update);
      }


      getChildProps() {
        const { store } = this.context;
        const { state } = store;
        let stateProps = {};

        if (mapStateToProps && mapStateToProps.constructor === Function) {
          const newProps = mapStateToProps(state);
          if (newProps && newProps.constructor === Object) {
            stateProps = Object.assign(stateProps, newProps);
          }
        }

        this.childPropsMappedState = stateProps;

        if (mapActionsToProps && mapActionsToProps.constructor === Function) {
          const newProps = mapActionsToProps(state);
          if (newProps && newProps.constructor === Object) {
            stateProps = Object.assign(stateProps, newProps);
          }
        }

        const childProps = Object.assign({}, stateProps);
        childProps.createTransaction = store.createTransaction;
        return childProps;
      }

      update(newState) {
        if (this.childPropsMappedState && newState) {
          const newProps = mapStateToProps(newState);
          const childKeys = Object.keys(this.childPropsMappedState);
          let shouldUpdate = childKeys
            .some(key => this.childPropsMappedState[key] !== newProps[key]);
          if (shouldUpdate) {
            return this.forceUpdate();
          }

          const newStateKeys = Object.keys(newProps);

          shouldUpdate = newStateKeys
            .some(key => this.childPropsMappedState[key] !== newProps[key]);

          if (shouldUpdate) {
            return this.forceUpdate();
          }

          return null;
        }
      }

      render() {
        return createElement(Child, this.getChildProps());
      }
    }

    Wrapper.contextTypes = {
      store: object.isRequired,
    };

    return hoistStatics(Wrapper, Child);
  };

};
