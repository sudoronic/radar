import { PGlite } from '@electric-sql/pglite';
import { readFileSync,readdirSync } from 'node:fs';
import { expect,test } from 'vitest';
export async function testDatabase(){
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
 for(const file of readdirSync('supabase/migrations').sort()){
 if(file.includes('schedule')) continue;
 await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 }
 return db;
}
test('migrations apply and RLS isolates profiles; metadata cannot make an admin',async()=>{
 const db=await testDatabase();
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 await db.exec(`insert into auth.users(id) values('${a}'),('${b}'); set role authenticated; select set_config('request.jwt.claim.sub','${a}',false);`);
 expect((await db.query('select * from public.profiles')).rows).toHaveLength(1);
 expect((await db.query<{is_admin:boolean}>('select public.is_admin()')).rows[0].is_admin).toBe(false);
 await expect(db.exec(`insert into private.admin_roles values('${a}')`)).rejects.toThrow();
 await expect(db.exec(`update profiles set id='${b}' where id='${a}'`)).rejects.toThrow();
 await db.close();
});
test('public catalogue excludes review and fictional rows and keeps source configuration private',async()=>{
 const db=await testDatabase();
 await db.exec(`insert into opportunities(slug,title,category,status) values('public','Public workshop','workshops','active'),('review','Review workshop','workshops','needs_review'); insert into opportunities(slug,title,category,status,is_demo) values('demo','Demo workshop','workshops','active',true); set role anon;`);
 expect((await db.query('select slug from opportunities')).rows).toEqual([{slug:'public'}]);
 await expect(db.query('select * from sources')).rejects.toThrow();
 await expect(db.exec("insert into opportunities(slug,title,category) values('bad','Bad workshop','workshops')")).rejects.toThrow();
 await db.close();
});
