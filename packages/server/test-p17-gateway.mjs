/**
 * MADEL Studio Bridge — Phase P17 Mandatory Gateway Test Suite
 * Developed & Maintained by Mahmoud Adel
 * Verifies Request Scoping, WorkLimiter, Resource Queues, Cancellation, and Stress Resistance
 */

import assert from "node:assert";
import {
  createRequestContext,
  runWithRequestContext,
  getCurrentRequestContext,
  getCorrelationId,
  getRequestAbortSignal,
  WorkLimiter,
  ConcurrencyManager,
  GatewayError,
  GatewayErrorCode,
} from "./dist/gateway/index.js";
import { withToolContext, currentToolCall } from "./dist/tools/call-context.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

console.log("=== MADEL STUDIO BRIDGE — P17 GATEWAY & CONCURRENCY TEST SUITE ===");
console.log(`Node version: ${process.version}`);

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    console.error(err.stack);
    failed++;
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  // 1. FIFO Execution Order
  await runTest("1. FIFO execution order in WorkLimiter", async () => {
    const limiter = new WorkLimiter({ concurrency: 1 });
    const executed = [];

    const tasks = [1, 2, 3, 4, 5].map((num) =>
      limiter.execute(async () => {
        await delay(20);
        executed.push(num);
        return num;
      })
    );

    const results = await Promise.all(tasks);
    assert.deepStrictEqual(results, [1, 2, 3, 4, 5]);
    assert.deepStrictEqual(executed, [1, 2, 3, 4, 5]);
    assert.strictEqual(limiter.active, 0);
    assert.strictEqual(limiter.pending, 0);
  });

  // 2. Same-Resource Concurrency Limit
  await runTest("2. Same-resource strict concurrency limit (concurrency = 1)", async () => {
    const limiter = new WorkLimiter({ concurrency: 1 });
    let maxObservedActive = 0;

    const tasks = Array.from({ length: 6 }).map(() =>
      limiter.execute(async () => {
        if (limiter.active > maxObservedActive) maxObservedActive = limiter.active;
        await delay(25);
        if (limiter.active > maxObservedActive) maxObservedActive = limiter.active;
        return true;
      })
    );

    await Promise.all(tasks);
    assert.strictEqual(maxObservedActive, 1, `Observed active tasks exceeded 1: ${maxObservedActive}`);
  });

  // 3. Cross-Resource Parallel Execution
  await runTest("3. Cross-resource independent parallel execution", async () => {
    const cm = new ConcurrencyManager();
    const startTime = Date.now();

    // Schedule 3 tasks on 3 distinct resource scopes
    const p1 = cm.schedule("photoshop:mutation", async () => {
      await delay(60);
      return "ps_done";
    });

    const p2 = cm.schedule("blender:mutation", async () => {
      await delay(60);
      return "bl_done";
    });

    const p3 = cm.schedule("audio:ffmpeg", async () => {
      await delay(60);
      return "audio_done";
    });

    const results = await Promise.all([p1, p2, p3]);
    const duration = Date.now() - startTime;

    assert.deepStrictEqual(results, ["ps_done", "bl_done", "audio_done"]);
    // Since they ran in parallel on distinct resources, duration must be ~60ms, strictly < 150ms
    assert.ok(duration < 150, `Cross-resource execution took too long (${duration}ms), should be parallel`);
  });

  // 4. Queue Overflow Rejection
  await runTest("4. Queue overflow rejection (Backpressure guard)", async () => {
    const limiter = new WorkLimiter({ concurrency: 1, maxQueueSize: 2 });

    // 1 active task
    const t1 = limiter.execute(async () => {
      await delay(80);
      return "t1";
    });

    // 2 queued tasks (filling queue capacity)
    const t2 = limiter.execute(async () => "t2");
    const t3 = limiter.execute(async () => "t3");

    // 4th task should be rejected immediately due to queue overflow
    let overflowCaught = false;
    try {
      await limiter.execute(async () => "t4");
    } catch (err) {
      overflowCaught = true;
      assert.ok(err instanceof GatewayError);
      assert.strictEqual(err.code, GatewayErrorCode.QUEUE_OVERFLOW);
      assert.strictEqual(err.rpcCode, -32001);
      assert.strictEqual(err.httpStatus, 429);
    }

    assert.ok(overflowCaught, "Expected queue overflow error was not thrown");
    await Promise.all([t1, t2, t3]);
  });

  // 5. Queue Wait Timeout
  await runTest("5. Queue wait timeout rejection", async () => {
    const limiter = new WorkLimiter({ concurrency: 1, queueWaitTimeoutMs: 40 });

    // Task 1 blocks the slot for 100ms
    const t1 = limiter.execute(async () => {
      await delay(100);
      return "t1";
    });

    // Task 2 waits in queue, should timeout after 40ms before acquiring the slot
    let timeoutCaught = false;
    try {
      await limiter.execute(async () => "t2");
    } catch (err) {
      timeoutCaught = true;
      assert.ok(err instanceof GatewayError);
      assert.strictEqual(err.code, GatewayErrorCode.QUEUE_WAIT_TIMEOUT);
      assert.strictEqual(err.rpcCode, -32002);
      assert.strictEqual(err.httpStatus, 504);
    }

    assert.ok(timeoutCaught, "Expected queue wait timeout error was not thrown");
    await t1;
  });

  // 6. Execution Timeout
  await runTest("6. Execution timeout rejection", async () => {
    const limiter = new WorkLimiter({ concurrency: 1, executionTimeoutMs: 50 });

    let timeoutCaught = false;
    try {
      await limiter.execute(async () => {
        // Run longer than 50ms execution timeout
        await delay(120);
        return "unreachable";
      });
    } catch (err) {
      timeoutCaught = true;
      assert.ok(err instanceof GatewayError);
      assert.strictEqual(err.code, GatewayErrorCode.EXECUTION_TIMEOUT);
      assert.strictEqual(err.rpcCode, -32003);
      assert.strictEqual(err.retryable, false); // Crucial: non-retryable for safe mutations
    }

    assert.ok(timeoutCaught, "Expected execution timeout error was not thrown");
  });

  // 7. Queued Cancellation
  await runTest("7. Queued cancellation via AbortSignal", async () => {
    const limiter = new WorkLimiter({ concurrency: 1 });
    const controller = new AbortController();

    // Block slot with t1
    const t1 = limiter.execute(async () => {
      await delay(60);
      return "t1";
    });

    // Queue t2 with abort signal
    const t2Promise = limiter.execute(async () => "t2", { signal: controller.signal });

    assert.strictEqual(limiter.pending, 1);

    // Cancel t2 while still queued
    controller.abort("User cancelled prompt");

    let cancelCaught = false;
    try {
      await t2Promise;
    } catch (err) {
      cancelCaught = true;
      assert.ok(err instanceof GatewayError);
      assert.strictEqual(err.code, GatewayErrorCode.REQUEST_CANCELLED);
      assert.strictEqual(err.details?.queued, true);
    }

    assert.ok(cancelCaught, "Expected cancellation error was not thrown");
    // Queue size should drop immediately back to 0
    assert.strictEqual(limiter.pending, 0);
    await t1;
  });

  // 8. Client Disconnect (Cancel All Client Queued Tasks)
  await runTest("8. Client disconnect eviction across queues", async () => {
    const cm = new ConcurrencyManager();

    // Slot occupied
    const active = cm.schedule("photoshop:mutation", async () => {
      await delay(60);
      return "active";
    });

    // Queue 3 tasks for client A, and 1 for client B
    const a1 = cm.schedule("photoshop:mutation", async () => "a1", { clientId: "client-A" });
    const a2 = cm.schedule("photoshop:mutation", async () => "a2", { clientId: "client-A" });
    const b1 = cm.schedule("photoshop:mutation", async () => "b1", { clientId: "client-B" });

    // Client A disconnects
    const cancelledCount = cm.onClientDisconnect("client-A", "Transport connection reset");
    assert.strictEqual(cancelledCount, 2);

    let a1Failed = false;
    let a2Failed = false;
    try {
      await a1;
    } catch {
      a1Failed = true;
    }
    try {
      await a2;
    } catch {
      a2Failed = true;
    }

    assert.ok(a1Failed && a2Failed, "Client A tasks were not cancelled");

    // Client B task should execute and resolve cleanly
    const bResult = await b1;
    assert.strictEqual(bResult, "b1");
    await active;
  });

  // 9. Request Context Isolation
  await runTest("9. Request context isolation across concurrent async branches", async () => {
    const branchCount = 20;
    const branches = Array.from({ length: branchCount }, (_, i) => {
      const expectedReqId = `req-branch-${i}`;
      const expectedCorrId = `corr-branch-${i}`;

      const ctx = createRequestContext({
        requestId: expectedReqId,
        correlationId: expectedCorrId,
        toolName: `test_tool_${i}`,
      });

      return runWithRequestContext(ctx, async () => {
        // Random interleaved delays to stress async state preservation
        await delay(Math.floor(Math.random() * 30) + 10);
        const current = getCurrentRequestContext();

        assert.ok(current, "Context missing in async branch");
        assert.strictEqual(current.requestId, expectedReqId);
        assert.strictEqual(current.correlationId, expectedCorrId);

        await delay(Math.floor(Math.random() * 20) + 5);
        assert.strictEqual(getCorrelationId(), expectedCorrId);

        return i;
      });
    });

    const results = await Promise.all(branches);
    assert.strictEqual(results.length, branchCount);
  });

  // 10. Correlation ID Propagation
  await runTest("10. Correlation ID propagation to deep nested functions", async () => {
    const correlationId = "corr-unique-998877";
    const ctx = createRequestContext({ correlationId, toolName: "deep_test" });

    async function deepLeaf() {
      await delay(10);
      return getCorrelationId();
    }

    async function intermediate() {
      await delay(10);
      return deepLeaf();
    }

    const res = await runWithRequestContext(ctx, async () => {
      return intermediate();
    });

    assert.strictEqual(res, correlationId);
  });

  // 11. Recovery After Failed Task
  await runTest("11. Automatic recovery and execution slot release after task failure", async () => {
    const limiter = new WorkLimiter({ concurrency: 1 });

    let failedCaught = false;
    try {
      await limiter.execute(async () => {
        throw new Error("ActionDescriptor failed in host");
      });
    } catch (err) {
      failedCaught = true;
      assert.strictEqual(err.message, "ActionDescriptor failed in host");
    }

    assert.ok(failedCaught);
    assert.strictEqual(limiter.active, 0);

    // Subsequent task must execute without deadlock
    const nextResult = await limiter.execute(async () => {
      return "recovered_ok";
    });
    assert.strictEqual(nextResult, "recovered_ok");
  });

  // 12. Graceful Shutdown
  await runTest("12. Graceful shutdown evicts pending queue and drains active tasks", async () => {
    const limiter = new WorkLimiter({ concurrency: 1 });

    let activeFinished = false;
    const active = limiter.execute(async () => {
      await delay(50);
      activeFinished = true;
      return "active_done";
    });

    // 2 queued tasks
    const q1 = limiter.execute(async () => "q1");
    const q2 = limiter.execute(async () => "q2");

    // Initiate shutdown
    const shutdownPromise = limiter.shutdown(150);

    let q1Evicted = false;
    let q2Evicted = false;
    try {
      await q1;
    } catch (err) {
      q1Evicted = err.code === GatewayErrorCode.GATEWAY_SHUTDOWN;
    }
    try {
      await q2;
    } catch (err) {
      q2Evicted = err.code === GatewayErrorCode.GATEWAY_SHUTDOWN;
    }

    assert.ok(q1Evicted && q2Evicted, "Pending tasks were not evicted with GATEWAY_SHUTDOWN");

    await shutdownPromise;
    assert.ok(activeFinished, "Active task did not finish cleanly during drain");
    assert.strictEqual(await active, "active_done");
  });

  // 13. Memory and Resource Cleanup
  await runTest("13. High-volume memory and resource cleanup (1,000 rapid cycles)", async () => {
    const limiter = new WorkLimiter({ concurrency: 5, maxQueueSize: 2000 });

    const promises = Array.from({ length: 1000 }).map((_, i) =>
      limiter.execute(async () => i)
    );

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 1000);
    assert.strictEqual(limiter.active, 0);
    assert.strictEqual(limiter.pending, 0);
  });

  // 14. Backward Compatibility with Existing Tool Call Context
  await runTest("14. Backward compatibility with currentToolCall and withToolContext", async () => {
    const server = new McpServer({ name: "compat-test", version: "1.0.0" });
    const { registerTool } = withToolContext(server);

    let capturedInCallback = null;
    let capturedContext = null;

    registerTool("test_compat_tool", { description: "test" }, async (args) => {
      capturedInCallback = currentToolCall();
      capturedContext = getCurrentRequestContext();
      return { content: [{ type: "text", text: "ok" }] };
    });

    // Invoke registered handler directly
    const registered = server._registeredTools["test_compat_tool"];
    assert.ok(registered, "Tool was not registered");

    await registered.handler({ key: "val" }, { requestId: "req-compat-001" });

    assert.ok(capturedInCallback, "currentToolCall was undefined");
    assert.strictEqual(capturedInCallback.tool, "test_compat_tool");
    assert.deepStrictEqual(capturedInCallback.args, { key: "val" });

    assert.ok(capturedContext, "RequestContext was not created");
    assert.strictEqual(capturedContext.toolName, "test_compat_tool");
    assert.strictEqual(capturedContext.requestId, "req-compat-001");
  });

  // 15. Observability and Metrics Aggregation
  await runTest("15. Observability and metrics aggregation for future Dashboard", async () => {
    const cm = new ConcurrencyManager();

    await cm.schedule("photoshop:mutation", async () => {
      await delay(15);
      return "ps1";
    });

    await cm.schedule("blender:mutation", async () => {
      await delay(10);
      return "bl1";
    });

    const snapshot = cm.getMetrics();
    assert.ok(snapshot.timestamp > 0);
    assert.strictEqual(snapshot.totals.completedRequests, 2);
    assert.strictEqual(snapshot.totals.failedRequests, 0);
    assert.strictEqual(snapshot.totals.cancelledRequests, 0);

    const psMetric = snapshot.resources["photoshop:mutation"];
    assert.ok(psMetric);
    assert.strictEqual(psMetric.completedRequests, 1);
    assert.ok(psMetric.avgExecutionMs > 0);
  });

  // 16. Multi-Client Stress Test (Concurrent Mock Clients)
  await runTest("16. Multi-client stress test (5 simulated clients, 50 requests)", async () => {
    const cm = new ConcurrencyManager();
    const clients = ["claude-code", "openai-codex", "google-antigravity", "cursor-ide", "roo-code"];
    const tools = [
      { app: "photoshop", tool: "ps_create_document", mutation: true },
      { app: "photoshop", tool: "ps_get_preview", mutation: false },
      { app: "blender", tool: "blender_render", mutation: true },
      { app: "audio", tool: "audio_normalize_loudness", mutation: true },
      { app: "system", tool: "cc_connected_apps", mutation: false },
    ];

    const requests = Array.from({ length: 50 }, (_, i) => {
      const clientId = clients[i % clients.length];
      const target = tools[i % tools.length];
      const scope = cm.resolveScope(target.app, target.tool, target.mutation);

      const ctx = createRequestContext({
        requestId: `req-stress-${i}`,
        correlationId: `corr-stress-${i}`,
        clientId,
        applicationId: target.app,
        toolName: target.tool,
      });

      return runWithRequestContext(ctx, () =>
        cm.schedule(scope, async () => {
          await delay(Math.floor(Math.random() * 15) + 5);
          return { id: i, client: clientId, tool: target.tool };
        })
      );
    });

    const results = await Promise.all(requests);
    assert.strictEqual(results.length, 50);

    const metrics = cm.getMetrics();
    assert.strictEqual(metrics.totals.completedRequests, 50);
    assert.strictEqual(metrics.totals.failedRequests, 0);
    assert.strictEqual(metrics.totals.activeRequests, 0);
    assert.strictEqual(metrics.totals.pendingRequests, 0);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner crash:", err);
  process.exit(1);
});
