/**
 * Front-end do mini-site (completo e comentado)
 * - Suporte a múltiplos cargos por serviço (chips/pílulas)
 * - Validações:
 *    • Nome, E-mail, Chave de acesso
 *    • Pelo menos 1 serviço selecionado
 *    • Para cada serviço marcado, pelo menos 1 cargo marcado
 * - Envio para Apps Script como text/plain (evita preflight/CORS)
 */

/* ========== Helper DOM ========== */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.append(c));
  return node;
}

/* ========== Carregar catálogo (services.json) ========== */
async function loadServices() {
  const res = await fetch('./services.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Não foi possível carregar o catálogo de serviços (services.json).');
  return res.json();
}

/* ========== Card de serviço com múltiplos cargos (chips) ========== */
function createServiceCard(svc) {
  // Checkbox master do serviço
  const serviceCB = el('input', { type: 'checkbox', 'aria-label': `Selecionar ${svc.servico}` });

  // 3 checkboxes de cargo (ocultos visualmente; estilizados via .cargoOption)
  const cbJunior = el('input', { type: 'checkbox', disabled: true });
  const cbPleno  = el('input', { type: 'checkbox', disabled: true });
  const cbSenior = el('input', { type: 'checkbox', disabled: true });

  // Habilita/desabilita cargos quando o serviço é marcado
  serviceCB.addEventListener('change', () => {
    const on = serviceCB.checked;
    [cbJunior, cbPleno, cbSenior].forEach(cb => {
      cb.disabled = !on;
      if (!on) cb.checked = false; // limpamos ao desmarcar o serviço
    });
  });

  // Grupo de cargos (em coluna)
  const cargosGroup = el('div', { class: 'row cargo-group' },
    // Cada cargo é um <label> que envolve o <input> oculto + <span> com o texto
    el('label', { class: 'cargoOption' },
      cbJunior,
      el('span', {}, `Júnior — R$ ${svc.junior ?? 0}`)
    ),
    el('label', { class: 'cargoOption' },
      cbPleno,
      el('span', {}, `Pleno — R$ ${svc.pleno ?? 0}`)
    ),
    el('label', { class: 'cargoOption' },
      cbSenior,
      el('span', {}, `Sênior — R$ ${svc.senior ?? 0}`)
    )
  );

  // Card visual do serviço
  const card = el('div', { class: 'servico' },
    el('div', { class: 'row' },
      serviceCB,
      el('h3', {}, svc.servico),
      el('span', { class: 'badge' }, `${svc.horas} h`)
    ),
    el('div', { class: 'desc' }, svc.descricao || ''),
    cargosGroup
  );

  // Guardamos referências úteis
  card._meta = { svc, serviceCB, cbJunior, cbPleno, cbSenior, cargosGroup };
  return card;
}

/* ========== Inicialização ========== */
async function init() {
  const container = document.getElementById('servicos');
  const status = document.getElementById('status');

  try {
    const services = await loadServices();
    services.forEach(s => container.appendChild(createServiceCard(s)));
  } catch (err) {
    status.textContent = err.message || 'Erro ao carregar serviços.';
    return;
  }

  document.getElementById('btnEnviar').addEventListener('click', onSubmit);
}

/* ========== Envio (validações + POST) ========== */
async function onSubmit() {
  const status = document.getElementById('status');
  status.textContent = 'Enviando...';

  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const empresa = document.getElementById('empresa').value.trim();
  const accessKey = document.getElementById('accessKey').value.trim();

  if (!nome)      { status.textContent = 'Informe seu nome.'; return; }
  if (!email)     { status.textContent = 'Informe seu e‑mail.'; return; }
  if (!accessKey) { status.textContent = 'Informe a chave de acesso.'; return; }

  const cards = Array.from(document.querySelectorAll('.servico'));
  const itens = [];
  let erroMsg = null;

  cards.forEach(card => {
    const { svc, serviceCB, cbJunior, cbPleno, cbSenior } = card._meta;

    // remover destaque de erro, se houver
    card.style.outline = '';

    if (serviceCB.checked) {
      const cargosSelecionados = [];
      if (cbJunior.checked) cargosSelecionados.push('Junior');
      if (cbPleno.checked)  cargosSelecionados.push('Pleno');
      if (cbSenior.checked) cargosSelecionados.push('Senior');

      if (cargosSelecionados.length === 0) {
        erroMsg = `Selecione pelo menos um cargo para o serviço: "${svc.servico}".`;
        card.style.outline = '2px solid #ef4444'; // realce visual
      } else {
        cargosSelecionados.forEach(cargo => {
          itens.push({
            servico: svc.servico,
            cargo,
            horas: svc.horas,
            valor: cargo === 'Junior' ? svc.junior
                 : cargo === 'Pleno'  ? svc.pleno
                 : cargo === 'Senior' ? svc.senior : 0,
            descricao: svc.descricao
          });
        });
      }
    }
  });

  if (!itens.length && !erroMsg) {
    status.textContent = 'Selecione pelo menos um serviço e ao menos um cargo.';
    return;
  }
  if (erroMsg) {
    status.textContent = erroMsg;
    return;
  }

  const payload = { accessKey, nome, email, empresa, itens };

  try {
    // Enviamos como text/plain (simple request) para evitar preflight/CORS
    const resp = await fetch(window.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));

    if (resp.status === 401) {
      status.textContent = 'Chave de acesso inválida. Verifique e tente novamente.';
      return;
    }
    if (!resp.ok || data.status !== 'OK') {
      status.textContent = `Falha ao enviar: ${data.message || `Erro HTTP ${resp.status}`}`;
      return;
    }

    status.textContent = 'Enviado com sucesso! Você receberá um e‑mail com o resumo.';

  } catch (err) {
    status.textContent = 'Falha de rede. Verifique sua conexão e tente novamente.';
  }
}

// Inicializa
init().catch(err => {
  const status = document.getElementById('status');
  status.textContent = 'Erro ao iniciar: ' + (err?.message || String(err));
});
