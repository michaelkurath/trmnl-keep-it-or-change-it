"use client";
import { useEffect, useState } from "react";
type State = { round_id: number; image_id: string; image_title: string; image_url: string; image_age: number; closes_at: string; choice: "keep" | "change" | null; previous: { decision: string; keep: number; change: number; total: number; title: string; closed_at: string } | null };
export default function Home() {
  const [data, setData] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  async function load() {
    try {
      const response = await fetch("/api/state", {cache: "no-store"});
      const value = await response.json() as State & {error?: string; refresh?: boolean};
      if (!response.ok) throw new Error(value.error);
      setData(previous => previous?.round_id === value.round_id && previous.choice && !value.choice ? {...value, choice: previous.choice} : value); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again shortly."); }
  }
  useEffect(() => { load(); const tick = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(tick); }, []);
  useEffect(() => { const poll = setInterval(load, 60_000); return () => clearInterval(poll); }, []);
  useEffect(() => { if (data && Date.parse(data.closes_at) <= now) { void load(); } }, [data, now]);
  async function vote(choice: "keep" | "change") {
    if (!data || busy || data.choice) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/vote", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({choice, round_id: data.round_id, image_id: data.image_id})});
      const value = await response.json() as State & {error?: string; refresh?: boolean};
      if (!response.ok) { if (value.refresh) await load(); throw new Error(value.error); }
      setData(value);
    } catch(e) { setError(e instanceof Error ? e.message : "Your vote could not be confirmed. Please retry."); }
    finally { setBusy(false); }
  }
  const seconds = data ? Math.max(0, Math.floor((Date.parse(data.closes_at) - now) / 1000)) : 0;
  const countdown = `${String(Math.floor(seconds / 3600)).padStart(2,"0")}:${String(Math.floor(seconds % 3600 / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`;
  return <main className="shell">
    <header className="masthead"><a href="/" className="wordmark" aria-label="Keep It or Change It home">KEEP IT<br/><span>OR CHANGE IT.</span></a><span className="edition">A SHARED<br/>IMAGE EXPERIMENT</span></header>
    <div className="intro"><p className="eyebrow"><span className="live-dot"/> ONE IMAGE. ALL OF US.</p><h1>Still worth<br/><em>another day?</em></h1><p className="lede">One image belongs to everyone.<br/>You decide how long it stays.</p></div>
    {data ? <>
      <figure className="artwork"><div className="picture"><img src={data.image_url} alt={data.image_title + ", an original monochrome illustration"} /></div><figcaption><span><strong>{data.image_title}</strong><small>ORIGINAL MONOCHROME STUDY</small></span><span className="age"><b>{String(data.image_age).padStart(2,"0")}</b><small>{data.image_age === 1 ? "DAY HERE" : "DAYS HERE"}</small></span></figcaption></figure>
      <section className="decision" aria-labelledby="decision-title"><div className="decision-heading"><h2 id="decision-title">{data.choice ? "You’ve had your say." : "Does it stay?"}</h2><span className="round-time">DECISION IN <b>{countdown}</b></span></div>
      <div className="buttons"><button className={"keep " + (data.choice === "keep" ? "selected" : "")} onClick={() => vote("keep")} disabled={busy || !!data.choice}><span className="button-symbol">{data.choice === "keep" ? "✓" : "+"}</span><span><strong>Keep it</strong><small>Give it another day.</small></span></button><button className={"change " + (data.choice === "change" ? "selected" : "")} onClick={() => vote("change")} disabled={busy || !!data.choice}><span className="button-symbol">{data.choice === "change" ? "✓" : "↗"}</span><span><strong>Change it</strong><small>Make room for something new.</small></span></button></div>
      <p className="vote-note" role="status">{busy ? "Recording your choice…" : data.choice ? `Your ${data.choice === "keep" ? "KEEP" : "CHANGE"} vote is saved. Come back after the decision.` : "One tap. One vote per browser today. No account needed."}</p>
      {error && <div className="error" role="alert">{error}</div>}
      </section>
      <section className="last-decision"><p className="eyebrow">THE LAST DECISION</p>{data.previous ? <><h3>{data.previous.decision === "change" ? "You made room for a new image." : "The image earned another day."}</h3><p>{data.previous.total === 0 ? "Nobody voted, so it stayed." : `${data.previous.keep} keep · ${data.previous.change} change${data.previous.keep === data.previous.change ? " · A tie keeps the image." : ""}`}</p><small>{data.previous.title} · {new Date(data.previous.closed_at).toLocaleDateString(undefined, {month:"short",day:"numeric"})}</small></> : <><h3>Every image starts somewhere.</h3><p>This is the first round. Its future is up to you.</p></>}</section>
    </> : <div className="loading" role="status">{error || "Bringing the image into view…"}{error && <button onClick={load}>Try again</button>}</div>}
    <details className="rules"><summary>A few simple rules <span>+</span></summary><p>Everyone sees the same image. Vote once per browser each round. The daily decision happens at 20:00 UTC{data ? ` (${new Date(data.closes_at).toLocaleTimeString(undefined, {hour:"2-digit",minute:"2-digit",timeZoneName:"short"})} your time)` : ""}. More CHANGE votes replaces the image; more KEEP votes lets it stay. A tie or no votes keeps it. Choices are final for the round, and totals stay hidden until it closes.</p><p>This is a casual experiment. Your browser remembers you with a cookie; using another browser or clearing cookies creates another identity. No email address is collected.</p></details>
    <footer><span>A LITTLE SAY IN WHAT STAYS.</span><a href="/preview">TRMNL screen preview ↗</a></footer>
  </main>;
}
