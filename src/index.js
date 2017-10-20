import React from 'react';
import makeTrashable from 'trashable';

const makeComponentTrashable = (Component) => {
  class TrashableComponent extends React.Component {
    constructor(props) {
      super(props);

      this.promiseStore = {};
      this.key = 0;
    }

    componentWillUnmount() {
      const keys = Object.keys(this.promiseStore);
      keys.forEach((key) => {
        this.promiseStore[key].trash();
      });
    }

    addPromise(promise) {
      let currentKey = this.key;
      this.promiseStore[currentKey] = promise;

      this.key++;
      return currentKey;
    }

    removePromise(key) {
      delete this.promiseStore[key];
    }

    trackPromise(promise) {
      const trashablePromise = makeTrashable(promise);
      const key = this.addPromise(trashablePromise);

      trashablePromise.then(() => {
        this.removePromise(key);
      }).catch((error) => {
        this.removePromise(key);
        return Promise.reject(error);
      });

      return trashablePromise;
    }

    render() {
      return (
        <Component trackPromise={this.trackPromise} {...this.props} />
      );
    }
  }
  TrashableComponent.displayName = `makeComponentTrashable(${getDisplayName(Component)})`;
  return TrashableComponent;
};

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default makeComponentTrashable;
