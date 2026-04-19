import type { TestContext } from '../../testing/db';

export async function seedPlayer(ctx: TestContext): Promise<void> {
    await ctx.playerService.register('alice', 'password123');
}
