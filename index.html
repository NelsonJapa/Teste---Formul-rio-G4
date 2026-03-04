/**
 * Front-end do mini-site (completo e comentado)
 * Suporte a múltiplos cargos por serviço.
 * 
 * Responsabilidades:
 *  - Carregar a lista de serviços (services.json)
 *  - Gerar "cards" de serviços:
 *      • checkbox principal (selecionar serviço)
 *      • badge de horas
 *      • descrição
 *      • checkboxes de cargo (Júnior/Pleno/Sênior) com valores informativos
 *  - Validar:
 *      • Nome, E-mail, Chave de acesso
 *      • Pelo menos 1 serviço selecionado
 *      • Para cada serviço marcado, pelo menos 1 cargo marcado
 *  - Montar o payload:
 *      • Um item por (serviço, cargo) selecionado
 *  - Enviar para a API (Apps Script) usando Content-Type text/plain (evita preflight/CORS)
 *  - Exibir feedback (status) ao usuário
 */

/* ========== Utilitário simples para criar elementos DOM ========== */
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

/* ========== Carregamento do catálogo de serviços (JSON) ========== */
async function loadServices() {
  const res = await fetch('./services.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Não foi possível carregar o catálogo de serviços (services.json).');
  return res.json();
}

/* ========== Criação do card de serviço (com múltiplos cargos) ========== */
function createServiceCard(svc) {
  // Checkbox mestre (liga/desliga o serviço)
  const serviceCB = el('input', { type: 'checkbox', 'aria-label': `Selecionar ${svc.servico}` });

  // 3 checkboxes de cargo (o cliente pode marcar mais de um)
  const cbJunior = el('input', { type: 'checkbox', disabled: true });
  const cbPleno  = el('input', { type: 'checkbox', disabled: true });
  const cbSenior = el('input', { type: 'checkbox', disabled: true });

  // Habilita/desabilita os cargos quando o serviço é marcado/desmarcado
  serviceCB.addEventListener('change', () => {
    const on = serviceCB.checked;
    [cbJunior, cbPleno, cbSenior].forEach(cb => {
      cb.disabled = !on;
      if (!on) cb.checked = false; // limpamos se desmarcar o serviço
    });
  });

  // Grupo visual dos cargos
  const cargosGroup = el('div', { class: 'row cargo-group' },
    // Júnior
    el('label', { class: 'cargoOption' },
      cbJunior,
      el('span', {}, `Júnior — R$ ${svc.junior ?? 0}`)
    ),
    // Pleno
    el('label', { class: 'cargoOption' },
      cbPleno,
      el('span', {}, `Pleno — R$ ${svc.pleno ?? 0}`)
    ),
    // Sênior
    el('label', { class: 'cargoOption' },
      cbSenior,
      el('span', {}, `Sênior — R$ ${svc.senior ?? 0}`)
    )
  );

  // Monta o card visual
  const card = el('div', { class: 'servico' },
    el('div', { class: 'row' },
      serviceCB,
      el('h3', {}, svc.servico),
      el('span', { class: 'badge' }, `${svc.horas} h`)
    ),
    el('div', { class: 'desc' }, svc.descricao || ''),
    cargosGroup
  );

  // Guardar refs úteis para leitura no envio
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

/* ========== Envio (validação + POST) ========== */
async function onSubmit() {
  const status = document.getElementById('status');
  status.textContent = 'Enviando...';

  // Campos básicos
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const empresa = document.getElementById('empresa').value.trim();
  const accessKey = document.getElementById('accessKey').value.trim();

  // Validações simples do cabeçalho
  if (!nome)      { status.textContent = 'Informe seu nome.'; return; }
  if (!email)     { status.textContent = 'Informe seu e‑mail.'; return; }
  if (!accessKey) { status.textContent = 'Informe a chave de acesso.'; return; }

  // Coleta dos serviços marcados e exige pelo menos 1 cargo por serviço
  const cards = Array.from(document.querySelectorAll('.servico'));
  const itens = [];
  let erroMsg = null;

  cards.forEach(card => {
    const { svc, serviceCB, cbJunior, cbPleno, cbSenior, cargosGroup } = card._meta;

    // limpar destaque de erro, se houver
    card.style.outline = '';

    if (serviceCB.checked) {
      const cargosSelecionados = [];
      if (cbJunior.checked) cargosSelecionados.push('Junior');
      if (cbPleno.checked)  cargosSelecionados.push('Pleno');
      if (cbSenior.checked) cargosSelecionados.push('Senior');

      if (cargosSelecionados.length === 0) {
        // se o serviço foi marcado mas nenhum cargo foi escolhido, erro
        erroMsg = `Selecione pelo menos um cargo para o serviço: "${svc.servico}".`;
        card.style.outline = '2px solid #ef4444'; // realce visual opcional
      } else {
        // para cada cargo marcado, criamos UM item (linha) no payload
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

  // Pelo menos um serviço?
  if (!itens.length && !erroMsg) {
    status.textContent = 'Selecione pelo menos um serviço e cargo.';
    return;
  }
  if (erroMsg) {
    status.textContent = erroMsg;
    return;
  }

  // Monta payload para o backend
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
      const msg = data.message || `Erro HTTP ${resp.status}`;
      status.textContent = `Falha ao enviar: ${msg}`;
      return;
    }

    status.textContent = 'Enviado com sucesso! Você receberá um e‑mail com o resumo.';

  } catch (err) {
    status.textContent = 'Falha de rede. Verifique sua conexão e tente novamente.';
  }
}

// Inicializa a página
init().catch(err => {
  const status = document.getElementById('status');
  status.textContent = 'Erro ao iniciar: ' + (err?.message || String(err));
});
