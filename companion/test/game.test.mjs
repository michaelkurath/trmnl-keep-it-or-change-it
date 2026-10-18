import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {ensureRound,submitVote,roundId,closesAt,decision,DAY} from '../lib/game.ts';
import fs from 'node:fs';
const migration=fs.readFileSync('drizzle/0000_fuzzy_morg.sql','utf8').replaceAll('--> statement-breakpoint','');
function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(migration);
 let now=Date.parse('2026-10-18T19:59:00Z');sqlite.function('unixepoch',()=>Math.floor(now/1000));
 const db={prepare(sql){const args=[];return{bind(...a){args.push(...a);return this},async first(){return sqlite.prepare(sql).get(...args)??null},async all(){return{results:sqlite.prepare(sql).all(...args)}},async run(){return sqlite.prepare(sql).run(...args)}}},async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 return{db,sqlite,get now(){return now},advance(ms=DAY){now+=ms}};
}
test('20:00 UTC is a single global boundary, including DST dates',()=>{
 for(const date of ['2026-03-29','2026-10-25']){const before=roundId(Date.parse(date+'T19:59:59Z'));assert.equal(roundId(Date.parse(date+'T20:00:00Z')),before+1);assert.equal(closesAt(before),date+'T20:00:00.000Z')}
});
test('majority, ties and zero votes follow the stated rule',()=>{assert.equal(decision(2,3),'change');assert.equal(decision(3,2),'keep');assert.equal(decision(2,2),'keep');assert.equal(decision(0,0),'keep')});
test('simultaneous first visits initialise just one round',async()=>{const f=fixture();await Promise.all(Array.from({length:8},()=>ensureRound(f.db,f.now,8)));assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM rounds').get().n,1)});
test('repeated or conflicting submissions count only once and keep the first choice',async()=>{const f=fixture();const r=await ensureRound(f.db,f.now,8);await Promise.all([submitVote(f.db,r,'voter','keep'),submitVote(f.db,r,'voter','change')]);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM votes').get().n,1);assert.equal(await submitVote(f.db,r,'voter','change'),'keep')});
test('change majority retires the picture once, resets its age and freezes the totals',async()=>{const f=fixture();const r=await ensureRound(f.db,f.now,8);await submitVote(f.db,r,'a','change');await submitVote(f.db,r,'b','change');await submitVote(f.db,r,'c','keep');f.advance();const next=await ensureRound(f.db,f.now,8);assert.equal(next.image,1);assert.equal(next.image_start,next.id);for(let i=0;i<5;i++)assert.equal((await ensureRound(f.db,f.now,8)).image,1);const prev=f.sqlite.prepare('SELECT * FROM rounds WHERE id=?').get(r.id);assert.equal(prev.keep_count,1);assert.equal(prev.change_count,2)});
test('ties and empty rounds retain the image and its original birthday',async()=>{const f=fixture();const r=await ensureRound(f.db,f.now,8);await submitVote(f.db,r,'a','keep');await submitVote(f.db,r,'b','change');f.advance();const second=await ensureRound(f.db,f.now,8);assert.equal(second.image,0);assert.equal(second.image_start,r.id);f.advance();const third=await ensureRound(f.db,f.now,8);assert.equal(third.image,0);assert.equal(third.image_start,r.id)});
test('database cutoff rejects a request delayed past the deadline, even before settlement',async()=>{const f=fixture();const r=await ensureRound(f.db,f.now,8);f.advance(60000);assert.equal(await submitVote(f.db,r,'late','change'),null);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM votes').get().n,0)});
test('several inactive days do not rotate an image repeatedly or invent votes',async()=>{const f=fixture();const r=await ensureRound(f.db,f.now,8);await submitVote(f.db,r,'a','change');f.advance(8*DAY);const next=await ensureRound(f.db,f.now,8);assert.equal(next.image,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM rounds').get().n,2);f.advance(9*DAY);const later=await ensureRound(f.db,f.now,8);assert.equal(later.image,1);assert.equal(later.id-later.image_start+1,10)});
test('starter pool wraps only after its final image is changed',async()=>{const f=fixture();let r=await ensureRound(f.db,f.now,2);await submitVote(f.db,r,'a','change');f.advance();r=await ensureRound(f.db,f.now,2);assert.equal(r.image,1);await submitVote(f.db,r,'a','change');f.advance();r=await ensureRound(f.db,f.now,2);assert.equal(r.image,0)});
