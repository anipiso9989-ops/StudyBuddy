const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const task=(extra={})=>({name:'Mathematics',duration:60,priority:'medium',energy:'deep',target_date:'2026-11-02',deadline:'2026-11-04 17:00',min_chunk:30,max_chunk:60,...extra});
const clock=(today='2026-11-02',minute=0)=>({today,minute});
for(const file of ['Slot/Slot.html','StudyBuddy.html']){
 const src=fs.readFileSync(path.join(__dirname,'..',file),'utf8'),start=src.indexOf('const SlotCore = (() => {');
 const C=vm.runInNewContext(src.slice(start,src.indexOf('\nconst SlotStore',start))+'\nSlotCore;',{URLSearchParams,setTimeout});
 const act=(db,url,method,data,now=clock())=>C.dispatch(db,url,method,data,now);
 const planned=(db,id)=>db.blocks.filter(b=>b.status==='planned'&&(!id||b.task_id===id));
 test(`${file}: every scheduling input updates schedules without Plan`,async()=>{
  const db=C.empty();const {id}=await act(db,'/api/tasks','POST',task());
  assert.equal(planned(db,id)[0].start,540);
  const commitment=await act(db,'/api/commitments','POST',{name:'Lecture',start:'2026-11-02 09:00',end:'2026-11-02 11:00',weekdays:[]});
  assert.equal(planned(db,id)[0].start,660);
  await act(db,'/api/windows','PUT',{day:'2026-11-02',windows:[[720,900]]});assert.equal(planned(db,id)[0].start,720);
  await act(db,`/api/tasks/${id}`,'PATCH',{deadline:'2026-11-02 11:00'});assert.equal(planned(db,id).length,0);assert.match(db.tasks[0].reason,/before the deadline/);
  await act(db,`/api/tasks/${id}`,'PATCH',{target_date:'2026-11-03',deadline:'2026-11-03 17:00'});assert.equal(planned(db,id)[0].day,'2026-11-03');
  await act(db,`/api/tasks/${id}`,'DELETE',{});assert.equal(planned(db,id).length,0);
  await act(db,`/api/tasks/${id}/restore`,'POST',{});assert.equal(planned(db,id).length,1);
  await act(db,`/api/commitments/${commitment.id}`,'DELETE',{});
  await act(db,'/api/tasks/bulk','POST',{day:'2026-11-03',text:'Read, 30m, low, 2026-11-03 17:00, shallow'});
  assert.equal(planned(db).length,2);assert.doesNotThrow(()=>C.validateDatabase(db));
  const skipped=planned(db,id)[0];await act(db,`/api/blocks/${skipped.id}/status`,'POST',{status:'skipped'});
  assert.ok(planned(db).filter(b=>b.day===skipped.day).every(b=>b.start>=skipped.end||b.end<=skipped.start));
 });
 test(`${file}: manually kept times survive edits, conflict warnings, partial capacity and backups`,async()=>{
  const db=C.empty(),id=C.addTask(db,task({duration:120,min_chunk:60,max_chunk:60}));await C.planDay(db,'2026-11-02');
  const block=planned(db,id)[0];await act(db,`/api/blocks/${block.id}`,'PATCH',{start:840});
  await act(db,'/api/tasks','POST',task({name:'Other work',duration:30}));
  assert.equal(db.blocks.find(b=>b.id===block.id).start,840);
  await act(db,'/api/windows','PUT',{day:'2026-11-02',windows:[]});
  assert.equal(planned(db,id).length,1);assert.match(db.tasks.find(t=>t.id===id).reason,/Kept time conflicts/);
  assert.equal(C.snapshot(db,'2026-11-02').tasks.find(t=>t.id===id).unslotted_minutes,60);
  let restored=C.validateDatabase(db);assert.equal(restored.blocks.find(b=>b.id===block.id).manual,true);
  await assert.rejects(act(db,`/api/tasks/${id}`,'PATCH',{duration:180}),/Release/);
  await act(restored,`/api/blocks/${block.id}`,'PATCH',{manual:false});assert.equal(planned(restored,id).length,0);
  assert.doesNotThrow(()=>C.validateDatabase(restored));
 });
 test(`${file}: rollover finds the next feasible date and preserves partial completion and deadlines`,async()=>{
  const db=C.empty(),id=C.addTask(db,task({duration:90,min_chunk:30,max_chunk:30}));await C.planDay(db,'2026-11-02');
  C.setBlockStatus(db,planned(db,id)[0].id,'completed');const history=JSON.stringify(db.blocks.filter(b=>b.status==='completed'));
  C.setWindows(db,'2026-11-03',[]);C.setWindows(db,'2026-11-04',[[600,660]]);
  const result=await act(db,'/api/sync','POST',{day:'2026-11-03'},clock('2026-11-03'));
  const t=db.tasks.find(t=>t.id===id);assert.equal(result.moved,1);assert.equal(t.target_date,'2026-11-04');assert.equal(t.deadline,'2026-11-04 17:00');
  assert.equal(planned(db,id).reduce((n,b)=>n+b.end-b.start,0),60);assert.equal(JSON.stringify(db.blocks.filter(b=>b.status==='completed')),history);
  const once=JSON.stringify(db);await act(db,'/api/sync','POST',{day:'2026-11-03'},clock('2026-11-03'));assert.equal(JSON.stringify(db),once);
  assert.equal(C.validateDatabase(db).tasks[0].rolled_from,'2026-11-02');
  await act(db,'/api/windows','PUT',{day:'2026-11-03',windows:[[800,860]]},clock('2026-11-03'));assert.equal(t.target_date,'2026-11-03');
 });
 test(`${file}: overdue rollover is scheduled late and flagged; impossible work stays visible`,async()=>{
  const db=C.empty(),id=C.addTask(db,task({deadline:'2026-11-02 17:00'}));await C.planDay(db,'2026-11-02');
  await act(db,'/api/sync','POST',{day:'2026-11-03'},clock('2026-11-03',1000));
  assert.equal(db.tasks[0].target_date,'2026-11-04');assert.equal(db.tasks[0].deadline_warning,true);assert.match(db.tasks[0].reason,/original deadline/);
  assert.equal(C.validateDatabase(db).tasks[0].deadline,'2026-11-02 17:00');
  const closed=C.empty();C.setWeekdayWindows(closed,[0,1,2,3,4,5,6],[]);C.addTask(closed,task());
  await act(closed,'/api/sync','POST',{day:'2026-11-03'},clock('2026-11-03'));assert.equal(planned(closed).length,0);assert.match(closed.tasks[0].reason,/90 days/);
  assert.doesNotThrow(()=>C.validateDatabase(closed));
 });
 test(`${file}: recurrence generates independent weekdays, future views and no duplicate instances`,async()=>{
  const db=C.empty();const {id}=await act(db,'/api/series','POST',{task:task({duration:45,min_chunk:15,max_chunk:45,deadline:'2026-11-02 17:00'}),weekdays:[1,2,3,4,5]});
  assert.equal(db.tasks.length,25);assert.ok(db.tasks.every(t=>![0,6].includes(new Date(t.occurrence_date+'T12:00Z').getUTCDay())));
  assert.equal(planned(db).length,25);
  const count=db.tasks.length,history=JSON.stringify(db.blocks);await act(db,'/api/sync','POST',{day:'2026-11-02'});assert.equal(db.tasks.length,count);assert.equal(JSON.stringify(db.blocks),history);
  await act(db,'/api/sync','POST',{day:'2030-01-07'});assert.ok(db.tasks.some(t=>t.occurrence_date==='2030-01-07'));
  const restored=C.validateDatabase(db);await act(restored,'/api/sync','POST',{day:'2030-01-07'});assert.equal(restored.tasks.length,db.tasks.length);assert.equal(restored.series[0].id,id);
 });
 test(`${file}: rollover uses capacity across days, preserves pins and flags only the late remainder`,async()=>{
  const db=C.empty();C.setWeekdayWindows(db,[0,1,2,3,4,5,6],[[540,600]]);
  const id=C.addTask(db,task({duration:120,deadline:'2026-11-04 10:00',min_chunk:30,max_chunk:60}));
  await act(db,'/api/sync','POST',{day:'2026-11-03'},clock('2026-11-03'));
  assert.deepEqual(Array.from(planned(db,id),b=>[b.day,b.end-b.start]),[['2026-11-03',60],['2026-11-04',60]]);
  assert.equal(db.tasks[0].deadline_warning,false);assert.equal(C.snapshot(db,'2026-11-03').tasks[0].unslotted_minutes,0);
  let restored=C.validateDatabase(db);const pin=planned(restored,id)[1];await act(restored,`/api/blocks/${pin.id}`,'PATCH',{start:540},clock('2026-11-03'));
  assert.equal(restored.blocks.find(b=>b.id===pin.id).manual,true);assert.equal(planned(restored,id).length,2);
  await act(restored,'/api/tasks','POST',task({name:'Assigned Wednesday',target_date:'2026-11-04',deadline:'2026-11-04 10:00',duration:60}),clock('2026-11-03'));
  assert.equal(restored.blocks.find(b=>b.id===pin.id).start,540);assert.doesNotThrow(()=>C.validateDatabase(restored));
  await act(restored,'/api/sync','POST',{day:'2026-11-04'},clock('2026-11-04'));
  assert.equal(restored.blocks.find(b=>b.id===pin.id).manual,true);assert.equal(restored.blocks.find(b=>b.id===pin.id).day,'2026-11-04');
  // With an earlier deadline the first day remains on time; the second is flagged.
  const late=C.empty();C.setWeekdayWindows(late,[0,1,2,3,4,5,6],[[540,600]]);C.addTask(late,task({duration:120,deadline:'2026-11-03 10:00'}));
  await act(late,'/api/sync','POST',{day:'2026-11-03'},clock('2026-11-03'));
  assert.equal(planned(late).length,2);assert.equal(late.tasks[0].deadline_warning,true);assert.equal(late.tasks[0].deadline,'2026-11-03 10:00');assert.doesNotThrow(()=>C.validateDatabase(late));
 });
 test(`${file}: editing and pausing series preserves completion, instance edits, checkmarks and kept times`,async()=>{
  const db=C.empty(),definition={task:task({kind:'checklist',duration:45,checklist:[{id:1,text:'Exercises',done:false}],deadline:'2026-11-02 17:00'}),weekdays:[1,2,3,4,5]};
  const {id}=await act(db,'/api/series','POST',definition);
  const occurrence=day=>db.tasks.find(t=>t.occurrence_date===day),monday=occurrence('2026-11-02');
  C.setTaskStatus(db,monday.id,'completed');const history=JSON.stringify(db.blocks.filter(b=>b.status==='completed'));
  C.updateTask(db,occurrence('2026-11-03').id,{name:'Individual exception'});
  C.setChecklistItem(db,occurrence('2026-11-04').id,1,true);
  const thursday=occurrence('2026-11-05');C.adjustBlock(db,planned(db,thursday.id)[0].id,{start:800});
  await act(db,`/api/series/${id}`,'PATCH',{task:{...definition.task,name:'Revised',duration:60}});
  assert.equal(monday.name,'Mathematics');assert.equal(occurrence('2026-11-03').name,'Individual exception');assert.equal(occurrence('2026-11-04').duration,45);assert.equal(thursday.duration,45);assert.equal(occurrence('2026-11-06').duration,60);
  await act(db,`/api/series/${id}`,'PATCH',{paused:true});assert.equal(occurrence('2026-11-06').series_cancelled,true);assert.equal(planned(db,occurrence('2026-11-06').id).length,0);
  assert.equal(JSON.stringify(db.blocks.filter(b=>b.status==='completed')),history);
  await act(db,`/api/series/${id}`,'PATCH',{paused:false},clock('2026-11-06'));assert.equal(occurrence('2026-11-06').series_cancelled,false);assert.equal(occurrence('2026-11-06').duration,60);
  assert.equal(new Set(db.tasks.map(t=>t.series_id+'/'+t.occurrence_date)).size,db.tasks.length);assert.doesNotThrow(()=>C.validateDatabase(db));
 });
 test(`${file}: permanent weekday rules yield to date overrides and update all matching schedules`,async()=>{
  const db=C.empty();await act(db,'/api/series','POST',{task:task({deadline:'2026-11-02 17:00'}),weekdays:[1]});
  await act(db,'/api/windows/weekday','PUT',{weekdays:[1],windows:[[780,900]]});assert.ok(planned(db).every(b=>b.start>=780));
  await act(db,'/api/windows','PUT',{day:'2026-11-09',windows:[]});assert.equal(planned(db).filter(b=>b.day==='2026-11-09').length,0);
  await act(db,'/api/windows/weekday','PUT',{weekdays:[1],windows:[[840,960]]});assert.equal(C.getWindows(db,'2026-11-09').length,0);assert.equal(C.getWindows(db,'2030-01-07')[0][0],840);
  await act(db,'/api/windows','DELETE',{day:'2026-11-09'});assert.equal(planned(db).find(b=>b.day==='2026-11-09').start,840);
  assert.equal(C.validateDatabase(db).weekdayWindows[1][0][0],840);
 });
 test(`${file}: new backup fields reject corruption while legacy backups migrate`,async()=>{
  const db=C.empty();await act(db,'/api/series','POST',{task:task(),weekdays:[1,3,5]});
  const invalid=()=>JSON.parse(JSON.stringify(db));let bad=invalid();bad.tasks.push({...bad.tasks[0],id:bad.nextTaskId++});assert.throws(()=>C.validateDatabase(bad),/occurrence/);
  bad=invalid();bad.weekdayWindows={'7':[]};assert.throws(()=>C.validateDatabase(bad),/weekday/);
  bad=invalid();bad.blocks[0].manual='yes';assert.throws(()=>C.validateDatabase(bad),/kept-time/);
  const legacy=C.empty();for(const k of ['series','nextSeriesId','weekdayWindows','automation'])delete legacy[k];const restored=C.validateDatabase(legacy);assert.equal(restored.series.length,0);assert.equal(restored.nextSeriesId,1);
 });
}
