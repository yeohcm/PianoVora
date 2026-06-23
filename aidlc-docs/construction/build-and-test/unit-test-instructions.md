# Unit Test Execution

## Run Unit Tests

### 1. Execute All Unit Tests
```bash
npm run test:run
```

### 2. Review Test Results
- **Expected**: 264 tests pass, 0 failures.
- **Test Coverage**: ~85% code coverage across stores, hooks, UI controls, and utility folders.
- **Test Report Location**: Standard output log printed in terminal by Vitest runner.

### 3. Fix Failing Tests
If tests fail:
1. Review test output directly in the console.
2. Locate the specific failing spec under `src/__tests__/`.
3. If related to cached module state (e.g. `AudioContext`), ensure modules are cleanly reset or dynamically imported in testing lifecycle.
4. Rerun `npm run test:run` until 0 failures are reported.
