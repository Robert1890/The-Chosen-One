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
  function say(t, bad) { 
    var m = $('msg'); m.textContent = t; m.style.color = bad ? 'var(--bad)' : 'var(--ink)'; 
  }
  function el(tag, cls, text) { 
    var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; 
  }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }

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
    var stampedNames = [];
    var newNames = [];

    docs.forEach(function(d) {
      var c = d.data();
      var hist = Array.isArray(c.history) ? c.history : (c.last ? [c.last] : []);
      if (hist.indexOf(targetDate) > -1) {
        stampedNames.push(c.name);
      }
      if (c.created === targetDate) {
        newNames.push(c.name);
      }
    });

    $('rStamps').textContent = stampedNames.length;
    $('rNew').textContent = newNames.length;

    var det = $('repDetails');
    det.innerHTML = '';
    
    var p1 = el('p');
    p1.innerHTML = '<b>👑 Sellos dados (' + stampedNames.length + '):</b> ' + (stampedNames.length ? stampedNames.join(', ') : 'Ninguno');
    
    var p2 = el('p');
    p2.innerHTML = '<b>✨ Nuevos registrados (' + newNames.length + '):</b> ' + (newNames.length ? newNames.join(', ') : 'Ninguno');

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

  // GENERADOR DE ARCHIVO EXCEL REAL (.xlsx) CON 2 PESTAÑAS
  $('exportExcel').addEventListener('click', function() {
    if (!docs.length) {
      say('No hay clientes registrados para exportar.', true);
      return;
    }

    if (typeof XLSX === 'undefined') {
      say('Cargando librería de Excel, intenta en 3 segundos...', true);
      return;
    }

    try {
      var dailyMap = {};
      function ensureDate(dt) {
        if (!dt) return;
        if (!dailyMap[dt]) dailyMap[dt] = { stamps: [], newCusts: [] };
      }

      docs.forEach(function(d) {
        var c = d.data();
        if (c.created) {
          ensureDate(c.created);
          dailyMap[c.created].newCusts.push(c.name);
        }
        var hist = Array.isArray(c.history) ? c.history : (c.last ? [c.last] : []);
        hist.forEach(function(dt) {
          ensureDate(dt);
          if (dailyMap[dt].stamps.indexOf(c.name) === -1) {
            dailyMap[dt].stamps.push(c.name);
          }
        });
      });

      var sortedDates = Object.keys(dailyMap).sort().reverse();

      // Pestaña 1: Historial Diario
      var dailyData = sortedDates.map(function(dt) {
        var info = dailyMap[dt];
        return {
          'Fecha': dt,
          'Sellos Otorgados': info.stamps.length,
          'Clientes con Sello': info.stamps.join(', ') || 'Ninguno',
          'Clientes Nuevos': info.newCusts.length,
          'Nombres Nuevos': info.newCusts.join(', ') || 'Ninguno'
        };
      });

      if (!dailyData.length) {
        dailyData.push({ 'Fecha': today(), 'Sellos Otorgados': 0, 'Clientes con Sello': 'Ninguno', 'Clientes Nuevos': 0, 'Nombres Nuevos': 'Ninguno' });
      }

      // Pestaña 2: Base de Clientes
      var clientsData = docs.map(function(d) {
        var c = d.data();
        var hist = Array.isArray(c.history) ? c.history : (c.last ? [c.last] : []);
        return {
          'Nombre': c.name || '',
          'Celular': c.phone || 'Sin celular',
          'Sellos Actuales': c.n || 0,
          'Tarjetas Completadas': c.done || 0,
          'Fecha Registro': c.created || '',
          'Último Sello': c.last || '',
          'Historial de Visitas': hist.join(', ')
        };
      });

      var wb = XLSX.utils.book_new();
      var ws1 = XLSX.utils.json_to_sheet(dailyData);
      var ws2 = XLSX.utils.json_to_sheet(clientsData);

      XLSX.utils.book_append_sheet(wb, ws1, 'Historial Diario');
      XLSX.utils.book_append_sheet(wb, ws2, 'Clientes');

      XLSX.writeFile(wb, 'Reporte_The_Chosen_One_' + today() + '.xlsx');
      say('✅ Excel descargado correctamente.');
    } catch (err) {
      say('Error al generar Excel: ' + err.message, true);
    }
  });

  function card(d) {
    var c = d.data(); var id = d.id; var n = c.n || 0; var doneToday = (c.last === today());
    var box = el('div', 'cust');
    var top = el('div', 'top'); top.appendChild(el('b', null, c.name)); top.appendChild(el('span', null, (c.phone || 'Sin celular') + ' · ' + n + '/10'));
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
      var hist = Array.isArray(c.history) ? c.history.slice() : (c.last ? [c.last] : []);
      if (hist.indexOf(t) === -1) hist.push(t);
      patch(id, { n: n + 1, last: t, history: hist }, 'Sello sumado a ' + c.name + '.'); 
    };
    acts.appendChild(b1);

    var bSub = el('button', 'alt', 'Restar sello'); bSub.type = 'button'; bSub.disabled = (n <= 0);
    bSub.onclick = function() { 
      var newCount = Math.max(0, n - 1);
      var t = today();
      var hist = Array.isArray(c.history) ? c.history.filter(function(x) { return x !== t; }) : [];
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
      name: name, phone: phone, n: 0, r5: false, r10: false, last: '', history: [], done: 0, created: today()
    }).then(function() {
      $('fn').value = ''; $('fp').value = ''; say(name + ' fue agregado.');
    });
  });

  db.collection('customers').onSnapshot(function(snap) {
    docs = snap.docs;
    render();
  });
})();
