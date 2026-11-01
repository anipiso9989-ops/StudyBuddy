// Requires Playwright and Chromium; set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH if needed.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':'text/html'});res.end(error?'Not found':data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 try{
 for(const file of ['Slot/Slot.html','StudyBuddy.html']){
  const context=await browser.newContext({viewport:{width:1280,height:1000},timezoneId:'America/Chicago',acceptDownloads:true});
  await context.clock.install({time:new Date('2026-11-02T14:00:00Z')});
  await context.addInitScript(()=>localStorage.setItem('studybuddy-active-tool','slot'));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${file}`);
  const q=s=>page.locator('#slot-host').locator(s),form=k=>q(`#task-form [name=${k}]`);
  const idle=()=>page.waitForFunction(()=>!document.getElementById('slot-host').shadowRoot.getElementById('day').disabled);
  const notice=async text=>{await q('#notice').filter({hasText:text}).waitFor();await idle();};
  const view=name=>q(`.view-nav [data-slot-view=${name}]`).click();
  const day=async value=>{await q('#day').fill(value);await q('#day').dispatchEvent('change');await idle();};
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('slot.standalone.v1')));
  await notice('Ready.');assert.equal(await q('#plan,#plan-week,#push').count(),0);
  await form('name').fill('Read physics');await form('duration').fill('90');await form('deadline').fill('2026-11-04T17:00');
  await q('#task-form button[type=submit]').click();await notice('Task added');
  let db=await saved();const id=db.tasks.find(t=>t.name==='Read physics').id;
  assert.equal(db.blocks.filter(b=>b.task_id===id).reduce((n,b)=>n+b.end-b.start,0),90);
  await q('#timeline [data-adjust-block]').first().click();await q('#block-form [name=start]').fill('14:00');await q('#block-form button[type=submit]').click();await notice('Time kept');
  const kept=(await saved()).blocks.find(b=>b.manual);assert.equal(kept.start,840);
  await view('settings');await q('#windows .window-row button').click();await q('#windows-form button[type=submit]').click();await notice('Hours saved');
  assert.match(await q('#notice').innerText(),/Kept time conflicts/);assert.equal((await saved()).blocks.find(b=>b.id===kept.id).start,840);
  await q('#reset-date-hours').click();await notice('Date override removed');
  await view('day');await form('name').fill('Study mathematics');await form('duration').fill('45');await form('deadline').fill('2026-11-02T17:00');await form('repeat').check();await q('#task-form [data-repeat-preset=weekdays]').click();
  await q('#task-form button[type=submit]').click();await notice('Task added');
  db=await saved();assert.equal(db.series.length,1);assert.equal(db.tasks.filter(t=>t.series_id).length,25);
  await day('2026-11-03');await q('#timeline [data-status=completed]').first().click();await notice('Work recorded');
  const history=JSON.stringify((await saved()).blocks.filter(b=>b.status==='completed'));
  await view('tasks');await q('#series [data-edit-series]').click();await q('#series-form [name=name]').fill('Mathematics exercises');await q('#series-form [name=duration]').fill('30');await q('#series-form button[type=submit]').click();await notice('Recurring task updated');
  assert.equal(JSON.stringify((await saved()).blocks.filter(b=>b.status==='completed')),history);
  await q('#series [data-pause-series]').click();await notice('Recurring task paused');assert.equal((await saved()).series[0].paused,true);
  await q('#series [data-pause-series]').click();await notice('Recurring task resumed');assert.equal((await saved()).series[0].paused,false);
  await view('settings');const inputs=q('#template-windows input');await inputs.nth(0).fill('13:00');await inputs.nth(1).fill('17:00');await q('#availability-form button[type=submit]').click();await notice('Weekday availability saved');
  assert.equal((await saved()).weekdayWindows[1][0][0],780);
  await day('2026-11-09');assert.match(await q('#hours-summary').innerText(),/13:00–17:00/);
  // Backup captures rules, exception dates, pins, and independent completion history.
  await q('#storage-panel details').evaluate(d=>d.open=true);const downloading=page.waitForEvent('download');await q('#export-data').click();const download=await downloading;
  const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(backup.data.series.length,1);assert.equal(backup.data.weekdayWindows[1][0][0],780);
  await day('2026-11-02');await view('day');
  await context.clock.setFixedTime(new Date('2026-11-03T14:00:00Z'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await notice('New day.');
  db=await saved();const rolled=db.tasks.find(t=>t.id===id);assert.equal(rolled.deadline,'2026-11-04 17:00');assert.equal(rolled.target_date,'2026-11-03');assert.equal(await q('#day').inputValue(),'2026-11-03');
  assert.equal(db.blocks.some(b=>b.task_id===id&&b.status==='planned'&&b.day==='2026-11-02'),false);
  const count=db.tasks.length;await page.reload();await notice('Ready.');assert.equal((await saved()).tasks.length,count);
  await page.setViewportSize({width:390,height:844});await view('tasks');await q('#series [data-edit-series]').click();assert.equal(await q('#series-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);await q('#close-series').click();
  await view('settings');assert.equal(await q('.sb-content').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
  if(process.env.SLOT_TEST_SCREENSHOTS){fs.mkdirSync(process.env.SLOT_TEST_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.SLOT_TEST_SCREENSHOTS,file.replaceAll('/','-')+'-automatic-settings.png'),fullPage:true});}
  assert.deepEqual(errors,[]);console.log(`PASS ${file}: automatic planning, kept times/conflicts, recurrence editing/pause, weekday rules, backups, midnight rollover, reload and mobile`);
  await context.close();
 }
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
