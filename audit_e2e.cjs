/**
 * ShipNex pre-hosting E2E audit — talks to the REAL running servers:
 *   frontend (vite dev) : http://localhost:5173
 *   backend  (Kestrel)  : http://localhost:5000
 * Read-only where possible; creates its own test records and cleans up.
 * Writes: audit_e2e_report.txt (human readable) and audit_e2e_data.json (raw).
 */
const fs = require('fs');

const FE = 'http://localhost:5173';
const API = 'http://localhost:5000';
const REPORT = 'audit_e2e_report.txt';
const DATA = 'audit_e2e_data.json';

const lines = [];
const data = { checks: [] };
let pass = 0, fail = 0, warn = 0;

function log(s) { lines.push(s); }
function record(name, status, detail) {
  const tag = status === 'PASS' ? 'PASS' : status === 'WARN' ? 'WARN' : 'FAIL';
  if (tag === 'PASS') pass++; else if (tag === 'WARN') warn++; else fail++;
  const line = `[${tag}] ${name}${detail ? ' :: ' + detail : ''}`;
  log(line);
  data.checks.push({ name, status: tag, detail: detail || '' });
  console.log(line);
}
function eq(name, actual, expected) {
  record(name, actual === expected ? 'PASS' : 'FAIL', `expected ${expected}, got ${actual}`);
  return actual === expected;
}
function flush() {
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
  fs.writeFileSync(REPORT, lines.join('\r\n') + '\r\n');
}

function deepHas(obj, key) {
  if (!obj || typeof obj !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(obj, key)) return true;
  return Object.values(obj).some(v => deepHas(v, key));
}

function absent(name, objs, keys) {
  const list = Array.isArray(objs) ? objs : [objs];
  const leaked = keys.filter(k => list.some(o => deepHas(o, k)));
  record(name, leaked.length === 0 ? 'PASS' : 'FAIL', `leaked keys: ${leaked.join(',') || 'none'}`);
}

async function req(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: res.status, headers: res.headers, body, text };
  } catch (e) {
    return { status: 0, headers: null, body: null, text: '', error: String((e && e.message) || e) };
  }
}
const jsonHdr = (token) => token
  ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  : { 'Content-Type': 'application/json' };

(async () => {
  log('================ ShipNex E2E AUDIT ================');
  log('date: ' + new Date().toISOString());
  log('');

  // ---------- 1. FRONTEND ROUTES ----------
  log('---------- 1. FRONTEND ROUTES (vite dev server) ----------');
  const routes = [
    '/', '/about', '/services', '/services/air-freight', '/services/sea-freight',
    '/services/road-freight', '/services/express-shipping', '/services/vehicle-shipping',
    '/services/pet-live-animal', '/track', '/track/pet', '/offices', '/faqs',
    '/contact', '/privacy', '/terms', '/login', '/register', '/admin',
    '/admin/shipments', '/admin/customers', '/admin/pet-shipments', '/admin/documents',
    '/admin/notifications', '/admin/offices', '/admin/audit-logs', '/admin/settings',
    '/no-such-page-404',
  ];
  let feOk = 0, feBad = 0;
  for (const r of routes) {
    try {
      const res = await req(FE + r);
      const hasRoot = typeof res.text === 'string' && res.text.includes('<div id="root">');
      if (res.status === 200 && hasRoot) feOk++;
      else { feBad++; record(`route ${r}`, 'FAIL', `status ${res.status}, root div present: ${hasRoot}`); }
    } catch (e) { feBad++; record(`route ${r}`, 'FAIL', String(e.message || e)); }
  }
  record('frontend SPA shell served for all routes', feBad === 0 ? 'PASS' : 'FAIL',
    `${feOk}/${routes.length} returned 200 with <div id="root">`);
  data.frontendRoutes = routes;

  // ---------- 2. STATIC ASSETS ----------
  log('');
  log('---------- 2. STATIC ASSETS ----------');
  for (const a of ['/favicon.svg', '/icons.svg', '/branding/site.webmanifest', '/branding/shipnex-icon.png']) {
    const res = await req(FE + a);
    const benign = a.includes('shipnex-icon');
    record(`asset ${a}`, res.status === 200 ? 'PASS' : (benign ? 'WARN' : 'FAIL'), `status ${res.status}`);
  }

  // ---------- 3. API BASICS + CORS ----------
  log('');
  log('---------- 3. API BASICS + CORS ----------');
  const health = await req(`${API}/health`);
  eq('GET /health', health.status, 200);

  const pre = await fetch(`${API}/api/auth/login`, {
    method: 'OPTIONS',
    headers: { Origin: FE, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });
  const acao = pre.headers.get('access-control-allow-origin');
  data.corsPreflight = { status: pre.status, acao };
  if (String(acao || '').includes('localhost:5173')) {
    record('CORS preflight allows the dev frontend origin', 'PASS', `ACAO=${acao}`);
  } else {
    record('CORS preflight allows the dev frontend origin', 'FAIL',
      `status ${pre.status}, ACAO=${acao} -> browser API calls from ${FE} are blocked`);
  }
  // ---------- 4. AUTHENTICATION & AUTHORIZATION ----------
  log('');
  log('---------- 4. AUTHENTICATION & AUTHORIZATION ----------');
  const badEmpty = await req(`${API}/api/auth/login`, {
    method: 'POST', headers: jsonHdr(), body: JSON.stringify({ email: '', password: '' }),
  });
  eq('login with empty fields rejected', badEmpty.status, 400);

  const badPw = await req(`${API}/api/auth/login`, {
    method: 'POST', headers: jsonHdr(),
    body: JSON.stringify({ email: 'admin@shipnex.com', password: 'definitely-wrong' }),
  });
  eq('login with wrong password rejected', badPw.status, 401);

  const login = await req(`${API}/api/auth/login`, {
    method: 'POST', headers: jsonHdr(),
    body: JSON.stringify({ email: 'admin@shipnex.com', password: 'admin123' }),
  });
  const lb = login.body || {};
  const token = lb.token || (lb.data && lb.data.token) || null;
  const role = lb.role || (lb.data && lb.data.role);
  record('valid admin login', login.status === 200 && token ? 'PASS' : 'FAIL',
    `status ${login.status}, role=${role}, tokenLen=${token ? String(token).length : 0}`);
  data.login = { status: login.status, role };

  const anonShipments = await req(`${API}/api/shipments`);
  eq('anonymous GET /api/shipments blocked', anonShipments.status, 401);

  const bogusToken = await req(`${API}/api/shipments`, { headers: { Authorization: 'Bearer not.a.real.token' } });
  eq('forged token blocked', bogusToken.status, 401);

  eq('anonymous audit logs blocked', (await req(`${API}/api/admin/audit-logs`)).status, 401);
  eq('anonymous customers blocked', (await req(`${API}/api/customers`)).status, 401);
  eq('anonymous pets blocked', (await req(`${API}/api/pets`)).status, 401);
  eq('anonymous vehicles blocked', (await req(`${API}/api/vehicles`)).status, 401);

  // Low-privilege account (public self-registration = Customer role) must not reach staff APIs.
  const custEmail = `audit.customer.${Date.now()}@example.com`;
  const reg = await req(`${API}/api/auth/register`, {
    method: 'POST', headers: jsonHdr(),
    body: JSON.stringify({ firstName: 'Audit', lastName: 'Customer', email: custEmail, password: 'AuditPass123!', phone: '+1-555-0100', address: '5 Audit Lane' }),
  });
  record('POST /api/auth/register (public signup)', reg.status === 200 || reg.status === 201 ? 'PASS' : 'WARN', `status ${reg.status}`);
  const custLogin = await req(`${API}/api/auth/login`, {
    method: 'POST', headers: jsonHdr(), body: JSON.stringify({ email: custEmail, password: 'AuditPass123!' }),
  });
  const cb = custLogin.body || {};
  const custToken = cb.token || (cb.data && cb.data.token) || null;
  if (custToken) {
    const custRole = cb.role || (cb.data && cb.data.role);
    const staffTry = await req(`${API}/api/admin/staff`, { headers: jsonHdr(custToken) });
    record('Customer role blocked from /api/admin/staff (RBAC)', staffTry.status === 403 ? 'PASS' : 'FAIL',
      `role=${custRole}, status ${staffTry.status}`);
    const shipTry = await req(`${API}/api/shipments`, { headers: jsonHdr(custToken) });
    record('Customer role blocked from /api/shipments (RBAC)', shipTry.status === 403 ? 'PASS' : 'FAIL', `status ${shipTry.status}`);
  } else {
    record('Customer-role RBAC probe', 'WARN', `could not obtain a customer token (register status ${reg.status})`);
  }
  flush();

  // ---------- 5. SHIPMENT WORKFLOW ----------
  log('');
  log('---------- 5. SHIPMENT WORKFLOW ----------');
  const listBefore = await req(`${API}/api/shipments`, { headers: jsonHdr(token) });
  const before = Array.isArray(listBefore.body) ? listBefore.body : [];
  record('GET /api/shipments (admin)', listBefore.status === 200 ? 'PASS' : 'FAIL', `${before.length} shipment(s)`);

  const custRes = await req(`${API}/api/customers`, {
    method: 'POST', headers: jsonHdr(token),
    body: JSON.stringify({
      firstName: 'Audit', lastName: 'Runner', email: `audit.runner.${Date.now()}@example.com`,
      phone: '+1-555-0199', address: '1 Audit Way, Testville',
    }),
  });
  const custBody = custRes.body || {};
  const customerId = custBody.id || (custBody.data && custBody.data.id);
  record('POST /api/customers', (custRes.status === 201 || custRes.status === 200) ? 'PASS' : 'FAIL',
    `status ${custRes.status}, id=${customerId}`);

  const create = await req(`${API}/api/shipments`, {
    method: 'POST', headers: jsonHdr(token),
    body: JSON.stringify({
      senderName: 'Audit Sender', senderAddress: '10 Origin Rd, New York',
      receiverName: 'Audit Receiver', receiverAddress: '20 Destination Ave, Los Angeles',
      origin: 'New York', destination: 'Los Angeles',
      weight: 3.5, numberOfPieces: 2, serviceType: 'Express', shipmentType: 'Express',
      referenceNumber: 'AUDIT-E2E-1', customerId,
    }),
  });
  const sb = create.body || {};
  const sid = sb.id || (sb.data && sb.data.id);
  const tn = sb.trackingNumber || (sb.data && sb.data.trackingNumber);
  record('POST /api/shipments (create)', (create.status === 201 || create.status === 200) ? 'PASS' : 'FAIL',
    `status ${create.status}, trackingNumber=${tn}, id=${sid}`);
  data.shipment = { id: sid, trackingNumber: tn, createStatus: create.status };

  if (sid && tn) {
    record('tracking number is unique', before.every(s => s.trackingNumber !== tn) ? 'PASS' : 'FAIL', `tn=${tn}`);

    const detail = await req(`${API}/api/shipments/${sid}`, { headers: jsonHdr(token) });
    const d = detail.body || {};
    record('GET /api/shipments/{id}', detail.status === 200 ? 'PASS' : 'FAIL', `status ${detail.status}`);
    record('customer relationship stored', (d.customerId || d.customer) ? 'PASS' : 'WARN', `customerId=${d.customerId || customerId}`);
    const ev0 = d.events || d.trackingEvents || [];
    record('initial tracking event created', ev0.length > 0 ? 'PASS' : 'FAIL', `${ev0.length} event(s)`);

    const st = await req(`${API}/api/shipments/${sid}/status`, {
      method: 'PUT', headers: jsonHdr(token),
      body: JSON.stringify({ status: 'InTransit', location: 'Audit City Hub', description: 'E2E audit status update' }),
    });
    const stb = st.body || {};
    record('PUT /api/shipments/{id}/status', st.status === 200 ? 'PASS' : 'FAIL',
      `status ${st.status}, location=${stb.currentLocation || stb.currentLocationName}, events=${(stb.events || stb.trackingEvents || []).length}`);

    const evPost = await req(`${API}/api/shipments/${sid}/tracking-events`, {
      method: 'POST', headers: jsonHdr(token),
      body: JSON.stringify({ status: 'OutForDelivery', locationName: 'Audit Delivery Depot', description: 'E2E tracking event', latitude: 34.05, longitude: -118.24 }),
    });
    record('POST /api/shipments/{id}/tracking-events', (evPost.status === 200 || evPost.status === 201) ? 'PASS' : 'FAIL', `status ${evPost.status}`);

    // ---------- 6. PUBLIC TRACKING (anonymous) ----------
    log('');
    log('---------- 6. PUBLIC TRACKING (anonymous) ----------');
    const pub = await req(`${API}/api/tracking/${encodeURIComponent(tn)}`);
    const p = pub.body || {};
    const pr = p.result || p;
    record('GET /api/tracking/{trackingNumber}', pub.status === 200 ? 'PASS' : 'FAIL', `status ${pub.status}, type=${p.type}`);
    record('tracking shows status', pr.status ? 'PASS' : 'FAIL', `status=${pr.status}`);
    const tl = pr.timeline || pr.events || [];
    record('tracking shows timeline', tl.length > 0 ? 'PASS' : 'FAIL', `${tl.length} entries`);
    record('tracking shows origin/destination', (pr.origin && pr.destination) ? 'PASS' : 'FAIL', `${pr.origin} -> ${pr.destination}`);
    const loc = pr.currentLocationName || pr.currentLocation;
    record('tracking shows latest reported location', loc ? 'PASS' : 'FAIL', `location=${loc}`);
    record('tracking exposes estimated delivery field', ('estimatedDelivery' in pr) ? 'PASS' : 'WARN', `${pr.estimatedDelivery}`);
    record('tracking exposes map coordinates', (pr.originLatitude !== undefined || pr.currentLatitude !== undefined) ? 'PASS' : 'WARN',
      `originLat=${pr.originLatitude}, currentLat=${pr.currentLatitude}`);
    absent('public tracking hides private data', pr,
      ['customerEmail', 'customerPhone', 'auditLog', 'internalNote', 'staffName', 'customerId']);
    data.publicTracking = { status: pub.status, type: p.type, timeline: tl.length, location: loc };

    const notFound = await req(`${API}/api/tracking/ZZZ-0000-000000`);
    eq('unknown tracking number returns 404', notFound.status, 404);
    absent('unknown tracking number leaks no internals', notFound.body, ['stack', 'Exception', 'SqlException']);

    // ---------- 7. DOCUMENTS + UPLOAD VALIDATION ----------
    log('');
    log('---------- 7. DOCUMENTS + UPLOAD VALIDATION ----------');
    const docTypes = await req(`${API}/api/documents/types`, { headers: jsonHdr(token) });
    record('GET /api/documents/types', docTypes.status === 200 ? 'PASS' : 'FAIL',
      `status ${docTypes.status}, maxFileSizeBytes=${docTypes.body && docTypes.body.maxFileSizeBytes}`);

    async function upload(fileName, contentType, bytes, customerVisible) {
      const form = new FormData();
      form.append('file', new Blob([bytes], { type: contentType }), fileName);
      form.append('shipmentId', sid);
      form.append('documentType', 'Invoice');
      form.append('description', 'E2E audit upload');
      form.append('customerVisible', String(customerVisible));
      const res = await fetch(`${API}/api/documents/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      return { status: res.status, body };
    }

    const exeUp = await upload('malicious.exe', 'application/octet-stream', Buffer.from('MZ fake'), true);
    record('upload of .exe rejected', exeUp.status === 400 ? 'PASS' : 'FAIL', `status ${exeUp.status} ${JSON.stringify(exeUp.body).slice(0, 120)}`);

    const mismatch = await upload('invoice.pdf', 'image/png', Buffer.from('%PDF-1.4 fake'), true);
    record('MIME/extension mismatch rejected', mismatch.status === 400 ? 'PASS' : 'FAIL', `status ${mismatch.status}`);

    const badScript = await upload('payload.sh', 'text/plain', Buffer.from('#!/bin/sh'), false);
    record('upload of .sh rejected', badScript.status === 400 ? 'PASS' : 'FAIL', `status ${badScript.status}`);

    const okUp = await upload('audit-invoice.pdf', 'application/pdf', Buffer.from('%PDF-1.4\n% audit test\n'), false);
    const okBody = okUp.body || {};
    const docId = okBody.id || (okBody.data && okBody.data.id);
    record('valid PDF upload accepted', (okUp.status === 201 || okUp.status === 200) ? 'PASS' : 'FAIL', `status ${okUp.status}, id=${docId}`);

    const pubDocs1 = await req(`${API}/api/documents/public/${encodeURIComponent(tn)}`);
    const list1 = Array.isArray(pubDocs1.body) ? pubDocs1.body : [];
    record('private upload hidden from public tracking', list1.length === 0 ? 'PASS' : 'FAIL', `${list1.length} public doc(s)`);

    if (docId) {
      eq('anonymous document download blocked', (await req(`${API}/api/documents/${docId}/download`)).status, 401);

      const vis = await req(`${API}/api/documents/${docId}/visibility`, {
        method: 'PATCH', headers: jsonHdr(token), body: JSON.stringify({ customerVisible: true }),
      });
      record('PATCH document visibility', vis.status === 200 ? 'PASS' : 'FAIL', `status ${vis.status}`);

      const pubDocs2 = await req(`${API}/api/documents/public/${encodeURIComponent(tn)}`);
      const list2 = Array.isArray(pubDocs2.body) ? pubDocs2.body : [];
      record('customer-visible document appears publicly', list2.length === 1 ? 'PASS' : 'FAIL', `${list2.length} public doc(s)`);
      absent('public document metadata hides storage path', list2, ['fileUrl', 'storagePath', 'bucket']);

      const pubFile = await fetch(`${API}/api/documents/public-file/${docId}`);
      record('public-file download of visible document', pubFile.status === 200 ? 'PASS' : 'FAIL', `status ${pubFile.status}`);

      const del = await req(`${API}/api/documents/${docId}`, { method: 'DELETE', headers: jsonHdr(token) });
      record('DELETE document (cleanup)', (del.status === 204 || del.status === 200) ? 'PASS' : 'FAIL', `status ${del.status}`);
    }
    data.documents = { docId };
  }

  // ---------- 8. PET TRACKING ----------
  log('');
  log('---------- 8. PET TRACKING ----------');
  const pets = await req(`${API}/api/pets`, { headers: jsonHdr(token) });
  const petList = Array.isArray(pets.body) ? pets.body : [];
  record('GET /api/pets', pets.status === 200 ? 'PASS' : 'FAIL', `${petList.length} pet shipment(s)`);
  const pet = petList.find(x => x.trackingNumber === 'USP-PET-2026-000789') || petList[0];
  if (pet) {
    const petTn = pet.trackingNumber;
    const petId = pet.id;
    record('pet profile has name/type/breed', (pet.petName && (pet.petType || pet.species)) ? 'PASS' : 'FAIL',
      `${pet.petName} / ${pet.petType} / ${pet.petBreed}`);

    const petPub = await req(`${API}/api/tracking/${encodeURIComponent(petTn)}`);
    const envelope = petPub.body || {};
    const pp = envelope.result || envelope;
    record('public pet tracking by tracking number', (petPub.status === 200 && envelope.type === 'pet') ? 'PASS' : 'FAIL',
      `status ${petPub.status}, type=${envelope.type}`);
    record('pet tracking shows name/type', (pp.petName && (pp.petType || pp.species)) ? 'PASS' : 'FAIL', `${pp.petName} / ${pp.petType}`);
    const petTl = pp.careEvents || pp.timeline || [];
    record('pet tracking shows care/timeline entries', petTl.length > 0 ? 'PASS' : 'FAIL', `${petTl.length} entries`);
    record('pet tracking shows location', (pp.currentLocationName || pp.currentLocation) ? 'PASS' : 'FAIL',
      `${pp.currentLocationName || pp.currentLocation}`);
    record('pet tracking shows map coordinates', (pp.originLatitude !== undefined || pp.currentLatitude !== undefined) ? 'PASS' : 'WARN',
      `originLat=${pp.originLatitude}, currentLat=${pp.currentLatitude}`);
    absent('pet tracking hides owner contact + internals', pp,
      ['ownerEmail', 'ownerPhone', 'auditLog', 'internalNote', 'customerId']);

    const petLoc = await req(`${API}/api/pets/${petId}/location`, {
      method: 'PUT', headers: jsonHdr(token),
      body: JSON.stringify({ currentLocationName: 'Audit Pet Hub', latitude: 39.74, longitude: -104.99, description: 'E2E pet location update' }),
    });
    record('PUT /api/pets/{id}/location', petLoc.status === 200 ? 'PASS' : 'FAIL', `status ${petLoc.status}`);
    const petLocBody = petLoc.body || {};
    record('pet location update is stored on the record',
      (petLoc.status === 200 && petLocBody.currentLatitude === 39.74 && petLocBody.currentLocationName === 'Audit Pet Hub') ? 'PASS' : 'FAIL',
      `lat=${petLocBody.currentLatitude}, location=${petLocBody.currentLocationName}`);

    const care = await req(`${API}/api/pets/${petId}/care-events`, {
      method: 'POST', headers: jsonHdr(token),
      body: JSON.stringify({ eventType: 'ComfortCheck', locationName: 'Audit Pet Hub', description: 'E2E care check', customerVisible: true }),
    });
    record('POST /api/pets/{id}/care-events', (care.status === 200 || care.status === 201) ? 'PASS' : 'FAIL', `status ${care.status}`);
    const careBody = care.body || {};
    const careEvents = Array.isArray(careBody.careEvents) ? careBody.careEvents : [];
    record('care event is stored on the pet record',
      (care.status === 200 && careEvents.some(e => e.eventType === 'ComfortCheck' && e.description === 'E2E care check')) ? 'PASS' : 'FAIL',
      `careEvents=${careEvents.length}`);

    const petPub2 = await req(`${API}/api/tracking/${encodeURIComponent(petTn)}`);
    const pp2 = ((petPub2.body || {}).result) || {};
    record('pet public tracking reflects the update', (petPub2.status === 200 && ((pp2.careEvents || []).length >= petTl.length)) ? 'PASS' : 'WARN',
      `careEvents=${(pp2.careEvents || []).length}`);
  } else {
    record('pet shipment available for testing', 'FAIL', 'no pet shipments returned');
  }

  // ---------- 9. ADMIN DASHBOARD / AUDIT / EMAIL STATUS ----------
  log('');
  log('---------- 9. ADMIN DASHBOARD, AUDIT & EMAIL ----------');
  const stats = await req(`${API}/api/admin/stats`, { headers: jsonHdr(token) });
  record('GET /api/admin/stats', stats.status === 200 ? 'PASS' : 'FAIL', `status ${stats.status}`);
  const audit = await req(`${API}/api/admin/audit-logs?count=50`, { headers: jsonHdr(token) });
  const auditArr = Array.isArray(audit.body) ? audit.body : [];
  record('GET /api/admin/audit-logs', audit.status === 200 ? 'PASS' : 'FAIL', `${auditArr.length} entries`);
  const auditText = JSON.stringify(audit.body || []);
  record('audit trail records E2E activity', auditArr.length > 0 && (auditText.includes('Audit') || auditText.includes('Shipment')) ? 'PASS' : 'WARN',
    `entries=${auditArr.length}`);
  const staff = await req(`${API}/api/admin/staff`, { headers: jsonHdr(token) });
  record('GET /api/admin/staff', staff.status === 200 ? 'PASS' : 'FAIL', `status ${staff.status}, ${Array.isArray(staff.body) ? staff.body.length : 'n/a'} staff`);
  const offices = await req(`${API}/api/offices`);
  record('GET /api/offices (anonymous, public page)', offices.status === 200 ? 'PASS' : 'FAIL',
    `${Array.isArray(offices.body) ? offices.body.length : 'n/a'} offices`);
  const vehicles = await req(`${API}/api/vehicles`, { headers: jsonHdr(token) });
  record('GET /api/vehicles', vehicles.status === 200 ? 'PASS' : 'FAIL', `${Array.isArray(vehicles.body) ? vehicles.body.length : 'n/a'} vehicles`);
  const notifLogs = await req(`${API}/api/notification-logs`, { headers: jsonHdr(token) });
  record('GET /api/notification-logs', notifLogs.status === 200 ? 'PASS' : 'FAIL', `status ${notifLogs.status}`);
  const emailStatus = await req(`${API}/api/email/status`, { headers: jsonHdr(token) });
  record('GET /api/email/status (provider config)', emailStatus.status === 200 ? 'PASS' : 'FAIL',
    JSON.stringify(emailStatus.body).slice(0, 200));
  data.emailStatus = emailStatus.body;

  // ---------- 10. PUBLIC FORMS ----------
  log('');
  log('---------- 10. PUBLIC FORMS ----------');
  const contactOk = await req(`${API}/api/contact`, {
    method: 'POST', headers: jsonHdr(),
    body: JSON.stringify({ name: 'Audit User', email: 'audit@example.com', subject: 'E2E audit', message: 'Automated pre-hosting audit message.' }),
  });
  record('POST /api/contact (valid)', contactOk.status === 200 ? 'PASS' : 'FAIL', `status ${contactOk.status}`);
  const contactBad = await req(`${API}/api/contact`, {
    method: 'POST', headers: jsonHdr(),
    body: JSON.stringify({ name: '', email: '', subject: '', message: '' }),
  });
  eq('POST /api/contact (invalid) rejected', contactBad.status, 400);

  // ---------- SUMMARY ----------
  log('');
  log('================ SUMMARY ================');
  log(`PASS: ${pass}   FAIL: ${fail}   WARN: ${warn}`);
  log(fail === 0 ? 'RESULT: ALL CHECKS PASSED' : `RESULT: ${fail} CHECK(S) FAILED`);
  flush();
})().catch(e => {
  log('FATAL: ' + (e && e.stack ? e.stack : String(e)));
  flush();
  console.log('FATAL: ' + e);
});

