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
  var unsubscribe = null;

  $('btnConsult').addEventListener('click', function() {
    var phone = $('cPhone').value.replace(/\D/g, '');
    if (!phone) {
      $('msg').textContent = 'Por favor escribe tu número de celular.';
      return;
    }

    $('msg').textContent = 'Buscando tu tarjeta...';

    if (unsubscribe) unsubscribe();

    unsubscribe = db.collection('customers')
      .where('phone', '==', phone)
      .onSnapshot(function(snapshot) {
        if (snapshot.empty) {
          $('msg').textContent = 'No encontramos una tarjeta registrada con ese número.';
          return;
        }

        var data = snapshot.docs[0].data();
        $('searchBox').classList.add('hidden');
        $('cardBox').classList.remove('hidden');

        $('cName').textContent = '¡Hola, ' + data.name + '! 👑';
        var n = data.n || 0;
        $('cSub').textContent = 'Tienes ' + n + ' de 10 sellos acumulados';

        var dotsContainer = $('dotsContainer');
        dotsContainer.innerHTML = '';
        for (var i = 1; i <= 10; i++) {
          var dot = document.createElement('div');
          dot.className = 'dot' + (i <= n ? ' on' : '') + ((i === 5 || i === 10) ? ' r' : '');
          dot.textContent = i <= n ? '👑' : (i === 5 ? '🥤' : i === 10 ? '🍔' : '');
          dotsContainer.appendChild(dot);
        }

        var prizeMsg = $('prizeMsg');
        if (n >= 10 && !data.r10) {
          prizeMsg.textContent = '🎉 ¡Felicidades! Tienes una Hamburguesa o Salchipapa GRATIS lista para canjear en tu próxima visita.';
          prizeMsg.style.color = 'var(--ok)';
        } else if (n >= 5 && !data.r5) {
          prizeMsg.textContent = '🥤 ¡Felicidades! Tienes una Limonada GRATIS lista para pedir en caja.';
          prizeMsg.style.color = 'var(--ok)';
        } else if (n < 5) {
          prizeMsg.textContent = 'Te faltan ' + (5 - n) + ' sellos para tu limonada gratis.';
          prizeMsg.style.color = 'var(--ink)';
        } else {
          prizeMsg.textContent = 'Te faltan ' + (10 - n) + ' sellos para tu hamburguesa gratis.';
          prizeMsg.style.color = 'var(--ink)';
        }
      }, function(error) {
        $('msg').textContent = 'Error al conectar con la base de datos.';
      });
  });

  $('btnBack').addEventListener('click', function() {
    if (unsubscribe) unsubscribe();
    $('cardBox').classList.add('hidden');
    $('searchBox').classList.remove('hidden');
    $('cPhone').value = '';
    $('msg').textContent = '';
  });
})();