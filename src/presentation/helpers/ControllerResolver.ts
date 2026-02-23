import { container } from 'tsyringe';

export function resolveController<T>(controller: new (...args: any[]) => T):  () => T {
    let instance: T;
    return () => {
        if (!instance) {
            instance = container.resolve(controller);
        }
        return instance;
    }
}