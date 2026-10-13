import { TutorError } from "./provider";
type Bucket = { count: number; active: number; until: number };
export class TutorLimits {
  private sessions = new Map<string, Bucket>();
  private global: Bucket = { count: 0, active: 0, until: 0 };
  acquire(session: string, now = Date.now()) {
    if (now >= this.global.until)
      this.global = {
        count: 0,
        active: this.global.active,
        until: now + 60000,
      };
    for (const [key, b] of this.sessions)
      if (b.until <= now && !b.active) this.sessions.delete(key);
    let b = this.sessions.get(session);
    if (!b) b = { count: 0, active: 0, until: now + 60000 };
    if (now >= b.until) {
      b.count = 0;
      b.until = now + 60000;
    }
    if (
      b.count >= 6 ||
      this.global.count >= 40 ||
      b.active >= 1 ||
      this.global.active >= 4 ||
      (this.sessions.size >= 1000 && !this.sessions.has(session))
    )
      throw new TutorError(
        "RATE_LIMIT",
        "Too many tutor requests. Wait a minute before asking again.",
        429,
      );
    b.count++;
    b.active++;
    this.global.count++;
    this.global.active++;
    this.sessions.set(session, b);
    let released = false;
    return () => {
      if (!released) {
        b!.active--;
        this.global.active--;
        released = true;
      }
    };
  }
}
export const tutorLimits = new TutorLimits();
