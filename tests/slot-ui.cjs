// Run with NODE_PATH pointing to an installation of Playwright.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':file.endsWith('.html')?'text/html':'application/octet-stream'});res.end(error?'Not found':data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 let transfer;
 try{
 for(const file of ['Slot/Slot.html','StudyBuddy.html']){
  const context=await browser.newContext({viewport:{width:1280,height:1000},acceptDownloads:true});
  await context.addInitScript(()=>localStorage.setItem('studybuddy-active-tool','slot'));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/${file}`);
  const host=page.locator('#slot-host'),q=selector=>host.locator(selector);
  const notice=async text=>{await q('#notice').filter({hasText:text}).waitFor();await page.waitForFunction(()=>!document.getElementById('slot-host').shadowRoot.getElementById('day').disabled);};
  const day=async date=>{await q('#day').fill(date);await q('#day').dispatchEvent('change');await page.waitForFunction(()=>!document.getElementById('slot-host').shadowRoot.getElementById('day').disabled);};
  const view=async name=>q(`.view-nav [data-slot-view=${name}]`).click();
  await notice('Ready.');await day('2026-11-02');
  assert.equal(await q('#task-form [name=name]').isVisible(),true);
  await q('#task-form [name=name]').fill('Draft timed task');
  await q('#task-form [name=kind]').selectOption('checklist');
  assert.equal(await q('#task-form [name=name]').isVisible(),false);
  assert.equal(await q('#task-form [name=name]').isDisabled(),true);
  await q('#task-form [name=kind]').selectOption('timed');
  assert.equal(await q('#task-form [name=name]').isVisible(),true);
  assert.equal(await q('#task-form [name=name]').inputValue(),'Draft timed task');
  await q('#task-form [name=kind]').selectOption('checklist');
  await q('#task-form [name=duration]').fill('45');
  await q('#task-form [name=checklist_text]').fill('Book dentist\nSend invoice\nCall bank');
  await q('#task-form button[type=submit]').click();await notice('Task added');
  await q('#plan').click();await notice('1 tasks scheduled');
  assert.equal(await q('#timeline h3').first().innerText(),'Checklist Block');
  assert.equal(await q('#timeline [data-check-item]').count(),3);
  await q('#timeline [data-check-item="1"]').check();await notice('Checklist saved');
  await page.reload();await notice('Ready.');await day('2026-11-02');
  assert.equal(await q('#timeline [data-check-item="1"]').isChecked(),true);
  await q('#timeline [data-edit]').click();
  await q('#edit-dialog').waitFor({state:'visible'});
  assert.equal(await q('#edit-form [name=name]').isVisible(),true);
  assert.equal(await q('#edit-form [name=name]').isDisabled(),false);
  await q('#checklist-editor .checklist-editor-row').nth(0).locator('input[type=text]').fill('Book dentist checkup');
  await q('#checklist-editor .checklist-editor-row').nth(1).locator('button').click();
  await q('#add-checklist-item').click();await q('#checklist-editor .checklist-editor-row').last().locator('input[type=text]').fill('Pay bill');
  await q('#edit-form button[type=submit]').click();await notice('Task updated');
  assert.equal(await q('#timeline [data-check-item]').count(),3);assert.equal(await q('#timeline [data-check-item="1"]').isChecked(),true);
  assert.match(await q('#timeline').innerText(),/Book dentist checkup/);
  await view('tasks');await q('#tasks [data-check-item="1"]').uncheck();await notice('Checklist saved');
  assert.equal(await q('#tasks [data-check-item="1"]').evaluate(el=>el.getRootNode().activeElement===el),true);
  await q('#tasks [data-check-item="1"]').press('Space');await notice('Checklist saved');
  assert.equal(await q('#tasks [data-check-item="1"]').isChecked(),true);
  // A failed storage write restores the visible checkbox and keeps saved data intact.
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){Storage.prototype.setItem=original;if(key==='slot.standalone.v1')throw new DOMException('Full','QuotaExceededError');return original.call(this,key,value);};});
  await q('#tasks [data-check-item="1"]').uncheck();await notice('Browser storage is full');
  assert.equal(await q('#tasks [data-check-item="1"]').isChecked(),true);
  await view('day');
  // Keep normal timed work alongside the checklist block.
  await q('#task-form [name=kind]').selectOption('timed');
  assert.equal(await q('#task-form [name=name]').isVisible(),true);
  assert.equal(await q('#task-form [name=name]').isDisabled(),false);
  await q('#task-form [name=name]').fill('Read chapter');
  await q('#task-form [name=duration]').fill('30');await q('#task-form button[type=submit]').click();await notice('Task added');
  await view('settings');await q('#commitment-form').evaluate(form=>form.closest('details').open=true);
  await q('#commitment-form [name=name]').fill('Work');
  await q('#commitment-form [name=start]').fill('2026-11-02T09:00');await q('#commitment-form [name=end]').fill('2026-11-02T12:00');
  await q('#commitment-form [name=repeat]').check();
  // Empty repeat selection is rejected without saving a partial rule.
  await q('#commitment-form button[type=submit]').click();await notice('Choose at least one repeat day');
  for(const n of [1,3,5])await q(`#commitment-form [name=weekday][value="${n}"]`).check();
  await q('#commitment-form button[type=submit]').click();await notice('Commitment added');
  await day('2026-11-03');assert.equal(await q('#commitments [data-edit-commitment]').count(),1);
  await q('#commitments [data-edit-commitment]').click();
  assert.equal(await q('#commitment-edit-form [name=start]').inputValue(),'2026-11-02T09:00');
  await q('#commitment-edit-form [name=name]').fill('Shift');await q('#commitment-edit-form [name=start]').fill('2026-11-02T10:00');await q('#commitment-edit-form [name=end]').fill('2026-11-02T13:00');
  await q('#commitment-edit-form [data-repeat-preset=weekdays]').click();
  await q('#commitment-edit-form button[type=submit]').click();await notice('Commitment updated');
  assert.equal(await q('#day').inputValue(),'2026-11-03');
  await view('day');assert.match(await q('#timeline').innerText(),/Shift/);
  await day('2026-11-02');await q('#plan').click();await notice('2 tasks scheduled');
  assert.equal(await q('#timeline [data-check-item="1"]').isChecked(),true);
  await view('week');await q('#plan-week').click();await notice('7 days planned');assert.match(await q('#week-days').innerText(),/Shift/);
  await view('settings');await q('#storage-panel details').evaluate(d=>d.open=true);
  const download=page.waitForEvent('download');await q('#export-data').click();const saved=await download;
  const backup=JSON.parse(fs.readFileSync(await saved.path(),'utf8'));
  assert.equal(backup.data.tasks.find(t=>t.kind==='checklist').checklist[0].done,true);
  assert.equal(backup.data.tasks.find(t=>t.kind==='checklist').name,'Checklist Block');
  assert.equal(backup.data.tasks.find(t=>t.kind==='timed').name,'Read chapter');
  assert.deepEqual(backup.data.commitments[0].weekdays,[1,2,3,4,5]);
  // Restore a backup written by the other app when available.
  const payload=transfer||backup;transfer=backup;page.once('dialog',dialog=>dialog.accept());
  await q('#backup-file').setInputFiles({name:'slot-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});await notice('Backup restored');
  assert.equal(await q('#commitments [data-remove-commitment]').innerText(),'Delete series');
  await q('#commitments [data-remove-commitment]').click();await notice('Commitment deleted');
  await day('2027-11-01');await view('day');assert.doesNotMatch(await q('#timeline').innerText(),/Shift/);
  await day('2026-11-02');await view('settings');
  // Every-day preset is usable and persists as seven selected weekdays.
  await q('#commitment-form').evaluate(form=>form.closest('details').open=true);
  await q('#commitment-form [name=name]').fill('Dinner');await q('#commitment-form [name=start]').fill('2026-11-02T18:00');await q('#commitment-form [name=end]').fill('2026-11-02T19:00');
  await q('#commitment-form [data-repeat-preset=daily]').click();await q('#commitment-form button[type=submit]').click();await notice('Commitment added');
  assert.match(await q('#commitments').innerText(),/Every day/);
  if(process.env.SLOT_TEST_SCREENSHOTS){fs.mkdirSync(process.env.SLOT_TEST_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.SLOT_TEST_SCREENSHOTS,file.replaceAll('/','-')+'-settings.png'),fullPage:true});}
  // Inspect the same interactions at a small viewport; no horizontal overflow.
  await page.setViewportSize({width:390,height:844});
  assert.equal(await q('.weekday-choices').first().evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await q('#commitments [data-edit-commitment]').click();assert.equal(await q('#commitment-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  if(process.env.SLOT_TEST_SCREENSHOTS)await page.screenshot({path:path.join(process.env.SLOT_TEST_SCREENSHOTS,file.replaceAll('/','-')+'-mobile-dialog.png')});
  await q('#close-commitment').click();await view('day');await q('#plan').click();await notice('2 tasks scheduled');
  if(process.env.SLOT_TEST_SCREENSHOTS){await q('#timeline').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.SLOT_TEST_SCREENSHOTS,file.replaceAll('/','-')+'-mobile-checklist.png')});}
  assert.equal(await q('.sb-content').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  assert.deepEqual(errors,[]);console.log(`PASS ${file}: create, check, reload, edit, schedule, repeat, export/restore, delete, mobile; no JS errors`);
  await context.close();
 }
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
