// @flow
import React from 'react';
import makeTrashable from 'trashable';

import type { ComponentType } from 'react';
import type { TrashablePromise } from 'trashable';

type Key = number;

const makeComponentTrashable = (Component: ComponentType<*>) => {
  class TrashableComponent extends React.Component<*> {
    promiseStore = {};
    key: Key = 0;

    componentWillUnmount() {
      const keys = Object.keys(this.promiseStore);
      keys.forEach(key => {
        this.promiseStore[key].trash();
      });
    }

    addPromise = (promise: TrashablePromise<*>): Key => {
      let currentKey = this.key;
      this.promiseStore[currentKey] = promise;

      this.key++;
      return currentKey;
    };

    removePromise = (key: Key): void => {
      delete this.promiseStore[key];
    };

    registerPromise = <T>(promise: Promise<T>): TrashablePromise<T> => {
      const trashablePromise = makeTrashable(promise);
      const key = this.addPromise(trashablePromise);

      const handledPromise: any = trashablePromise
        .then(value => {
          this.removePromise(key);
          return Promise.resolve(value);
        })
        .catch(error => {
          this.removePromise(key);
          return Promise.reject(error);
        });

      // Return trashable promise
      handledPromise.trash = () => {
        this.removePromise(key);
        trashablePromise.trash();
      };
      return (handledPromise: TrashablePromise<T>);
    };

    render() {
      return (
        <Component registerPromise={this.registerPromise} {...this.props} />
      );
    }
  }
  TrashableComponent.displayName = `Trashable(${getDisplayName(Component)})`;
  return TrashableComponent;
};

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default makeComponentTrashable;
