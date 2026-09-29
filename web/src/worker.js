/**
 * Monad Pet's server side for the agent-jobs embed: a tiny Worker in front of the static site.
 *
 * - POST /attest        (Bearer MONADPET_ATTEST_SECRET) {subject, statement} → the server signs the statement with its
 *                       key and stores it by subject: an `attested` deliverable (agent-jobs ADR-0006 amendment) the
 *                       hired agent submits as proof a quest happened in the game.
 * - GET  /attest/<subject>  the stored descriptor, public.
 * - POST /evidence      (Bearer) {jobId, submissionHash, policyHash, evaluator, chainId, statement} → an EIP-712
 *                       EvidenceAttestation signed by the same key, for the board to relay on-chain once the key is a
 *                       registered verifier.
 * - POST /hooks         agent-jobs webhooks, verified with AGENT_JOBS_WEBHOOK_SECRET (HMAC-SHA256), logged.
 * - anything else       the static site.
 *
 * Secrets (wrangler secret put): MONADPET_SERVER_PRIVATE_KEY, MONADPET_ATTEST_SECRET, AGENT_JOBS_WEBHOOK_SECRET.
 */
import { hashMessage, keccak256, stringToHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', ...headers } })

const EVIDENCE_TYPES = {
  EvidenceAttestation: [
    { name: 'jobId', type: 'uint256' },
    { name: 'submissionHash', type: 'bytes32' },
    { name: 'policyHash', type: 'bytes32' },
    { name: 'repo', type: 'bytes32' },
    { name: 'headSha', type: 'bytes32' },
    { name: 'testedSha', type: 'bytes32' },
    { name: 'checkRunsHash', type: 'bytes32' },
    { name: 'conclusion', type: 'uint8' },
    { name: 'validUntil', type: 'uint256' },
  ],
}

function authorized(request, secret) {
  const h = request.headers.get('authorization') || ''
  return secret !== undefined && secret !== '' && h === `Bearer ${secret}`
}

async function hmacOk(secret, body, header) {
  if (!secret || !header) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
  const hex = `sha256=${[...sig].map((b) => b.toString(16).padStart(2, '0')).join('')}`
  if (hex.length !== header.length) return false
  let diff = 0
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ header.charCodeAt(i)
  return diff === 0
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const { pathname } = url
    if (request.method === 'OPTIONS' && (pathname.startsWith('/attest') || pathname === '/evidence')) {
      return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' } })
    }

    if (pathname === '/attest' && request.method === 'POST') {
      if (!authorized(request, env.MONADPET_ATTEST_SECRET)) return json({ ok: false, error: 'unauthorized' }, 401)
      const { subject, statement } = await request.json().catch(() => ({}))
      if (typeof subject !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(subject) || typeof statement !== 'string' || statement.length === 0 || statement.length > 2000) {
        return json({ ok: false, error: 'subject must be a 0x address and statement a short text' }, 400)
      }
      const account = privateKeyToAccount(env.MONADPET_SERVER_PRIVATE_KEY)
      const sig = await account.signMessage({ message: statement })
      const descriptor = { kind: 'attested', issuer: account.address.toLowerCase(), statement, sig }
      await env.ATTESTATIONS.put(subject.toLowerCase(), JSON.stringify({ ...descriptor, at: Math.floor(Date.now() / 1000) }), { expirationTtl: 30 * 24 * 3600 })
      return json({ ok: true, deliverable: descriptor })
    }

    const attest = /^\/attest\/(0x[0-9a-fA-F]{40})$/.exec(pathname)
    if (attest !== null && request.method === 'GET') {
      const stored = await env.ATTESTATIONS.get(attest[1].toLowerCase())
      if (stored === null) return json({ ok: false, error: 'no attestation for this subject yet' }, 404)
      const { at, ...deliverable } = JSON.parse(stored)
      return json({ ok: true, deliverable, at })
    }

    if (pathname === '/evidence' && request.method === 'POST') {
      if (!authorized(request, env.MONADPET_ATTEST_SECRET)) return json({ ok: false, error: 'unauthorized' }, 401)
      const b = await request.json().catch(() => ({}))
      for (const k of ['jobId', 'submissionHash', 'policyHash', 'evaluator', 'chainId', 'statement']) if (b[k] === undefined) return json({ ok: false, error: `missing ${k}` }, 400)
      const account = privateKeyToAccount(env.MONADPET_SERVER_PRIVATE_KEY)
      const attestation = {
        jobId: String(b.jobId),
        submissionHash: b.submissionHash,
        policyHash: b.policyHash,
        repo: keccak256(stringToHex('monad-pet')),
        headSha: b.submissionHash,
        testedSha: b.submissionHash,
        checkRunsHash: keccak256(stringToHex(String(b.statement))),
        conclusion: b.conclusion === 'failure' ? 2 : 1,
        validUntil: String(Math.floor(Date.now() / 1000) + 7 * 24 * 3600),
      }
      const signature = await account.signTypedData({
        domain: { name: 'AgentJobsEvaluator', version: '1', chainId: Number(b.chainId), verifyingContract: b.evaluator },
        types: EVIDENCE_TYPES,
        primaryType: 'EvidenceAttestation',
        message: { ...attestation, jobId: BigInt(attestation.jobId), validUntil: BigInt(attestation.validUntil) },
      })
      return json({ ok: true, attestation, signature, verifier: account.address, statementHash: hashMessage(String(b.statement)) })
    }

    if (pathname === '/hooks' && request.method === 'POST') {
      const body = await request.text()
      const ok = await hmacOk(env.AGENT_JOBS_WEBHOOK_SECRET, body, request.headers.get('x-agent-jobs-signature'))
      if (!ok) return json({ ok: false, error: 'bad signature' }, 401)
      let event
      try {
        event = JSON.parse(body)
      } catch {
        return json({ ok: false, error: 'not json' }, 400)
      }
      console.log(`agent-jobs webhook ${event.type} ${event.id} board=${event.boardId} ${JSON.stringify(event.payload)}`)
      await env.ATTESTATIONS.put(`hook:${event.id}`, body, { expirationTtl: 7 * 24 * 3600 })
      return json({ ok: true })
    }

    return env.ASSETS.fetch(request)
  },
}
