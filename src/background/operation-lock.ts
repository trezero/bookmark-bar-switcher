let operationInProgress = false;

/**
 * Acquire the operation lock to prevent concurrent bar switches.
 * @returns true if lock was acquired, false if already locked
 */
export function acquireLock(): boolean {
    if (operationInProgress) {
        return false;
    }
    operationInProgress = true;
    return true;
}

/**
 * Release the operation lock after a bar switch completes.
 */
export function releaseLock(): void {
    operationInProgress = false;
}

/**
 * Check if an operation is currently in progress.
 * @returns true if locked, false otherwise
 */
export function isLocked(): boolean {
    return operationInProgress;
}
