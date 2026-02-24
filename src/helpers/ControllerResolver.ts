/**
 * @module ControllerResolver
 * @description Helper for lazily resolving controller instances from the tsyringe DI container.
 * Avoids calling `container.resolve()` at module load time, which would run before
 * `registerDependencies()` has been called.
 */

import { container } from 'tsyringe';

/**
 * Returns a factory function that resolves a controller instance from the DI container
 * on first call, then caches it in a closure for subsequent calls.
 *
 * @remarks
 * This is closure-based memoization, not DI-level singleton registration.
 * The controller's singleton lifecycle is still determined by how it is registered
 * in the container - this just defers the resolution until the first request.
 *
 * @param controller - Constructor of the controller class to resolve
 * @returns A zero-argument factory that returns the resolved controller instance
 */
export function resolveController<T>(controller: new (...args: any[]) => T):  () => T {
    let instance: T;
    return () => {
        if (!instance) {
            instance = container.resolve(controller);
        }
        return instance;
    }
}