import { effect, Signal } from '@basics/core/client/core';

/**
 * A `Signal<string>` two-way bridged to service state, for `SelectComponent`
 * (which owns a value signal, not a change callback). `read` is tracked so
 * service→signal stays reactive; the signal→service `write` is deferred to a
 * microtask so its own service reads aren't tracked — otherwise the effect
 * would re-subscribe to those signals and loop.
 *
 * A deferred write is dropped when the signal has moved on since it was
 * queued. Without that, a value that changes twice in one tick (A then B)
 * queues write(A) and write(B); write(A) puts the service back on A, which
 * re-queues write(A), write(B) undoes it, and the two chains overwrite each
 * other forever. `selectCourse` produces exactly that on a course whose
 * convention default differs from its club-role default: `tees` lands first,
 * `courseTeeRoles` second.
 */
export function bound(
    track: (d: () => void) => void,
    read: () => string,
    write: (v: string) => void,
): Signal<string> {
    const sig = new Signal(read());
    track(effect(() => sig.set(read())));
    track(
        effect(() => {
            const v = sig.get();
            queueMicrotask(() => {
                if (sig.get() === v) write(v);
            });
        }),
    );
    return sig;
}
