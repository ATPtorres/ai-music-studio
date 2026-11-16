interface Owner { stop: () => void }
let current: Owner | null = null

/** Tone has one shared transport, including while its audio permission is pending. */
export function claimPlayback(owner: Owner) {
  if (current && current !== owner) current.stop()
  current = owner
}
export function releasePlayback(owner: Owner) {
  if (current === owner) current = null
}
