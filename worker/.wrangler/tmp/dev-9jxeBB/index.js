var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-s0RAb7/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-s0RAb7/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// index.js
var worker_default = {
  async email(message, env, ctx) {
    try {
      console.log(`\u{1F4E7} Processing email from ${message.from} to ${message.to}`);
      const emailMatch = message.to.match(/test-([a-zA-Z0-9]+)@/);
      const testId = emailMatch ? emailMatch[1] : null;
      if (!testId) {
        console.error("\u274C No test ID found in email address");
        return;
      }
      const headers = {};
      for (const [key, value] of message.headers) {
        headers[key.toLowerCase()] = value;
      }
      const rawEmail = await streamToArrayBuffer(message.raw);
      const emailText = new TextDecoder().decode(rawEmail);
      const analysis = await analyzeEmail(message, headers, emailText, env);
      const result = {
        testId,
        from: message.from,
        to: message.to,
        subject: headers["subject"] || "No Subject",
        analysis,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      await env.EMAIL_RESULTS.put(
        `test:${testId}`,
        JSON.stringify(result),
        { expirationTtl: 86400 }
        // 24 hours
      );
      console.log(`\u2705 Analysis complete for test ${testId}`);
      if (env.WEBHOOK_URL) {
        await notifyWebhook(env.WEBHOOK_URL, result);
      }
    } catch (error) {
      console.error("\u274C Email worker error:", error);
    }
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (url.pathname.startsWith("/api/results/")) {
      const testId = url.pathname.split("/").pop();
      if (request.method === "GET") {
        const result = await env.EMAIL_RESULTS.get(`test:${testId}`);
        if (!result) {
          return new Response(JSON.stringify({ error: "Test results not found" }), {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        return new Response(result, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "email-analysis-worker" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    return new Response("Not Found", { status: 404 });
  }
};
async function analyzeEmail(message, headers, emailText, env) {
  const analysis = {
    spfPass: false,
    dkimPass: false,
    dmarcPass: false,
    spamScore: 0,
    spamIndicators: [],
    recommendations: [],
    headers: {},
    details: {}
  };
  const spfResult = checkSPF(headers);
  analysis.spfPass = spfResult.pass;
  analysis.details.spf = spfResult.details;
  if (!spfResult.pass) {
    analysis.spamScore += 2;
    analysis.spamIndicators.push("SPF check failed");
    analysis.recommendations.push("Configure SPF records for your domain");
  }
  const dkimResult = checkDKIM(headers);
  analysis.dkimPass = dkimResult.pass;
  analysis.details.dkim = dkimResult.details;
  if (!dkimResult.pass) {
    analysis.spamScore += 2;
    analysis.spamIndicators.push("DKIM signature missing or invalid");
    analysis.recommendations.push("Enable DKIM signing for your email");
  }
  const dmarcResult = checkDMARC(headers);
  analysis.dmarcPass = dmarcResult.pass;
  analysis.details.dmarc = dmarcResult.details;
  if (!dmarcResult.pass) {
    analysis.spamScore += 1;
    analysis.spamIndicators.push("DMARC check failed");
    analysis.recommendations.push("Set up DMARC policy for your domain");
  }
  const contentChecks = analyzeContent(headers, emailText);
  analysis.spamScore += contentChecks.score;
  analysis.spamIndicators.push(...contentChecks.indicators);
  analysis.recommendations.push(...contentChecks.recommendations);
  const headerChecks = analyzeHeaders(headers);
  analysis.spamScore += headerChecks.score;
  analysis.spamIndicators.push(...headerChecks.indicators);
  analysis.recommendations.push(...headerChecks.recommendations);
  analysis.headers = headerChecks.important;
  if (analysis.spamScore === 0) {
    analysis.assessment = "Excellent - Very likely to reach inbox";
  } else if (analysis.spamScore <= 2) {
    analysis.assessment = "Good - Likely to reach inbox";
  } else if (analysis.spamScore <= 5) {
    analysis.assessment = "Fair - May reach spam folder";
  } else {
    analysis.assessment = "Poor - Likely to be marked as spam";
  }
  return analysis;
}
__name(analyzeEmail, "analyzeEmail");
function checkSPF(headers) {
  const authResults = headers["authentication-results"] || "";
  const received = headers["received-spf"] || "";
  const spfPass = authResults.includes("spf=pass") || received.includes("pass");
  const spfFail = authResults.includes("spf=fail") || received.includes("fail");
  const spfSoftfail = authResults.includes("spf=softfail") || received.includes("softfail");
  return {
    pass: spfPass,
    details: spfPass ? "SPF passed" : spfFail ? "SPF failed" : spfSoftfail ? "SPF softfail" : "No SPF record found"
  };
}
__name(checkSPF, "checkSPF");
function checkDKIM(headers) {
  const authResults = headers["authentication-results"] || "";
  const dkimSignature = headers["dkim-signature"] || "";
  const dkimPass = authResults.includes("dkim=pass");
  const hasDkim = dkimSignature.length > 0;
  return {
    pass: dkimPass,
    details: dkimPass ? "DKIM signature valid" : hasDkim ? "DKIM signature present but not validated" : "No DKIM signature"
  };
}
__name(checkDKIM, "checkDKIM");
function checkDMARC(headers) {
  const authResults = headers["authentication-results"] || "";
  const dmarcPass = authResults.includes("dmarc=pass");
  const dmarcFail = authResults.includes("dmarc=fail");
  return {
    pass: dmarcPass,
    details: dmarcPass ? "DMARC passed" : dmarcFail ? "DMARC failed" : "No DMARC policy found"
  };
}
__name(checkDMARC, "checkDMARC");
function analyzeContent(headers, emailText) {
  const indicators = [];
  const recommendations = [];
  let score = 0;
  const subject = headers["subject"] || "";
  const contentLower = emailText.toLowerCase();
  const spamWords = ["viagra", "cialis", "lottery", "winner", "claim now", "click here", "act now", "limited time"];
  const foundSpamWords = spamWords.filter((word) => contentLower.includes(word));
  if (foundSpamWords.length > 0) {
    score += foundSpamWords.length;
    indicators.push(`Contains spam trigger words: ${foundSpamWords.join(", ")}`);
    recommendations.push("Avoid using spam trigger words in your email");
  }
  const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
  if (capsRatio > 0.5 && subject.length > 5) {
    score += 1;
    indicators.push("Excessive capitalization in subject line");
    recommendations.push("Use normal capitalization in subject line");
  }
  const exclamationCount = (subject.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    score += 1;
    indicators.push("Excessive exclamation marks in subject");
    recommendations.push("Limit exclamation marks in subject line");
  }
  const linkCount = (emailText.match(/https?:\/\//g) || []).length;
  if (linkCount > 10) {
    score += 2;
    indicators.push("Excessive number of links");
    recommendations.push("Reduce the number of links in your email");
  }
  const shorteners = ["bit.ly", "tinyurl.com", "goo.gl", "t.co"];
  const hasShorteners = shorteners.some((shortener) => contentLower.includes(shortener));
  if (hasShorteners) {
    score += 1;
    indicators.push("Contains URL shorteners");
    recommendations.push("Use full URLs instead of URL shorteners");
  }
  if (emailText.trim().length < 50) {
    score += 1;
    indicators.push("Email content is very short");
    recommendations.push("Add more meaningful content to your email");
  }
  return { score, indicators, recommendations };
}
__name(analyzeContent, "analyzeContent");
function analyzeHeaders(headers) {
  const indicators = [];
  const recommendations = [];
  let score = 0;
  const important = {
    from: headers["from"] || "Unknown",
    returnPath: headers["return-path"] || "Not set",
    messageId: headers["message-id"] || "Not set",
    date: headers["date"] || "Not set"
  };
  if (!headers["return-path"]) {
    score += 1;
    indicators.push("Missing Return-Path header");
    recommendations.push("Ensure Return-Path header is set");
  }
  if (!headers["message-id"]) {
    score += 1;
    indicators.push("Missing Message-ID header");
    recommendations.push("Ensure Message-ID header is present");
  }
  if (headers["from"] && headers["return-path"]) {
    const fromDomain = extractDomain(headers["from"]);
    const returnPathDomain = extractDomain(headers["return-path"]);
    if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
      score += 0.5;
      indicators.push("From domain differs from Return-Path domain");
      recommendations.push("Align From and Return-Path domains when possible");
    }
  }
  if (!headers["date"]) {
    score += 0.5;
    indicators.push("Missing Date header");
    recommendations.push("Include Date header in email");
  }
  return { score, indicators, recommendations, important };
}
__name(analyzeHeaders, "analyzeHeaders");
function extractDomain(email) {
  const match = email.match(/@([^\s>]+)/);
  return match ? match[1].toLowerCase() : null;
}
__name(extractDomain, "extractDomain");
async function notifyWebhook(webhookUrl, result) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });
  } catch (error) {
    console.error("Webhook notification failed:", error);
  }
}
__name(notifyWebhook, "notifyWebhook");
async function streamToArrayBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done)
      break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}
__name(streamToArrayBuffer, "streamToArrayBuffer");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-s0RAb7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-s0RAb7/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
