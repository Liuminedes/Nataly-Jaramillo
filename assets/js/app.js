// ─── LÓGICA UI: catálogo, modales, WhatsApp, tema ────────────────────────────

function renderCards(category) {
  var grid = document.getElementById("vehicleGrid");
  var list = category === "Todos" ? VEHICLES : VEHICLES.filter(function(v){ return v.category === category; });
  grid.innerHTML = list.map(function(v) {
    var isEV = v.tag === "Eléctrico";
    var price = getDisplayPrice(v);
    var idx = VEHICLES.findIndex(function(x){ return x.id === v.id; });
    return '<div class="vehicle-card" onclick="openVehicleModal(' + idx + ')">' +
      '<div class="card-top">' +
        '<div class="card-bg-glow"></div>' +
        '<div class="card-tag tag-' + v.tag.replace(/\s/g,"-") + '">' + v.tag + '</div>' +
        '<div class="card-arrow">↗</div>' +
        '<div class="card-img-wrap"><img src="' + v.img + '" alt="' + v.name + '" loading="lazy" onerror="this.style.display=\'none\'"/></div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-meta">' + v.category + ' · ' + v.year + '</div>' +
        '<div class="card-name">' + v.name + '</div>' +
        '<div class="card-desc">' + v.description + '</div>' +
        '<div class="card-footer-row">' +
          '<div><div class="card-price">' + fpShort(price) + '</div></div>' +
          '<button class="card-cta">Ver ficha</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join("");
}

document.getElementById("filterBar").addEventListener("click", function(e) {
  var btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll(".filter-btn").forEach(function(b){ b.classList.remove("active"); });
  btn.classList.add("active");
  activeCategory = btn.dataset.cat;
  renderCards(activeCategory);
});
renderCards("Todos");

var vehicleModal = document.getElementById("vehicleModal");
var currentVehicle = null;
function openVehicleModal(idx) {
  var v = VEHICLES[idx];
  var isEV = v.tag === "Eléctrico";
  var price = getDisplayPrice(v);
  currentVehicle = v;

  // Header
  document.getElementById("mSub").textContent = v.category + " · " + v.year;
  document.getElementById("mTitle").textContent = v.name;
  var tagEl = document.getElementById("mTag");
  tagEl.className = "modal-tag tag-" + v.tag.replace(/\s/g,"-");
  tagEl.textContent = v.tag;

  // Left column
  document.getElementById("mImg").src = v.img;
  document.getElementById("mImg").alt = v.name;
  document.getElementById("mDesc").textContent = v.description;

  // Specs as key-value rows
  var specsHtml = Object.entries(v.specs).map(function(e) {
    return '<div class="spec-row"><span class="spec-key">' + e[0] + '</span><span class="spec-val">' + e[1] + '</span></div>';
  }).join("");
  document.getElementById("mSpecs").innerHTML = specsHtml;

  // Price footer
  document.getElementById("mPrice").textContent = fp(price);

  // Note label
  var noteEl = document.getElementById("mTrimsNote");
  if (noteEl) noteEl.textContent = '';

  // Right column: trim cards
  var trimsList = document.getElementById("mTrimsList");
  if (v.trims && v.trims.length) {
    trimsList.innerHTML = v.trims.map(function(t, ti) {
      var p = isEV ? t.precioPublico : t.precioLista;
      var bono = t.precioLista - t.precioPublico;
      var bonoHtml = bono > 0 ? '<span class="trim-bono">Bono ' + fp(bono) + '</span>' : "";
      var chips = (t.features || []).map(function(f, fi) {
        return '<li class="' + (fi===0 ? "chip-base" : "") + '">' + f + '</li>';
      }).join("");
      var featHtml = chips ? '<div class="trim-features-wrap" id="trim-feat-' + ti + '" style="display:none"><div class="trim-feat-title">Equipamiento</div><ul class="trim-chips">' + chips + '</ul></div>' : '';
      return '<div class="trim-card" id="trim-card-' + ti + '" onclick="selectTrim(this,' + ti + ',\'' + v.name.replace(/'/g,"\\'") + '\',\'' + t.version.replace(/'/g,"\\'") + '\',' + t.year + ',' + p + ')">' +
        '<div class="trim-card-header">' +
          '<div class="trim-info"><span class="trim-version">' + t.version + '</span><span class="trim-year">' + t.year + '</span></div>' +
          '<div class="trim-right"><span class="trim-price">' + fp(p) + '</span>' + bonoHtml + '<span class="trim-chevron">›</span></div>' +
        '</div>' +
        featHtml +
      '</div>';
    }).join("");
  } else {
    trimsList.innerHTML = '';
  }

  document.getElementById("mWaBtn").onclick = function() { openWaWithVehicle(v); };
  vehicleModal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function selectTrim(el, trimIdx, modelName, version, year, price) {
  var v = VEHICLES.find(function(x){ return x.name === modelName; });
  var featWrap = document.getElementById("trim-feat-" + trimIdx);
  var chevron = el.querySelector(".trim-chevron");
  var isOpen = featWrap && featWrap.style.display !== "none";
  // Collapse all
  document.querySelectorAll(".trim-features-wrap").forEach(function(w){ w.style.display = "none"; });
  document.querySelectorAll(".trim-chevron").forEach(function(c){ c.textContent = "›"; c.style.transform = ""; });
  document.querySelectorAll(".trim-card").forEach(function(r){ r.classList.remove("trim-selected"); });
  // Expand clicked
  if (!isOpen && featWrap) {
    featWrap.style.display = "block";
    chevron.textContent = "›";
    chevron.style.transform = "rotate(90deg)";
    el.classList.add("trim-selected");
  }
  // Update price footer
  document.getElementById("mPrice").textContent = fp(price);
  document.getElementById("mWaBtn").onclick = function() { openWaWithVehicle(v, version, year, price); };
}
function closeVehicleModal(e) { if (e.target === vehicleModal) closeVehicleModalDirect(); }
function closeVehicleModalDirect() { vehicleModal.classList.remove("open"); document.body.style.overflow = ""; }

var pendingContext = {};
function openWaWithVehicle(v, version, year, trimPrice) {
  var vStr = version ? v.name + " " + version + " " + year : v.name;
  pendingContext = { vehiculo: vStr, precio: fp(trimPrice || getDisplayPrice(v)), categoria: v.category, tipo: "cotizar_vehiculo" };
  vehicleModal.classList.remove("open");
  leadReset();
  setTimeout(function() { var el = document.getElementById("leadVehiculo"); if (el) el.value = pendingContext.vehiculo || ""; }, 80);
  document.getElementById("nameModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function openWa() {
  var container = document.getElementById("waOptions");
  container.innerHTML = WA_OPTIONS.map(function(o) {
    var onclick = o.needsLead ? "openLeadForm('" + o.tipo + "')" : "sendWaDirect('" + escapeMsg(o.msg) + "')";
    return '<button class="wa-option" onclick="' + onclick + '"><span class="wa-option-icon">' + o.icon + '</span><span>' + o.label + '</span><span class="wa-option-arrow">›</span></button>';
  }).join("");
  document.getElementById("waModal").classList.add("open");
  document.body.style.overflow = "hidden";
}
function openLeadForm(tipo) {
  pendingContext = { tipo: tipo };
  document.getElementById("waModal").classList.remove("open");
  leadReset();
  document.getElementById("nameModal").classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(function() { var inp = document.getElementById("leadNombre"); if (inp) inp.focus(); }, 150);
}
function sendWaDirect(msg) {
  msg = (msg || "").replace(/\\n/g, "\n");
  document.getElementById("waModal").classList.remove("open");
  document.body.style.overflow = "";
  window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg), "_blank");
}
function escapeMsg(msg) { return (msg || "").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n"); }

function leadReset() {
  document.getElementById("leadStep1").style.display = "block";
  document.getElementById("leadStep2").style.display = "none";
  ["leadNombre","leadTelefono","leadVehiculo"].forEach(function(id){ var el = document.getElementById(id); if (el) { el.value = ""; el.classList.remove("error"); } });
  ["leadPresupuesto","leadIngresos"].forEach(function(id){ var el = document.getElementById(id); if (el) { el.value = ""; el.classList.remove("error"); } });
  document.querySelectorAll("input[name='empleo']").forEach(function(r){ r.checked = false; });
  document.querySelectorAll("input[name='datacredito']").forEach(function(r){ r.checked = false; });
}
function leadNextStep() {
  var nombre = (document.getElementById("leadNombre").value || "").trim();
  var tel = (document.getElementById("leadTelefono").value || "").trim();
  var ok = true;
  if (!nombre) { document.getElementById("leadNombre").classList.add("error"); document.getElementById("leadNombre").focus(); ok = false; } else { document.getElementById("leadNombre").classList.remove("error"); }
  if (!tel || tel.replace(/\D/g,"").length < 7) { document.getElementById("leadTelefono").classList.add("error"); if (ok) document.getElementById("leadTelefono").focus(); ok = false; } else { document.getElementById("leadTelefono").classList.remove("error"); }
  if (!ok) return;
  document.getElementById("leadStep1").style.display = "none";
  document.getElementById("leadStep2").style.display = "block";
}
function leadPrevStep() { document.getElementById("leadStep2").style.display = "none"; document.getElementById("leadStep1").style.display = "block"; }
function submitLead() {
  var nombre = (document.getElementById("leadNombre").value || "").trim();
  var tel = (document.getElementById("leadTelefono").value || "").trim().replace(/\D/g,"");
  var vehiculo = (document.getElementById("leadVehiculo").value || "").trim();
  var presupuesto = document.getElementById("leadPresupuesto").value || "";
  var ingresos = document.getElementById("leadIngresos").value || "";
  var empleoEl = document.querySelector("input[name='empleo']:checked");
  var empleo = empleoEl ? empleoEl.value : "";
  var dataEl = document.querySelector("input[name='datacredito']:checked");
  var datacredito = dataEl ? dataEl.value : "";
  var telDisplay = tel.length >= 10 ? "+57 " + tel.slice(-10) : (tel ? "+57 " + tel : "no indicado");
  if (!vehiculo && pendingContext && pendingContext.vehiculo) vehiculo = pendingContext.vehiculo;
  var lead = { nombre: nombre, tel: telDisplay, vehiculo: vehiculo || "cualquier KIA", presupuesto: presupuesto, empleo: empleo, ingresos: ingresos, datacredito: datacredito };
  var ctx = pendingContext || { tipo: "cotizar" };
  var finalMsg = buildMsgFromLead(lead, ctx);
  closeNameModalDirect();
  window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(finalMsg), "_blank");
}
function closeNameModal(e) { if (e.target === document.getElementById("nameModal")) closeNameModalDirect(); }
function closeNameModalDirect() { document.getElementById("nameModal").classList.remove("open"); document.body.style.overflow = ""; pendingContext = {}; }
function closeWaModal(e) { if (e.target === document.getElementById("waModal")) closeWaModalDirect(); }
function closeWaModalDirect() { document.getElementById("waModal").classList.remove("open"); document.body.style.overflow = ""; }
document.addEventListener("keydown", function(e) { if (e.key === "Escape") { closeVehicleModalDirect(); closeWaModalDirect(); closeNameModalDirect(); } });

// ─── THEME TOGGLE ─────────────────────────────────
var html = document.documentElement;
document.getElementById("themeToggle").addEventListener("click", function() {
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("kia-theme", html.dataset.theme);
});
// Restore saved preference
(function() {
  var saved = localStorage.getItem("kia-theme");
  if (saved) html.dataset.theme = saved;
})();