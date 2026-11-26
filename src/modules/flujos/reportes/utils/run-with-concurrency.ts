/** Runs `worker` over `items` with at most `limit` calls in flight: `limit` workers share a
 *  cursor and each takes the next index when it finishes. Results keep the order of `items`. */
export async function runWithConcurrency<T, R>(
    items: T[],
    limit: number,
    worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;

    const runNext = async (): Promise<void> => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await worker(items[index], index);
        }
    };

    const workerCount = Math.max(1, Math.min(limit, items.length));
    await Promise.all(Array.from({ length: workerCount }, runNext));

    return results;
}
