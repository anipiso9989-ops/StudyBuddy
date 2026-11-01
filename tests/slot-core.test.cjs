const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function loadCore(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const start = source.indexOf('const SlotCore = (() => {');
  const end = source.indexOf('\nconst SlotStore', start);
  return vm.runInNewContext(source.slice(start, end) + '\nSlotCore;', {URLSearchParams, setTimeout});
}
const task = (overrides = {}) => ({name:'Read', duration:60, priority:'medium', energy:'deep', target_date:'2026-11-02', deadline:'2026-11-02 17:00', ...overrides});
const rule = (overrides = {}) => ({name:'Work', start:'2026-11-02 09:00', end:'2026-11-02 12:00', weekdays:[1,3,5], ...overrides});
for (const file of ['Slot/Slot.html', 'StudyBuddy.html']) {
  const C = loadCore(file);
  test(`${file}: checklist and timed work share scheduling, without item estimates`, async () => {
    const db = C.empty();
    const id = C.addTask(db, task({name:undefined, kind:'checklist', duration:90, min_chunk:1, max_chunk:5, checklist:[{id:1,text:'Book appointment',done:false},{id:2,text:'Send invoice',done:false}]}));
    assert.equal(db.tasks[0].name,'Checklist Block');
    C.addTask(db, task());
    assert.equal(db.tasks[1].name,'Read');
    await C.planDay(db, '2026-11-02');
    const blocks = db.blocks.filter(b => b.task_id === id);
    assert.equal(blocks.length,1); assert.equal(blocks[0].end-blocks[0].start,90);
    assert.equal(C.snapshot(db,'2026-11-02').load.scheduled_minutes,150);
    const before = JSON.stringify(db.blocks);
    await C.dispatch(db,`/api/tasks/${id}/checklist/1`,'PATCH',{done:true});
    assert.equal(JSON.stringify(db.blocks),before);
    C.updateTask(db,id,{name:'Life admin',checklist:[{id:1,text:'Book dentist',done:true},{id:3,text:'Call bank',done:false}]});
    assert.equal(db.tasks[0].name,'Life admin');
    assert.equal(db.blocks.filter(b=>b.task_id===id).length,1);
    const legacy = JSON.parse(JSON.stringify(db));legacy.tasks[0].name='Old checklist';legacy.blocks[0].task_name='Old checklist';
    const restored = C.validateDatabase(legacy);
    assert.equal(restored.tasks[0].name,'Old checklist');assert.equal(restored.blocks[0].task_name,'Old checklist');
    assert.equal(restored.tasks[0].checklist[0].text,'Book dentist');
    assert.equal(restored.tasks[0].checklist[0].done,true);
    C.setBlockStatus(db,blocks[0].id,'completed');
    assert.equal(db.tasks[0].status,'completed');
    assert.equal(db.tasks[0].checklist[1].done,false); // Time and checklist progress are independent.
    db.blocks[0].task_name='Historical label';
    assert.equal(C.validateDatabase(db).blocks[0].task_name,'Historical label');
  });
  test(`${file}: fetch and edit every task field across dates; delete and restore safely`, async () => {
    const db=C.empty(),id=C.addTask(db,task());
    await C.planDay(db,'2026-11-02');
    const patch={name:'Revised',duration:90,priority:'high',energy:'shallow',min_chunk:15,max_chunk:45,target_date:'2026-11-04',deadline:'2026-11-04 16:00'};
    await C.dispatch(db,`/api/tasks/${id}`,'PATCH',patch);
    const fetched=await C.dispatch(db,`/api/tasks/${id}`);
    for(const [key,value] of Object.entries(patch))assert.equal(fetched[key],value,key);
    assert.equal(fetched.completed_minutes,0);assert.equal(fetched.remaining_minutes,90);
    assert.equal(db.blocks.length,2);assert.ok(db.blocks.every(b=>b.day==='2026-11-04'));assert.equal(C.snapshot(db,'2026-11-02').tasks.length,0);
    C.updateTask(db,id,{kind:'checklist',checklist:[{id:1,text:'Item',done:true}]});
    assert.equal(db.tasks[0].name,'Revised');assert.equal(db.tasks[0].single_block,true);assert.equal(db.tasks[0].max_chunk,90);
    await C.planDay(db,'2026-11-04');assert.equal(db.blocks.length,1);
    C.deleteTask(db,id);assert.equal(db.blocks.length,0);
    assert.equal(C.snapshot(db,'2026-11-04').tasks.length,0);
    assert.equal((await C.dispatch(db,'/api/upcoming?after=2026-11-01')).length,0);
    await assert.rejects(C.dispatch(db,`/api/tasks/${id}`),/Task not found/);
    C.restoreTask(db,id);assert.equal(db.tasks[0].checklist[0].done,true);
    C.updateTask(db,id,{kind:'timed',min_chunk:30,max_chunk:45});
    assert.equal(db.tasks[0].checklist.length,0);
    assert.doesNotThrow(()=>C.validateDatabase(db));
  });
  test(`${file}: completed and skipped tasks remain editable without losing history`, async () => {
    const db=C.empty(),id=C.addTask(db,task({duration:60,min_chunk:30,max_chunk:30}));
    await C.planDay(db,'2026-11-02');
    C.setBlockStatus(db,db.blocks[0].id,'completed');C.setBlockStatus(db,db.blocks[1].id,'skipped');
    const history=JSON.stringify(db.blocks);
    C.updateTask(db,id,{name:'After progress',target_date:'2026-11-03',deadline:'2026-11-03 17:00'});
    assert.equal(JSON.stringify(db.blocks),history);
    const fetched=await C.dispatch(db,`/api/tasks/${id}`);assert.equal(fetched.completed_minutes,30);assert.equal(fetched.remaining_minutes,30);
    assert.throws(()=>C.updateTask(db,id,{duration:29}),/already completed/);
    await C.planDay(db,'2026-11-03');C.setTaskStatus(db,id,'completed');
    C.updateTask(db,id,{name:'Finished rename'});assert.equal(db.tasks[0].status,'completed');
    const completed=JSON.stringify(db.blocks);
    C.deleteTask(db,id);assert.equal(JSON.stringify(db.blocks),completed);
    C.restoreTask(db,id);C.updateTask(db,id,{duration:90});assert.equal(db.tasks[0].status,'planned');
    assert.equal(C.completedMinutes(db,id),60);assert.doesNotThrow(()=>C.validateDatabase(db));
  });
  test(`${file}: fragmented checklist work uses the fewest sessions and reports unplaced work`, async () => {
    const db=C.empty();C.setWindows(db,'2026-11-02',[[540,570],[600,630]]);
    C.addTask(db,task({kind:'checklist',duration:40,checklist:[]}));
    C.addTask(db,task({duration:40,min_chunk:20,max_chunk:20}));
    const result=await C.planDay(db,'2026-11-02'),day=C.snapshot(db,'2026-11-02');
    assert.equal(day.tasks[0].scheduled_minutes,40);assert.equal(day.tasks[1].unslotted_minutes,40);
    assert.equal(day.blocks.filter(b=>b.task_id===1).length,2);
    assert.equal(result.notices[0].type,'split');assert.equal(result.notices[1].type,'unplaced');
    assert.match(result.notices[1].message,/Recommendation: choose another date/);
    assert.doesNotThrow(()=>C.validateDatabase(db));
  });
  test(`${file}: single block overrides manual chunk limits and survives backups`, async () => {
    const db=C.empty(),id=C.addTask(db,task({duration:120,min_chunk:25,max_chunk:30,single_block:true}));
    const result=await C.planDay(db,'2026-11-02');
    assert.equal(db.blocks.length,1);assert.equal(db.blocks[0].end-db.blocks[0].start,120);assert.equal(result.notices.length,0);
    const restored=C.validateDatabase(db);assert.equal(restored.tasks[0].single_block,true);
    C.updateTask(restored,id,{single_block:false,min_chunk:30,max_chunk:30});await C.planDay(restored,'2026-11-02');
    assert.equal(restored.blocks.length,4);assert.equal(restored.tasks[0].single_block,false);
    const legacy=JSON.parse(JSON.stringify(db));delete legacy.tasks[0].single_block;
    assert.equal(C.validateDatabase(legacy).tasks[0].single_block,false);
    assert.throws(()=>C.addTask(C.empty(),task({single_block:'true'})),/on or off/);
  });
  test(`${file}: single-block creation rejects impossible work atomically and recommends another date`, async () => {
    const db=C.empty();C.addTask(db,task({priority:'high',duration:60}));await C.planDay(db,'2026-11-02');
    const before=JSON.stringify(db);
    await assert.rejects(C.dispatch(db,'/api/tasks','POST',task({single_block:true,duration:600})),/cannot be added reliably.*Recommendation: choose another date.*Nothing was saved/);
    assert.equal(JSON.stringify(db),before);
    await assert.rejects(C.dispatch(db,'/api/tasks','POST',task({single_block:true,deadline:'2026-11-01 17:00'})),/Deadline is before/);
    assert.equal(JSON.stringify(db),before);
  });
  test(`${file}: creation previews splits, week generation reports them, checklist progress is shared`, async () => {
    const db=C.empty();C.setWindows(db,'2026-11-02',[[540,560],[600,620],[660,680],[720,760]]);
    const result=await C.dispatch(db,'/api/tasks','POST',task({kind:'checklist',duration:70,checklist:[{id:1,text:'Call',done:true}]}));
    assert.equal(result.notices[0].blocks,3);assert.match(result.notices[0].message,/was split automatically/);
    assert.equal(db.blocks.length,3); // Creation immediately applies the plan.
    const week=await C.planWeek(db,'2026-11-02');assert.equal(week.notices[0].blocks,3);
    const blocks=db.blocks.filter(b=>b.task_id===result.id);assert.equal(blocks.length,3);
    C.setBlockStatus(db,blocks[0].id,'completed');const done=C.completedMinutes(db,result.id);
    C.updateTask(db,result.id,{duration:done+20});
    await C.planDay(db,'2026-11-02');assert.equal(db.tasks[0].checklist[0].done,true);
    assert.equal(C.completedMinutes(db,result.id),done);assert.doesNotThrow(()=>C.validateDatabase(db));
  });
  test(`${file}: minimum-session search respects deadlines, other work, and its total budget`, () => {
    const preferred={id:1,remaining:40,latest:120,min_chunk:1,max_chunk:40,energy:'deep',single_block:true};
    const normal={id:2,remaining:20,latest:30,min_chunk:20,max_chunk:20,energy:'shallow',single_block:false};
    const fit=C.solvePlacement([preferred,normal],[[0,30],[60,120]]);
    assert.equal(fit.status,'feasible');assert.equal(fit.solution.filter(b=>b[0]===1).length,1);
    assert.ok(fit.solution.find(b=>b[0]===2)[2]<=30);
    const split=C.solvePlacement([preferred],[[0,15],[30,45],[60,90]]);
    assert.equal(split.status,'feasible');assert.equal(split.solution.length,2);
    assert.equal(C.solvePlacement([preferred],[[0,15],[30,45],[60,90]],0).status,'unknown');
    assert.equal(C.solvePlacement([{...preferred,latest:10}],[[20,60]]).status,'infeasible');
  });
  test(`${file}: preferred-session counts match independent exhaustive minute assignments`, () => {
    const gaps=[[0,3],[4,8]];
    for(const [a,b,deadline,secondPreferred] of [[4,2,3,false],[5,2,8,true],[2,4,7,false],[6,2,8,true],[3,3,8,false]]){
      const tasks=[{id:1,remaining:a,latest:8,min_chunk:1,max_chunk:a,energy:'deep',single_block:true},{id:2,remaining:b,latest:deadline,min_chunk:2,max_chunk:4,energy:'shallow',single_block:secondPreferred}];
      let best=Infinity;const minutes=Array(8).fill(0),counts=[0,0,0];
      function enumerate(time){
        if(time===8){
          if(counts[1]!==a||counts[2]!==b)return;
          let sessions=0;
          for(let start=0;start<8;){
            const id=minutes[start];let end=start+1;while(end<8&&minutes[end]===id)end++;
            if(id){const t=tasks[id-1];if(end>t.latest||end-start<t.min_chunk||end-start>t.max_chunk)return;if(t.single_block)sessions++;}
            start=end;
          }
          best=Math.min(best,sessions);return;
        }
        const free=gaps.some(([start,end])=>start<=time&&time<end);
        for(const id of free?[0,1,2]:[0]){
          if(id&&counts[id]>=tasks[id-1].remaining)continue;
          minutes[time]=id;counts[id]++;enumerate(time+1);counts[id]--;
        }
      }
      enumerate(0);const result=C.solvePlacement(tasks,gaps);
      assert.equal(result.status,Number.isFinite(best)?'feasible':'infeasible');
      if(Number.isFinite(best))assert.equal(result.solution.filter(block=>tasks[block[0]-1].single_block).length,best);
    }
  });
  test(`${file}: checklist survives regeneration, skip, tomorrow, trash and restore`, async () => {
    const db=C.empty(), id=C.addTask(db,task({kind:'checklist',duration:35,checklist:[{id:1,text:'Call',done:true}]}));
    await C.planDay(db,'2026-11-02');
    C.setBlockStatus(db,db.blocks[0].id,'skipped');
    await C.planDay(db,'2026-11-02');
    C.updateTask(db,id,{deadline:'2026-11-04 17:00'});
    await C.pushTomorrow(db,'2026-11-02');
    assert.equal(db.tasks[0].target_date,'2026-11-03');
    assert.equal(db.tasks[0].checklist[0].done,true);
    C.deleteTask(db,id);C.restoreTask(db,id);
    assert.equal(db.tasks[0].checklist[0].done,true);
    assert.doesNotThrow(()=>C.validateDatabase(db));
  });
  test(`${file}: recurrence respects weekdays, start date and future years`, async () => {
    const db=C.empty();C.saveCommitment(db,rule());
    for(const [day,count] of [['2026-11-01',0],['2026-11-02',1],['2026-11-03',0],['2026-11-04',1],['2026-11-06',1],['2027-11-01',1]]) assert.equal(C.dayCommitments(db,day).length,count,day);
    assert.equal(C.dayCommitments(db,'2026-11-09')[0].rule_start,'2026-11-02 09:00');
    assert.equal(C.snapshot(db,'2026-11-03').commitment_rules.length,1); // Series manageable on an off-day.
    C.addTask(db,task({duration:240,max_chunk:240}));
    await C.planDay(db,'2026-11-02');
    assert.ok(db.blocks.every(b=>b.start>=720));
    assert.equal(C.snapshot(db,'2026-11-02').load.usable_minutes,300);
    assert.doesNotThrow(()=>C.validateDatabase(db));
  });
  test(`${file}: daily rules, overnight tails, and midnight boundaries`, () => {
    const db=C.empty();C.saveCommitment(db,rule({start:'2026-11-02 22:00',end:'2026-11-03 02:00',weekdays:[0,1,2,3,4,5,6]}));
    assert.equal(C.dayCommitments(db,'2026-11-02').length,1);
    const next=C.dayCommitments(db,'2026-11-03');assert.equal(next.length,2);
    assert.deepEqual(Array.from(next,c=>[c.start_minute,c.end_minute]),[[0,120],[1320,1440]]);
    assert.throws(()=>C.saveCommitment(db,rule({start:'2026-11-10 01:00',end:'2026-11-10 03:00',weekdays:[]})),/overlaps/);
    assert.throws(()=>C.saveCommitment(C.empty(),rule({end:'2026-11-04 10:00',weekdays:[1,2]})),/overlap each other/);
    const midnight=C.empty();C.saveCommitment(midnight,rule({start:'2026-11-02 22:00',end:'2026-11-03 00:00',weekdays:[1]}));
    assert.equal(C.dayCommitments(midnight,'2026-11-03').length,0);
  });
  test(`${file}: conflicts are detected even far beyond the anchor week`, () => {
    const db=C.empty();C.saveCommitment(db,rule());
    assert.throws(()=>C.saveCommitment(db,rule({name:'Later work',start:'2030-01-01 11:00',end:'2030-01-01 13:00',weekdays:[3]})),/overlaps/);
    assert.throws(()=>C.saveCommitment(db,rule({start:'2030-01-02 11:00',end:'2030-01-02 13:00',weekdays:[]})),/overlaps/);
    assert.doesNotThrow(()=>C.saveCommitment(db,rule({start:'2030-01-02 12:00',end:'2030-01-02 13:00',weekdays:[]})));
    assert.doesNotThrow(()=>C.saveCommitment(db,rule({start:'2026-11-03 10:00',end:'2026-11-03 11:00',weekdays:[2,4]})));
  });
  test(`${file}: edit every rule property, convert recurrence and delete the series`, async () => {
    const db=C.empty(),id=C.saveCommitment(db,rule());
    for(const day of ['2026-11-02','2026-11-04','2026-11-09']){C.addTask(db,task({target_date:day,deadline:day+' 17:00'}));await C.planDay(db,day);}
    C.saveCommitment(db,{name:'Class',start:'2026-11-02 13:00',end:'2026-11-02 15:00',weekdays:[2,4]},id);
    assert.equal(db.blocks.length,0);assert.equal(C.dayCommitments(db,'2026-11-02').length,0);
    assert.equal(C.dayCommitments(db,'2026-11-03')[0].name,'Class');
    assert.equal(C.dayCommitments(db,'2026-11-03')[0].start_minute,780);
    C.saveCommitment(db,{weekdays:[]},id);
    assert.equal(C.dayCommitments(db,'2026-11-02').length,1);assert.equal(C.dayCommitments(db,'2026-11-03').length,0);
    C.saveCommitment(db,{weekdays:[0,1,2,3,4,5,6]},id);
    C.deleteCommitment(db,id);assert.equal(db.commitments.length,0);assert.equal(C.dayCommitments(db,'2030-01-01').length,0);
  });
  test(`${file}: completed history is preserved when a recurring rule changes`, async () => {
    const db=C.empty();C.addTask(db,task());await C.planDay(db,'2026-11-02');C.setBlockStatus(db,db.blocks[0].id,'completed');
    assert.throws(()=>C.saveCommitment(db,rule()),/completed work/);
    const history=JSON.stringify(db.blocks),id=C.saveCommitment(db,rule({start:'2026-11-02 12:00',end:'2026-11-02 13:00'}));
    C.saveCommitment(db,{name:'Lunch'},id);C.deleteCommitment(db,id);
    assert.equal(JSON.stringify(db.blocks),history);
  });
  test(`${file}: old backups still load; new backups preserve rules and reject corruption`, async () => {
    const db=C.empty();C.addTask(db,task());C.saveCommitment(db,rule({weekdays:[]}));
    delete db.tasks[0].kind;delete db.tasks[0].checklist;delete db.commitments[0].weekdays;
    const old=C.validateDatabase(db);assert.equal(old.tasks[0].kind,'timed');assert.equal(old.commitments[0].weekdays.length,0);
    C.saveCommitment(old,{weekdays:[1,3,5]},old.commitments[0].id);
    assert.equal(C.validateDatabase(old).commitments[0].weekdays.length,3);
    const invalid=JSON.parse(JSON.stringify(old));invalid.commitments[0].weekdays=[1,1];assert.throws(()=>C.validateDatabase(invalid),/once/);
    assert.throws(()=>C.addTask(old,task({kind:'checklist',checklist:[{id:1,text:'x',done:'yes'}]})),/checkmark/);
    const bad=JSON.parse(JSON.stringify(old));bad.commitments.push({...bad.commitments[0],id:bad.nextCommitmentId++});assert.throws(()=>C.validateDatabase(bad),/Overlapping/);
    assert.throws(()=>C.saveCommitment(old,{weekdays:['1']},1),/integer/);
  });
}
test('Standalone and bundled Slot template, core, store, and UI stay identical',()=>{
  const standalone=fs.readFileSync(path.join(root,'Slot/Slot.html'),'utf8'),bundle=fs.readFileSync(path.join(root,'StudyBuddy.html'),'utf8');
  const template=s=>s.slice(s.indexOf('<template id="source-slot">'),s.indexOf('</template>',s.indexOf('<template id="source-slot">'))+11);
  const mount=s=>s.slice(s.indexOf("'use strict';\n/* Slot standalone."),s.indexOf("\nroot.host.addEventListener('studybuddy:deactivate'",s.indexOf("'use strict';\n/* Slot standalone.")));
  assert.equal(template(standalone),template(bundle));assert.equal(mount(standalone),mount(bundle));
});
