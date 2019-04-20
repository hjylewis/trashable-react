// @flow
import React from 'react';
import makeTrashable from 'trashable';

import type { AbstractComponent } from 'react';
import type { TrashablePromise } from 'trashable';

type RegisterPromiseType = <T>(promise: Promise<T>) => TrashablePromise<T>;

export type TrashableReactProps = {
  registerPromise: RegisterPromiseType,
};

type Key = number;

function makeComponentTrashable<Config: *>(
  Component: AbstractComponent<Config>
): AbstractComponent<$Diff<Config, TrashableReactProps>> {
  class TrashableComponent extends React.Component<Config> {
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

    registerPromise: RegisterPromiseType = <T>(
      promise: Promise<T>
    ): TrashablePromise<T> => {
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
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default makeComponentTrashable;
