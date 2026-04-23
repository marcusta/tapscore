// Side-effectful IO helpers kept out of the rendering code proper.

export function openPathInBrowser(filePath: string): void {
    const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    Bun.spawn([cmd, filePath]);
}
