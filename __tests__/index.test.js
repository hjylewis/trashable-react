import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';

import makeComponentTrashable from '../src/index';

configure({ adapter: new Adapter() });

class Component extends React.Component {}
const TrashableComponent = makeComponentTrashable(Component);

describe('makeComponentTrashable()', () => {
  it('has display name', () => {
    expect(TrashableComponent.displayName).toEqual('Trashable(Component)');
    const wrapper = shallow(<TrashableComponent />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('has internal state', () => {
    const wrapper = shallow(<TrashableComponent />);
    expect(wrapper.instance().promiseStore).toBeDefined();
    expect(wrapper.instance().key).toBeDefined();
  });

  it('can add promises', () => {
    const wrapper = shallow(<TrashableComponent />);
    const key = wrapper.instance().key;
    const promise = Promise.resolve();
    expect(wrapper.instance().addPromise(promise)).toBe(key);
    expect(wrapper.instance().promiseStore[key]).toBe(promise);
    expect(wrapper.instance().key).toBe(key + 1);
  });

  it('can remove promises', () => {
    const key = 0;
    const wrapper = shallow(<TrashableComponent />);
    wrapper.instance().promiseStore[key] = Promise.resolve();
    expect(wrapper.instance().promiseStore[key]).toBeDefined();
    wrapper.instance().removePromise(key);
    expect(wrapper.instance().promiseStore[key]).toBeUndefined();
  });

  it('trashes promise when unmounted', () => {
    const wrapper = shallow(<TrashableComponent />);
    const promiseStore = wrapper.instance().promiseStore;
    const mocks = [];
    for (let i = 0; i < 10; i++) {
      mocks.push(jest.fn());
      promiseStore[i] = {
        trash: mocks[i],
      };
    }
    wrapper.instance().componentWillUnmount();
    mocks.forEach(mock => {
      expect(mock).toHaveBeenCalled();
    });
  });

  describe('registerPromise', () => {
    it('adds a promise to store', () => {
      const wrapper = shallow(<TrashableComponent />);
      const key = wrapper.instance().key;
      expect(wrapper.instance().promiseStore[key]).toBeUndefined();
      wrapper.instance().registerPromise(Promise.resolve());
      expect(wrapper.instance().promiseStore[key]).toBeDefined();
    });

    it('returns promise that passes the original resolved value', () => {
      const value = 'foo';
      const wrapper = shallow(<TrashableComponent />);
      const trashable = wrapper
        .instance()
        .registerPromise(Promise.resolve(value));
      return trashable.then(ret => {
        expect(ret).toEqual(value);
      });
    });

    it('returns promise that passes the original rejected value', () => {
      const value = 'foo';
      const wrapper = shallow(<TrashableComponent />);
      const trashable = wrapper
        .instance()
        .registerPromise(Promise.reject(value));
      return trashable.catch(ret => {
        expect(ret).toEqual(value);
      });
    });

    it('returns a trashable promise', () => {
      const timeoutPromise = delay => {
        return new Promise(resolve => {
          setTimeout(resolve, delay);
        });
      };

      const wrapper = shallow(<TrashableComponent />);
      const trashable = wrapper.instance().registerPromise(timeoutPromise(50));
      expect(trashable.trash).toBeDefined();
      const mock = jest.fn();
      trashable.then(mock);
      trashable.trash();
      return timeoutPromise(100).then(() => {
        expect(mock).not.toHaveBeenCalled();
      });
    });

    it('removes promise from store when resolves', () => {
      const wrapper = shallow(<TrashableComponent />);
      const key = wrapper.instance().key;
      let resolve;
      const promise = new Promise(_resolve => {
        resolve = _resolve;
      });
      const trashable = wrapper.instance().registerPromise(promise);
      expect(wrapper.instance().promiseStore[key]).toBeDefined();
      resolve();
      return trashable.then(() => {
        expect(wrapper.instance().promiseStore[key]).toBeUndefined();
      });
    });

    it('removes promise from store when rejects', () => {
      const wrapper = shallow(<TrashableComponent />);
      const key = wrapper.instance().key;
      let reject;
      const promise = new Promise((resove, _reject) => {
        reject = _reject;
      });
      const trashable = wrapper.instance().registerPromise(promise);
      expect(wrapper.instance().promiseStore[key]).toBeDefined();
      reject();
      return trashable.catch(() => {
        expect(wrapper.instance().promiseStore[key]).toBeUndefined();
      });
    });

    it('passes a registerPromise prop', () => {
      const wrapper = shallow(<TrashableComponent />);
      expect(wrapper.find(Component).prop('registerPromise')).toBeTruthy();
    });
  });
});
