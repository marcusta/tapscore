// DOM adapter for the committed @basics/core test suite.
//
// Bun exposes some web constructors (notably Event) even without a document.
// happy-dom elements reject those native events because they belong to a
// different realm, so merely filling missing globals is insufficient. Install
// the happy-dom event constructors explicitly from the SAME window as document.

import { GlobalWindow } from 'happy-dom';

const window = new GlobalWindow();

for (const key of Object.getOwnPropertyNames(window)) {
    if (!(key in globalThis)) {
        Object.defineProperty(globalThis, key, {
            value: (window as any)[key],
            writable: true,
            configurable: true,
        });
    }
}

for (const key of [
    'Event',
    'EventTarget',
    'CustomEvent',
    'MouseEvent',
    'KeyboardEvent',
    'FocusEvent',
    'InputEvent',
]) {
    const value = (window as any)[key];
    if (value !== undefined) {
        Object.defineProperty(globalThis, key, {
            value,
            writable: true,
            configurable: true,
        });
    }
}

Object.defineProperty(globalThis, 'document', {
    value: window.document,
    writable: true,
    configurable: true,
});
