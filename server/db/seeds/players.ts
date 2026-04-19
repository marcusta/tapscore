import type { TestContext } from '../../testing/db';

export async function seedPlayer(ctx: TestContext): Promise<void> {
    await ctx.playerService.register({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice Andersson',
    });
}
