import {expect,test} from "vitest";
import {scoreOpportunity} from "@/lib/recommendations/score";
import {demoOpportunities,demoProfile,demoPreferences} from "@/lib/demo";
import {deadline,statusAt} from "@/lib/utils/dates";
test('perfect matches are 100 and reasons are grounded',()=>{const o={...demoOpportunities()[0],confidence_score:95,last_verified_at:new Date().toISOString()};const s=scoreOpportunity(o,demoProfile,demoPreferences);expect(s.score).toBe(100);expect(s.reasons).toContain('In Lahore');});
test('closed and wrong audience listings are penalized and score stays bounded',()=>{const o={...demoOpportunities()[0],status:'registration_closed' as const,student_eligible:false};expect(scoreOpportunity(o,demoProfile,demoPreferences).score).toBe(0);});
test('custom budgets compare only matching currencies',()=>{const o={...demoOpportunities()[0],is_free:false,price_amount:10,currency:'USD'};const s=scoreOpportunity(o,demoProfile,{...demoPreferences,budget:'custom',budget_amount:100});expect(s.reasons).not.toContain('Within your budget');});
test('deadline boundaries and terminal statuses',()=>{const now=Date.parse('2026-09-18T12:00:00Z');expect(deadline('2026-09-18T12:00:00Z',now)).toBe('Registration closed');expect(deadline('2026-09-19T11:00:00Z',now)).toBe('Less than 1 day left');const o=demoOpportunities()[0];expect(statusAt({...o,status:'cancelled'},now)).toBe('cancelled');expect(statusAt({...o,end_at:'2026-01-01',start_at:'2026-01-01'},now)).toBe('archived');});
