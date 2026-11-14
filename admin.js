// Configuración de Firebase con tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyBIkhbhHqMA_eZCw4G0fKJ5WFq8SZ_cB5k",
  authDomain: "the-chosen-one-2026.firebaseapp.com",
  projectId: "the-chosen-one-2026",
  storageBucket: "the-chosen-one-2026.firebasestorage.app",
  messagingSenderId: "747006173267",
  appId: "1:747006173267:web:a49b70ce348ab64f1166a6",
  measurementId: "G-J55HDBWX5P"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

(function() {
  var $ = function(id) { return document.getElementById(id); };
  var docs = [], confirming = {}, editingCustomer = {};

  function today() { return new Date().toLocaleDateString('en-CA'); }
  function nowTime() { 
    return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }); 
  }
  function say(t, bad) { 
    var m = $('msg'); m.textContent = t; m.style.color = bad ? 'var(--bad)' : 'var(--ink)'; 
  }
  function el(tag, cls, text) { 
    var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; 
  }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  function parseHistory(c) {
    var raw = Array.isArray(c.history) ? c.history : (c.last ? [c.last] : []);
    return raw.map(function(entry) {
      var parts = String(entry).trim().split(' ');
      return { date: parts[0] || '', time: parts[1] || '', full: entry };
    }).filter(function(item) { return item.date !== ''; });
  }

  $('repDate').value = today();

  function waLink(c) {
    var p = digits(c.phone); if (!p) return null;
    if (p.length === 9) p = '51' + p;
    var t = 'Hola ' + c.name + ', tienes ' + c.n + ' de 10 sellos en The Chosen One Club 👑. ¡Te esperamos!';
    if (c.n >= 10 && !c.r10) t = 'Hola ' + c.name + ', ¡completaste tu tarjeta! 👑 Tu premio sorpresa te espera.';
    else if (c.n >= 5 && !c.r5) t = 'Hola ' + c.name + ', ¡tienes tu premio sorpresa intermedio disponible! 🎁 Pídelo en tu próxima visita.';
    return 'https://wa.me/' + p + '?text=' + encodeURIComponent(t);
  }

  function patch(id, data, okMsg) {
    db.collection('customers').doc(id).update(data)
      .then(function() { say(okMsg); })
      .catch(function() { say('Error al actualizar la base de datos.', true); });
  }

  function renderReport() {
    var targetDate = $('repDate').value || today();
    var stampedList = [];
    var newList = [];

    docs.forEach(function(d) {
      var c = d.data();
      var hist = parseHistory(c);
      hist.forEach(function(h) {
        if (h.date === targetDate) {
          stampedList.push(h.time ? (c.name + ' (' + h.time + ')') : c.name);
        }
      });
      if (c.created === targetDate) {
        newList.push(c.createdTime ? (c.name + ' (' + c.createdTime + ')') : c.name);
      }
    });

    $('rStamps').textContent = stampedList.length;
    $('rNew').textContent = newList.length;

    var det = $('repDetails');
    det.innerHTML = '';
    var p1 = el('p');
    p1.innerHTML = '<b>👑 Sellos dados (' + stampedList.length + '):</b> ' + (stampedList.length ? stampedList.join(', ') : 'Ninguno');
    var p2 = el('p');
    p2.innerHTML = '<b>✨ Nuevos registrados (' + newList.length + '):</b> ' + (newList.length ? newList.join(', ') : 'Ninguno');
    det.appendChild(p1);
    det.appendChild(p2);
  }

  $('repDate').addEventListener('change', renderReport);

  $('copyRep').addEventListener('click', function() {
    var d = $('repDate').value || today();
    var sCount = $('rStamps').textContent;
    var nCount = $('rNew').textContent;
    var lines = $('repDetails').innerText;
    var text = '📊 *REPORTE THE CHOSEN ONE (' + d + ')*\n' +
               '• Sellos otorgados: ' + sCount + '\n' +
               '• Clientes nuevos: ' + nCount + '\n\n' + lines;
    navigator.clipboard.writeText(text).then(function() {
      say('Reporte copiado al portapapeles.');
    }).catch(function() {
      say('No se pudo copiar automáticamente.', true);
    });
  });

  // GENERADOR DE EXCEL ORDENADO, LIMPIO Y SIN ABREVIATURAS CONFUSAS
  $('exportExcel').addEventListener('click', function() {
    if (!docs.length) {
      say('No hay clientes registrados para exportar.', true);
      return;
    }

    var dailyMap = {};
    var movementsList = [];

    function ensureDate(dt) {
      if (!dt) return;
      if (!dailyMap[dt]) dailyMap[dt] = { stamps: [], newCusts: [] };
    }

    // Ordenar clientes alfabéticamente (A - Z)
    var sortedDocs = docs.slice().sort(function(a, b) {
      var nameA = String(a.data().name || '').toLowerCase();
      var nameB = String(b.data().name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    sortedDocs.forEach(function(d) {
      var c = d.data();
      if (c.created) {
        ensureDate(c.created);
        var regLabel = c.createdTime ? ('• ' + c.name + ' (' + c.createdTime + ' hrs)') : ('• ' + c.name);
        dailyMap[c.created].newCusts.push(regLabel);
      }
      var hist = parseHistory(c);
      hist.forEach(function(h) {
        ensureDate(h.date);
        var stampLabel = h.time ? ('• ' + c.name + ' (' + h.time + ' hrs)') : ('• ' + c.name);
        dailyMap[h.date].stamps.push(stampLabel);
        movementsList.push({
          date: h.date,
          time: h.time || 'Sin hora registrada',
          name: c.name || '',
          phone: c.phone || 'Sin celular',
          n: c.n || 0
        });
      });
    });

    var sortedDates = Object.keys(dailyMap).sort().reverse();
    movementsList.sort(function(a, b) {
      return (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time);
    });

    function escHtml(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Convierte listas en líneas separadas dentro de la misma celda para lectura clara
    function listToLines(arr, emptyText) {
      if (!arr || !arr.length) return escHtml(emptyText);
      return arr.map(escHtml).join('<br style="mso-data-placement:same-cell;">');
    }

    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><style>' +
      'table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }' +
      'th { background-color: #141008; color: #FFC21A; font-weight: bold; border: 1px solid #000000; padding: 10px 14px; text-align: center; }' +
      'td { border: 1px solid #888888; padding: 8px 12px; vertical-align: middle; }' +
      '.title { background-color: #F5B700; color: #141008; font-size: 13pt; font-weight: bold; text-align: left; padding: 11px 14px; border: 1px solid #000000; }' +
      '.center { text-align: center; }' +
      '.left { text-align: left; }' +
      '.even { background-color: #FFFDF5; }' +
      '.spacer { border: none; height: 22px; background: #FFFFFF; }' +
      '</style></head><body>';

    // TABLA 1: RESUMEN HISTÓRICO DIARIO
    html += '<table>' +
      '<tr><td colspan="5" class="title">👑 THE CHOSEN ONE — RESUMEN HISTÓRICO POR DÍA</td></tr>' +
      '<tr>' +
        '<th style="width:130px;">Fecha</th>' +
        '<th style="width:140px;">Sellos Dados</th>' +
        '<th style="width:320px;">Lista de Clientes con Sello</th>' +
        '<th style="width:140px;">Clientes Nuevos</th>' +
        '<th style="width:320px;">Lista de Clientes Nuevos</th>' +
      '</tr>';

    sortedDates.forEach(function(dt, idx) {
      var info = dailyMap[dt];
      var cls = idx % 2 === 1 ? ' class="even"' : '';
      html += '<tr' + cls + '>' +
        '<td class="center"><b>' + escHtml(dt) + '</b></td>' +
        '<td class="center"><b>' + info.stamps.length + '</b></td>' +
        '<td class="left">' + listToLines(info.stamps, 'Ninguno') + '</td>' +
        '<td class="center"><b>' + info.newCusts.length + '</b></td>' +
        '<td class="left">' + listToLines(info.newCusts, 'Ninguno') + '</td>' +
      '</tr>';
    });
    html += '<tr><td colspan="5" class="spacer"></td></tr></table>';

    // TABLA 2: DETALLE DE SELLOS POR FECHA Y HORA
    html += '<table>' +
      '<tr><td colspan="5" class="title">🕒 DETALLE DE SELLOS OTORGADOS (ORDEN CRONOLÓGICO)</td></tr>' +
      '<tr>' +
        '<th style="width:130px;">Fecha</th>' +
        '<th style="width:170px;">Hora</th>' +
        '<th style="width:280px;">Nombre del Cliente</th>' +
        '<th style="width:150px;">Celular</th>' +
        '<th style="width:160px;">Progreso Actual</th>' +
      '</tr>';

    movementsList.forEach(function(m, idx) {
      var cls = idx % 2 === 1 ? ' class="even"' : '';
      html += '<tr' + cls + '>' +
        '<td class="center">' + escHtml(m.date) + '</td>' +
        '<td class="center"><b>' + escHtml(m.time) + '</b></td>' +
        '<td class="left">' + escHtml(m.name) + '</td>' +
        '<td class="center">' + escHtml(m.phone) + '</td>' +
        '<td class="center">' + m.n + ' de 10 sellos</td>' +
      '</tr>';
    });
    html += '<tr><td colspan="5" class="spacer"></td></tr></table>';

    // TABLA 3: BASE GENERAL DE CLIENTES (ORDEN ALFABÉTICO A - Z)
    html += '<table>' +
      '<tr><td colspan="7" class="title">📋 PADRÓN GENERAL DE CLIENTES (ORDEN ALFABÉTICO)</td></tr>' +
      '<tr>' +
        '<th style="width:270px;">Nombre del Cliente</th>' +
        '<th style="width:140px;">Celular</th>' +
        '<th style="width:150px;">Progreso Actual</th>' +
        '<th style="width:170px;">Tarjetas Completadas</th>' +
        '<th style="width:150px;">Fecha de Registro</th>' +
        '<th style="width:170px;">Hora de Registro</th>' +
        '<th style="width:320px;">Historial de Visitas</th>' +
      '</tr>';

    sortedDocs.forEach(function(d, idx) {
      var c = d.data();
      var cls = idx % 2 === 1 ? ' class="even"' : '';
      var hist = parseHistory(c).map(function(h) {
        return h.time ? ('• ' + h.date + ' (' + h.time + ' hrs)') : ('• ' + h.date);
      });
      html += '<tr' + cls + '>' +
        '<td class="left"><b>' + escHtml(c.name || '') + '</b></td>' +
        '<td class="center">' + escHtml(c.phone || 'Sin celular') + '</td>' +
        '<td class="center">' + (c.n || 0) + ' de 10 sellos</td>' +
        '<td class="center">' + (c.done || 0) + '</td>' +
        '<td class="center">' + escHtml(c.created || '') + '</td>' +
        '<td class="center">' + escHtml(c.createdTime || 'Sin hora registrada') + '</td>' +
        '<td class="left">' + listToLines(hist, 'Sin visitas') + '</td>' +
      '</tr>';
    });
    html += '</table></body></html>';

    var blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Reporte_The_Chosen_One_' + today() + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    say('✅ Excel ordenado descargado correctamente.');
  });

  function card(d) {
    var c = d.data(); var id = d.id; var n = c.n || 0; var doneToday = (c.last === today());
    var box = el('div', 'cust');
    var top = el('div', 'top'); top.appendChild(el('b', null, c.name)); top.appendChild(el('span', null, (c.phone || 'Sin celular') + ' · ' + n + ' de 10'));
    box.appendChild(top);

    var dots = el('div', 'dots');
    for (var i = 1; i <= 10; i++) {
      var dt = el('div', 'dot' + (i <= n ? ' on' : '') + ((i === 5 || i === 10) ? ' r' : ''), i <= n ? '👑' : (i === 5 ? '🎁' : i === 10 ? '🏆' : ''));
      dots.appendChild(dt);
    }
    box.appendChild(dots);

    var st = '', ready = false;
    if (n >= 10 && !c.r10) { st = 'Premio listo: Premio Sorpresa Final'; ready = true; }
    else if (n >= 5 && !c.r5) { st = 'Premio listo: Premio Sorpresa Intermedio'; ready = true; }
    else if (n < 5) { st = 'Faltan ' + (5 - n) + ' sellos para el Premio Intermedio'; }
    else { st = 'Faltan ' + (10 - n) + ' sellos para el Premio Final'; }
    if (doneToday) st += ' · Ya tiene sello de hoy';
    box.appendChild(el('p', 'state' + (ready ? ' ready' : ''), st));

    var acts = el('div', 'acts');
    
    var b1 = el('button', null, 'Sumar sello'); b1.type = 'button'; b1.disabled = (n >= 10 || doneToday);
    b1.onclick = function() { 
      var t = today();
      var stampWithTime = t + ' ' + nowTime();
      var hist = Array.isArray(c.history) ? c.history.slice() : (c.last ? [c.last] : []);
      var alreadyToday = hist.some(function(x) { return String(x).indexOf(t) === 0; });
      if (!alreadyToday) hist.push(stampWithTime);
      patch(id, { n: n + 1, last: t, history: hist }, 'Sello sumado a ' + c.name + ' (' + nowTime() + ').'); 
    };
    acts.appendChild(b1);

    var bSub = el('button', 'alt', 'Restar sello'); bSub.type = 'button'; bSub.disabled = (n <= 0);
    bSub.onclick = function() { 
      var newCount = Math.max(0, n - 1);
      var t = today();
      var hist = Array.isArray(c.history) ? c.history.filter(function(x) { return String(x).indexOf(t) !== 0; }) : [];
      patch(id, { n: newCount, last: '', history: hist }, 'Sello removido a ' + c.name + '.'); 
    };
    acts.appendChild(bSub);

    if (n >= 5 && !c.r5) {
      var b2 = el('button', 'alt', 'Canjear Premio 5'); b2.type = 'button';
      b2.onclick = function() { patch(id, { r5: true }, 'Premio intermedio canjeado.'); };
      acts.appendChild(b2);
    }
    if (n >= 10 && !c.r10) {
      var b3 = el('button', 'alt', 'Canjear Premio 10'); b3.type = 'button';
      b3.onclick = function() { patch(id, { n: 0, r5: false, r10: false, done: (c.done || 0) + 1 }, 'Premio final canjeado. Tarjeta reiniciada.'); };
      acts.appendChild(b3);
    }
    box.appendChild(acts);

    var more = el('div', 'acts'); more.style.marginTop = '8px';
    
    var w = waLink(c);
    if (w) { var a = el('a', 'btn alt small', 'Avisar por WhatsApp'); a.href = w; a.target = '_blank'; more.appendChild(a); }
    
    var btnEdit = el('button', 'alt small', '✏️ Editar datos'); btnEdit.type = 'button';
    btnEdit.onclick = function() {
      editingCustomer[id] = !editingCustomer[id];
      render();
    };
    more.appendChild(btnEdit);

    var del = el('button', 'alt small', confirming[id] ? 'Confirmar eliminar' : 'Eliminar cliente'); del.type = 'button';
    del.onclick = function() {
      if (!confirming[id]) { confirming[id] = true; render(); return; }
      db.collection('customers').doc(id).delete();
    };
    more.appendChild(del);
    box.appendChild(more);

    if (editingCustomer[id]) {
      var editBox = el('div', 'edit-phone-box');
      editBox.style.flexDirection = 'column';
      
      var inputName = el('input'); inputName.type = 'text'; inputName.placeholder = 'Nombre del cliente'; inputName.value = c.name || '';
      inputName.style.marginBottom = '6px';
      
      var inputPhone = el('input'); inputPhone.type = 'tel'; inputPhone.placeholder = 'Número de celular'; inputPhone.value = c.phone || '';
      
      var btnSave = el('button', 'small', 'Guardar cambios'); btnSave.type = 'button'; btnSave.style.marginTop = '6px';
      btnSave.onclick = function() {
        var newName = inputName.value.trim();
        var newPhone = digits(inputPhone.value);
        if (!newName) { say('El nombre no puede estar vacío.', true); return; }
        
        patch(id, { name: newName, phone: newPhone }, 'Datos de ' + newName + ' actualizados.');
        editingCustomer[id] = false;
      };

      editBox.appendChild(inputName);
      editBox.appendChild(inputPhone);
      editBox.appendChild(btnSave);
      box.appendChild(editBox);
    }

    return box;
  }

  function render() {
    var q = $('q').value.trim().toLowerCase();
    var list = $('list'); list.textContent = '';
    var ready = 0;
    docs.forEach(function(d) { var c = d.data(); var n = c.n || 0; if ((n >= 10 && !c.r10) || (n >= 5 && !c.r5)) ready++; });
    $('sClients').textContent = docs.length; $('sReady').textContent = ready;

    renderReport();

    var shown = docs.filter(function(d) {
      var c = d.data(); return !q || String(c.name).toLowerCase().indexOf(q) > -1 || digits(c.phone).indexOf(digits(q) || '§') > -1;
    });

    if (!shown.length) {
      list.appendChild(el('div', 'empty', docs.length ? 'Sin resultados.' : 'Aún no hay clientes.'));
      return;
    }
    shown.forEach(function(d) { list.appendChild(card(d)); });
  }

  $('q').addEventListener('input', render);

  $('add').addEventListener('click', function() {
    var name = $('fn').value.trim();
    var phone = digits($('fp').value);
    if (!name) { say('Escribe el nombre.', true); return; }
    
    db.collection('customers').add({
      name: name, 
      phone: phone, 
      n: 0, 
      r5: false, 
      r10: false, 
      last: '', 
      history: [], 
      done: 0, 
      created: today(),
      createdTime: nowTime()
    }).then(function() {
      $('fn').value = ''; $('fp').value = ''; say(name + ' fue agregado (' + nowTime() + ').');
    });
  });

  db.collection('customers').onSnapshot(function(snap) {
    docs = snap.docs;
    render();
  });
})();
