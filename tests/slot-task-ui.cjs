// Run with Playwright available; optionally set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':'text/html'});res.end(error?'Not found':data);});
});
async function fixture(file){
 const source=fs.readFileSync(path.join(root,file),'utf8'),start=source.indexOf('const SlotCore = (() => {');
 const C=vm.runInNewContext(source.slice(start,source.indexOf('\nconst SlotStore',start))+'\nSlotCore;',{URLSearchParams,setTimeout});
 const db=C.empty();
 const add=(name,date='2098-06-02',extra={})=>C.addTask(db,{name,duration:60,priority:'medium',energy:'deep',target_date:date,deadline:date+' 17:00',min_chunk:30,max_chunk:60,...extra});
 const ids={scheduled:add('Scheduled task'),completed:add('Completed task'),skipped:add('Skipped task'),checklist:add(null,'2098-06-02',{kind:'checklist',checklist:[{id:1,text:'Call bank',done:true}]}),week:add('Week task','2098-06-04'),remote:add('Remote upcoming','2099-01-02')};
 await C.planDay(db,'2098-06-02');await C.planDay(db,'2098-06-04');
 C.setBlockStatus(db,db.blocks.find(b=>b.task_id===ids.completed).id,'completed');
 C.setBlockStatus(db,db.blocks.find(b=>b.task_id===ids.skipped).id,'skipped');
 return {db:JSON.parse(JSON.stringify(db)),ids};
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 try{
 for(const file of ['Slot/Slot.html','StudyBuddy.html']){
  const {db,ids}=await fixture(file);
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  await context.addInitScript(db=>{localStorage.setItem('studybuddy-active-tool','slot');if(!localStorage.getItem('slot.standalone.v1'))localStorage.setItem('slot.standalone.v1',JSON.stringify(db));},db);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${file}`);
  const q=s=>page.locator('#slot-host').locator(s);
  const idle=()=>page.waitForFunction(()=>!document.getElementById('slot-host').shadowRoot.getElementById('day').disabled);
  const notice=async text=>{await q('#notice').filter({hasText:text}).waitFor();await idle();};
  const day=async date=>{await q('#day').fill(date);await q('#day').dispatchEvent('change');await idle();};
  const view=name=>q(`.view-nav [data-slot-view=${name}]`).click();
  const edit=async selector=>{await q(selector).first().click();await q('#edit-dialog').waitFor({state:'visible'});await idle();};
  const field=name=>q(`#edit-form [name=${name}]`);
  const save=async()=>{await q('#edit-form button[type=submit]').click();await notice('Task updated');};
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('slot.standalone.v1')));
  await notice('Ready.');await day('2098-06-02');
  // All properties of normal scheduled tasks are accessible directly from Day.
  await edit(`#timeline [data-edit="${ids.scheduled}"]`);
  await field('name').fill('Revised scheduled task');await field('duration').fill('90');
  await field('target_date').fill('2098-06-03');await field('deadline').fill('2098-06-03T16:30');
  await field('priority').selectOption('high');await field('energy').selectOption('shallow');
  await field('min_chunk').fill('15');await field('max_chunk').fill('45');await save();
  const changed=(await saved()).tasks.find(t=>t.id===ids.scheduled);
  for(const [k,v] of Object.entries({name:'Revised scheduled task',duration:90,target_date:'2098-06-03',deadline:'2098-06-03 16:30',priority:'high',energy:'shallow',min_chunk:15,max_chunk:45}))assert.equal(changed[k],v,k);
  assert.equal(await q('#day').inputValue(),'2098-06-02');
  assert.equal(await q(`#timeline [data-edit="${ids.scheduled}"]`).count(),0);
  // Completed work can be edited/deleted; its historical minutes remain intact.
  await edit(`#timeline [data-edit="${ids.completed}"]`);await field('name').fill('Renamed completed');
  await field('duration').fill('30');await q('#edit-form button[type=submit]').click();await notice('already completed');
  assert.equal(await q('#edit-dialog').isVisible(),true);
  assert.equal((await saved()).tasks.find(t=>t.id===ids.completed).name,'Completed task');
  await field('duration').fill('60');await save();
  assert.match(await q('#timeline').innerText(),/Completed task/); // Historical label stays.
  await q(`#timeline [data-delete-task="${ids.completed}"]`).click();await notice('Task deleted');
  assert.equal(await q(`#timeline [data-edit="${ids.completed}"]`).count(),0);
  assert.equal((await saved()).blocks.filter(b=>b.task_id===ids.completed&&b.status==='completed').length,1);
  await q(`#timeline [data-restore-task="${ids.completed}"]`).click();await notice('Task restored');
  await q('#plan').click();await notice('2 tasks scheduled');
  // A checklist's name, type, and contents are editable using the same dialog.
  await edit(`#timeline [data-edit="${ids.checklist}"]`);await field('name').fill('Admin errands');await save();
  await page.reload();await notice('Ready.');await day('2098-06-02');
  assert.match(await q('#timeline').innerText(),/Admin errands/);
  assert.equal(await q(`#timeline [data-check-task="${ids.checklist}"]`).isChecked(),true);
  await edit(`#timeline [data-edit="${ids.checklist}"]`);await field('kind').selectOption('timed');await save();
  assert.equal((await saved()).tasks.find(t=>t.id===ids.checklist).kind,'timed');
  // Skipped history points to its task even after the task moves to another date.
  await view('tasks');await q('#history-panel details').evaluate(d=>d.open=true);
  await edit(`#history [data-edit="${ids.skipped}"]`);await field('target_date').fill('2098-06-05');await field('deadline').fill('2098-06-05T17:00');await save();
  await edit(`#history [data-edit="${ids.skipped}"]`);assert.equal(await field('target_date').inputValue(),'2098-06-05');await q('#close-edit').click();
  await q(`#history [data-delete-task="${ids.skipped}"]`).click();await notice('Task deleted');
  // Upcoming lookup works beyond the selected day AND outside its week.
  await q('#upcoming-details').evaluate(d=>d.open=true);
  await edit(`#upcoming [data-edit="${ids.remote}"]`);assert.equal(await field('name').inputValue(),'Remote upcoming');
  await field('name').fill('Remote revised');await save();assert.equal(await q('#day').inputValue(),'2098-06-02');
  await q(`#upcoming [data-task="${ids.remote}"]`).click();await notice('Task status updated');
  assert.equal((await saved()).tasks.find(t=>t.id===ids.remote).status,'skipped');
  await q(`#upcoming [data-task="${ids.remote}"]`).click();await notice('Task status updated');
  assert.equal((await saved()).tasks.find(t=>t.id===ids.remote).status,'planned');
  await edit(`#upcoming [data-edit="${ids.remote}"]`);await field('name').fill('Cancelled draft');await q('#close-edit').click();
  assert.equal((await saved()).tasks.find(t=>t.id===ids.remote).name,'Remote revised');
  await q(`#upcoming [data-delete-task="${ids.remote}"]`).click();await notice('Task deleted');
  assert.equal(await q(`#upcoming [data-edit="${ids.remote}"]`).count(),0);
  // Task-list deletion and restoration retain the edited fields.
  await q(`#tasks [data-delete-task="${ids.checklist}"]`).click();await notice('Task deleted');
  await q('#trash-details').evaluate(d=>d.open=true);await q(`#trash [data-restore-task="${ids.checklist}"]`).click();await notice('Task restored');
  await edit(`#tasks [data-edit="${ids.checklist}"]`);assert.equal(await field('name').inputValue(),'Admin errands');await q('#close-edit').click();
  // Week preview controls work across dates, at desktop and mobile widths.
  await view('week');await edit(`#week-days [data-edit="${ids.week}"]`);
  await field('name').fill('Week revised');await save();assert.equal(await q('#day').inputValue(),'2098-06-02');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await q('.sb-content').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await edit(`#week-days [data-edit="${ids.week}"]`);
  assert.equal(await q('#edit-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  if(process.env.SLOT_TEST_SCREENSHOTS){fs.mkdirSync(process.env.SLOT_TEST_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.SLOT_TEST_SCREENSHOTS,file.replaceAll('/','-')+'-task-editor.png')});}
  // Failed deletion keeps both the saved task and the open editor available.
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){Storage.prototype.setItem=original;if(key==='slot.standalone.v1')throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};});
  await q('#delete-edit-task').click();await notice('Browser storage is full');
  assert.equal(await q('#edit-dialog').isVisible(),true);assert.equal((await saved()).tasks.find(t=>t.id===ids.week).deleted_at,null);
  await q('#delete-edit-task').click();await notice('Task deleted');assert.equal(await q('#edit-dialog').isVisible(),false);
  assert.equal(await q(`#week-days [data-edit="${ids.week}"]`).count(),0);
  // Unscheduled week previews expose the same controls.
  await edit(`#week-days [data-edit="${ids.scheduled}"]`);await q('#close-edit').click();
  await q(`#week-days [data-delete-task="${ids.scheduled}"]`).click();await notice('Task deleted');
  if(process.env.SLOT_TEST_SCREENSHOTS)await page.screenshot({path:path.join(process.env.SLOT_TEST_SCREENSHOTS,file.replaceAll('/','-')+'-week-actions.png'),fullPage:true});
  await page.reload();await notice('Ready.');
  assert.ok((await saved()).tasks.find(t=>t.id===ids.week).deleted_at);
  assert.deepEqual(errors,[]);
  console.log(`PASS ${file}: edit all fields, cross-date lookup, day/week/upcoming/tasks/history deletion, restore, cancel, validation, persistence, mobile`);
  await context.close();
 }
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
