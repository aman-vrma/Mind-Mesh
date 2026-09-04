/**
 * Deterministic content generation for LOCAL MOCK AI MODE.
 * Keyword matching + templates — task-adapted text, no external model.
 */

const TECH_RISKS = [
  { id: 'token-bucket', term: /token bucket/i, component: 'Rate Limiter', tech: 'Token Bucket (Redis-backed)', purpose: 'Smooth, bursty-tolerant rate limiting',
    risk: 'a single in-memory token bucket won\'t stay consistent across multiple app instances',
    mitigation: 'back the bucket counters with a shared store like Redis, decremented atomically via a Lua script' },
  { id: 'redis', term: /redis/i, component: 'Cache / Shared State', tech: 'Redis', purpose: 'Fast shared state and caching',
    risk: 'a single Redis node is a single point of failure and a throughput ceiling',
    mitigation: 'move to Redis Cluster (or a managed HA Redis) with sentinel-based failover' },
  { id: 'websocket', term: /websocket/i, component: 'Realtime Gateway', tech: 'WebSocket', purpose: 'Real-time bidirectional delivery',
    risk: 'WebSocket connections don\'t survive a server restart or load-balancer failover without reconnect logic',
    mitigation: 'add heartbeat pings plus client-side reconnect/backoff, and make sessions resumable via shared state' },
  { id: 'object-storage', term: /object storage|\bS3\b/i, component: 'File Storage', tech: 'Object Storage (S3-compatible)', purpose: 'Durable file storage',
    risk: 'large files sent as a single PUT can time out or fail outright on flaky connections',
    mitigation: 'switch to multipart/chunked upload so a dropped connection only has to retry one chunk' },
  { id: 'multipart', term: /multipart/i, component: 'Upload Handler', tech: 'Multipart Upload', purpose: 'Reliable large-file transfer',
    risk: 'abandoned multipart sessions left behind by failed uploads quietly accumulate storage cost',
    mitigation: 'add a lifecycle rule that aborts/cleans up incomplete multipart uploads after a TTL' },
  { id: 'queue', term: /\bqueue\b|message broker/i, component: 'Message Queue', tech: 'Queue (SQS/RabbitMQ-style)', purpose: 'Asynchronous decoupling of work',
    risk: 'a message that keeps failing processing can block the whole queue behind it',
    mitigation: 'cap retries with exponential backoff and route repeat failures to a dead-letter queue (DLQ)' },
  { id: 'dlq', term: /\bDLQ\b|dead[- ]letter/i, component: 'Dead-Letter Queue', tech: 'DLQ', purpose: 'Isolating failed messages',
    risk: 'without alerting on the DLQ, failed messages can sit there unnoticed indefinitely',
    mitigation: 'wire a monitor/alert on DLQ depth so failures surface immediately' },
  { id: 'idempotency', term: /idempoten/i, component: 'Idempotency Layer', tech: 'Idempotency Keys', purpose: 'Duplicate-safe request handling',
    risk: 'idempotency keys held only in memory are lost on restart, re-opening the door to duplicate processing',
    mitigation: 'persist idempotency keys in a durable store with a TTL' },
  { id: 'jwt', term: /\bJWT\b/i, component: 'Auth Tokens', tech: 'JWT', purpose: 'Stateless access tokens',
    risk: 'a long-lived JWT can\'t be revoked before it expires if it\'s ever compromised',
    mitigation: 'keep access tokens short-lived and pair them with a revocable refresh token' },
  { id: 'oauth', term: /OAuth/i, component: 'Identity Provider Flow', tech: 'OAuth', purpose: 'Third-party sign-in',
    risk: 'the OAuth redirect flow is a common target for open-redirect and CSRF-style attacks if the state parameter isn\'t checked',
    mitigation: 'strictly validate the OAuth `state` parameter and use a tight redirect-URI allow-list' },
  { id: 'session', term: /\bsession\b/i, component: 'Session Store', tech: 'Server-Side Sessions', purpose: 'Authenticated session state',
    risk: 'sessions pinned to one instance break horizontal scaling and fail over ungracefully',
    mitigation: 'externalize session storage (Redis/DB) so any instance can serve any session' },
  { id: 'replica', term: /replica/i, component: 'Read Replicas', tech: 'DB Read Replicas', purpose: 'Horizontal read scaling',
    risk: 'read replicas introduce replication lag, so a client can write and then immediately read stale data',
    mitigation: 'route read-after-write operations to the primary, or track replication offset per client' },
  { id: 'cache', term: /\bcache\b/i, component: 'Cache Layer', tech: 'Cache', purpose: 'Reduced read latency',
    risk: 'cache and database can drift out of sync under concurrent writes (a classic invalidation bug)',
    mitigation: 'use a short TTL plus explicit invalidation on write, rather than relying on TTL alone' },
  { id: 'partition', term: /partition|shard/i, component: 'Partitioning Strategy', tech: 'Partitioning/Sharding', purpose: 'Horizontal write scaling',
    risk: 'a poor partition key choice can create hot shards that dominate load',
    mitigation: 'pick a partition key with high cardinality and an even access distribution' },
  { id: 'load-balancer', term: /load balancer/i, component: 'Load Balancer', tech: 'Load Balancer', purpose: 'Traffic distribution',
    risk: 'the load balancer itself, if not deployed redundantly, becomes a single point of failure',
    mitigation: 'run the load balancer in an HA pair, or use a managed one' },
  { id: 'database', term: /\bdatabase\b/i, component: 'Database', tech: 'Relational/Document DB', purpose: 'System of record',
    risk: 'a single database instance can\'t absorb a traffic spike without added read capacity',
    mitigation: 'add read replicas and connection pooling ahead of the write path' },
];

const GENERIC_RISK = {
  risk: 'the proposal doesn\'t say how failures are surfaced — a silent failure is worse than a loud one',
  mitigation: 'add structured logging and basic alerting around the critical path',
};

const EDGE_CASES = [
  'a burst of concurrent requests arrives at exactly the same moment',
  'a downstream dependency becomes temporarily unavailable mid-request',
  'the same request is retried and arrives twice',
  'the service restarts while work is in flight',
];

function pick(arr, seedText) {
  const seed = (seedText || '').length;
  return arr[seed % arr.length];
}

function extractMatches(text) {
  if (!text) return [];
  const seen = new Set();
  const matches = [];
  for (const entry of TECH_RISKS) {
    if (entry.term.test(text) && !seen.has(entry.id)) {
      seen.add(entry.id);
      matches.push(entry);
    }
  }
  return matches;
}

const DOMAIN_KB = [
  { id: 'rate-limiter', match: /rate limit/i,
    build: (task) => `For "${task}", I'd start with a token bucket algorithm for smooth-but-bursty limiting, backed by Redis so the counters are shared across all app instances rather than living in local memory. Each client gets a key like rate:{clientId} with a TTL-refilled bucket, and the check-and-decrement happens atomically. For very high traffic I'd partition the counters by client ID hash so no single key becomes a hot key.` },
  { id: 'chat', match: /chat (app|application|system)|messaging (app|service|system)/i,
    build: (task) => `For "${task}", the core is a WebSocket layer for real-time delivery, sitting in front of a message service that persists every message to a database before broadcasting it. I'd keep the WebSocket servers stateless and put presence/session data in Redis so any instance can serve any client. Message history reads go through a paginated API backed by the database.` },
  { id: 'file-upload', match: /file upload|upload service/i,
    build: (task) => `For "${task}", I'd use object storage (S3-compatible) as the source of truth for files, with the API issuing pre-signed URLs so uploads go client-to-storage directly. For anything sizeable I'd use multipart upload so a flaky connection only has to retry one chunk, not the whole file. A validation step (type/size checks) runs before the file is marked available.` },
  { id: 'webhook', match: /webhook/i,
    build: (task) => `For "${task}", inbound webhooks land on a lightweight receiver that does minimal validation and immediately pushes the event onto a queue rather than processing inline. Workers pull from the queue with retries and exponential backoff; anything that keeps failing goes to a DLQ. Each event carries an idempotency key so redelivered webhooks don't get processed twice.` },
  { id: 'auth', match: /auth(entication|orization)?|\blogin\b|\bsso\b/i,
    build: (task) => `For "${task}", I'd use JWT access tokens (short-lived, ~15 minutes) plus a longer-lived refresh token, with OAuth available for third-party sign-in. The refresh token's session state lives server-side so it can be revoked, while the access token itself stays stateless for fast verification.` },
  { id: 'db-scaling', match: /database scal|scale.*database|db scal/i,
    build: (task) => `For "${task}", the first lever is read replicas to take read traffic off the primary, paired with a cache in front of the hottest queries. Once a single primary can't take the write volume, I'd partition the data by a high-cardinality key like tenant ID so no single shard becomes a hot spot.` },
];

function buildProposal(task) {
  const domain = DOMAIN_KB.find((d) => d.match.test(task));
  const body = domain
    ? domain.build(task)
    : `For "${task}", I'd start with a clear separation between the API layer, a stateless service layer, and a database as the source of truth, with a cache in front of the hottest reads. A load balancer sits in front of multiple stateless service instances for horizontal scaling, and a queue handles anything that doesn't need to happen synchronously in the request path.`;
  return `Gemini — Architect:\n${body}`;
}

function buildReview(task, proposalText) {
  const matches = extractMatches(proposalText);
  const primary = matches[0] || GENERIC_RISK;
  const secondary = matches[1] || GENERIC_RISK;
  const edge = pick(EDGE_CASES, task);
  return (
    `OpenRouter — Reviewer:\n` +
    `Looking at the proposal for "${task}", it's a reasonable starting point, but a few things stand out:\n` +
    `- Weakness 1: ${primary.risk}\n` +
    `- Weakness 2: ${secondary.risk}\n` +
    `- Edge case: what happens if ${edge}? The proposal doesn't say.\n` +
    `Recommended fix: ${primary.mitigation}`
  );
}

function buildRevision(task, proposalText, critiqueText) {
  const weaknessMatch = (critiqueText || '').match(/Weakness 1:\s*(.+)/);
  const fixMatch = (critiqueText || '').match(/Recommended fix:\s*(.+)/);
  const weakness = weaknessMatch ? weaknessMatch[1].trim() : 'the concern you raised';
  const fix = fixMatch ? fixMatch[1].trim() : 'harden the weak point you identified';

  return (
    `Gemini — Architect:\n` +
    `Agreed on the point that ${weakness}. I'll ${fix}.\n\n` +
    `Updated design for "${task}":\n${(proposalText || '').replace(/^Gemini — Architect:\s*/, '')}\n\n` +
    `Additional hardening: ${fix}. I'm also adding basic monitoring/alerting around the components above so failures surface quickly instead of silently.`
  );
}

function buildConsensus(task, critiqueText, revisionText) {
  const matches = extractMatches(revisionText).slice(0, 5);
  const rows = matches.length
    ? matches.map((m) => `| ${m.component} | ${m.tech} | ${m.purpose} |`)
    : ['| API | Express | Request handling |', '| Database | Relational/Document DB | System of record |'];

  const weakness1 = ((critiqueText || '').match(/Weakness 1:\s*(.+)/) || [])[1] || 'a robustness gap in the initial design';
  const weakness2 = ((critiqueText || '').match(/Weakness 2:\s*(.+)/) || [])[1] || 'a scalability concern in the initial design';
  const fix = ((critiqueText || '').match(/Recommended fix:\s*(.+)/) || [])[1] || 'harden the identified weak point';

  return (
    `# Final Consensus Blueprint: ${task}\n\n` +
    `## Summary\n` +
    `"${task}" is addressed by the design below, which incorporates the reviewer's feedback before being finalized.\n\n` +
    `## Architecture\n\n` +
    `| Component | Technology | Purpose |\n` +
    `|---|---|---|\n` +
    `${rows.join('\n')}\n\n` +
    `## Review Highlights\n` +
    `- ${weakness1}\n` +
    `- ${weakness2}\n\n` +
    `## Mitigations Applied\n` +
    `- ${fix}\n` +
    `- Monitoring/alerting added around the components discussed above.\n`
  );
}

function buildChatGreeting() {
  return `Gemini — Architect:\nHey! I'm the Architect. I turn your ideas into system designs — and my peer OpenRouter tries to poke holes in them before they ship.`;
}

function buildChatReviewerIntro() {
  return `OpenRouter — Reviewer:\nAnd I'm the Reviewer. I try to find the holes in those designs before they become problems. Throw a real task at us any time.`;
}

function buildChatSynthesis() {
  return `Together we're MindMesh — one designs, the other challenges it.`;
}

module.exports = {
  TECH_RISKS,
  extractMatches,
  buildProposal,
  buildReview,
  buildRevision,
  buildConsensus,
  buildChatGreeting,
  buildChatReviewerIntro,
  buildChatSynthesis,
};