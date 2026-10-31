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
    assert.equal(db.tasks[0].name,'Checklist Block');
    assert.equal(db.blocks.filter(b=>b.task_id===id).length,1);
    const legacy = JSON.parse(JSON.stringify(db));legacy.tasks[0].name='Old checklist';legacy.blocks[0].task_name='Old checklist';
    const restored = C.validateDatabase(legacy);
    assert.equal(restored.tasks[0].name,'Checklist Block');assert.equal(restored.blocks[0].task_name,'Checklist Block');
    assert.equal(restored.tasks[0].checklist[0].text,'Book dentist');
    assert.equal(restored.tasks[0].checklist[0].done,true);
    C.setBlockStatus(db,blocks[0].id,'completed');
    assert.equal(db.tasks[0].status,'completed');
    assert.equal(db.tasks[0].checklist[1].done,false); // Time and checklist progress are independent.
    db.blocks[0].task_name='Historical label';
    assert.equal(C.validateDatabase(db).blocks[0].task_name,'Historical label');
  });
  test(`${file}: a checklist block stays unslotted when only fragmented time is available`, async () => {
    const db=C.empty();C.setWindows(db,'2026-11-02',[[540,570],[600,630]]);
    C.addTask(db,task({kind:'checklist',duration:40,checklist:[]}));
    C.addTask(db,task({duration:40,min_chunk:20,max_chunk:20}));
    await C.planDay(db,'2026-11-02');
    const day=C.snapshot(db,'2026-11-02');
    assert.equal(day.tasks[0].unslotted_minutes,40);assert.equal(day.tasks[1].scheduled_minutes,40);
    assert.equal(day.blocks.filter(b=>b.task_id===1).length,0);
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
