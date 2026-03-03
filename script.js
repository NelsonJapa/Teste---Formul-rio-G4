/**
 * Front-end do mini-site (completo e comentado)
 * 
 * Responsabilidades:
 *  - Carregar a lista de serviços (services.json)
 *  - Gerar os "cards" de serviços (checkbox + horas + descrição + select de cargo)
 *  - Validar campos básicos (nome, e-mail, chave e pelo menos 1 serviço)
 *  - Montar o payload do POST (inclui accessKey)
 *  - Enviar para a API (Apps Script) e exibir status para o usuário
 * 
 * Observações:
 *  - NÃO armazenamos a chave no código; o cliente DIGITA no input.
 *  - A API valida a chave via array API_KEYS no Apps Script (servidor).
 */

/* ========== Utilitários DOM ========== */

/**
 * Cria elemento DOM de forma simples (tag, atributos, filhos).
 */
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

/* ========== Carregamento de serviços (JSON) ========== */

/**
 * Busca o catálogo de serviços.
 * - O arquivo services.json deve estar na raiz do repositório/publicação.
 */
async function loadServices() {
  const res = await fetch('./services.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Não foi possível carregar o catálogo de serviços (services.json).');
  }
  return res.json();
}

/* ========== Geração dos cards de serviço ========== */

/**
 * Cria um "card" de serviço com:
 *  - checkbox (selecionar/desmarcar)
 *  - badge de horas
 *  - descrição (texto)
 *  - select de cargo (Júnior/Pleno/Sênior) com valores informativos
 */
function createServiceCard(svc) {
  // Checkbox que liga/desliga o card (habilita selecionar cargo)
  const checkbox = el('input', { type: 'checkbox', 'aria-label': `Selecionar ${svc.servico}` });

  // Select de cargo com valores informativos por opção
  const cargoSel = el('select', { class: 'cargo', disabled: true },
    el('option', { value: '' }, 'Selecione o cargo'),
    el('option', { value: 'Junior' }, `Júnior — R$ ${svc.junior ?? 0}`),
    el('option', { value: 'Pleno' },  `Pleno — R$ ${svc.pleno ?? 0}`),
    el('option', { value: 'Senior' }, `Sênior — R$ ${svc.senior ?? 0}`)
  );

  // Ao marcar o serviço, habilita a escolha de cargo
  checkbox.addEventListener('change', () => {
    cargoSel.disabled = !checkbox.checked;
  });

  // Monta a estrutura visual do card
  const card = el('div', { class: 'servico' },
    el('div', { class: 'row' },
      checkbox,
      el('h3', {}, svc.servico),
      el('span', { class: 'badge' }, `${svc.horas} h`)
    ),
    el('div', { class: 'desc' }, svc.descricao || ''),
    el('div', { class: 'row' },
      el('label', {}, 'Cargo', cargoSel)
    )
  );

  // Guardamos referências úteis no próprio elemento para leitura posterior
  card._meta = { svc, checkbox, cargoSel };
  return card;
}

/* ========== Inicialização da página ========== */

async function init() {
  const container = document.getElementById('servicos');
  const status = document.getElementById('status');

  try {
    // 1) Carrega o catálogo e desenha os cards
    const services = await loadServices();
    services.forEach(s => container.appendChild(createServiceCard(s)));
  } catch (err) {
    status.textContent = err.message || 'Erro ao carregar serviços.';
    return; // Interrompe inicialização em caso de falha de catálogo
  }

  // 2) Envio do formulário
  document.getElementById('btnEnviar').addEventListener('click', onSubmit);
}

/* ========== Validação dos campos e submissão ========== */

/**
 * Lida com o clique em "Enviar solicitação":
 *  - Valida Nome/E-mail/Chave
 *  - Coleta os serviços marcados e cargos
 *  - Dispara POST para a API
 *  - Mostra feedback de sucesso/erro
 */
async function onSubmit() {
  const status = document.getElementById('status');
  status.textContent = 'Enviando...';

  // Campos básicos
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const empresa = document.getElementById('empresa').value.trim();
  const accessKey = document.getElementById('accessKey').value.trim();

  // Validações simples no front (o backend também valida)
  if (!nome)  { status.textContent = 'Informe seu nome.'; return; }
  if (!email) { status.textContent = 'Informe seu e‑mail.'; return; }
  if (!accessKey) { status.textContent = 'Informe a chave de acesso.'; return; }

  // Coleta itens selecionados
  const cards = Array.from(document.querySelectorAll('.servico'));
  const itens = [];
  cards.forEach(c => {
    const { svc, checkbox, cargoSel } = c._meta;
    if (checkbox.checked) {
      itens.push({
        servico: svc.servico,
        cargo: cargoSel.value || '',
        horas: svc.horas,
        valor: cargoSel.value === 'Junior' ? svc.junior
             : cargoSel.value === 'Pleno'  ? svc.pleno
             : cargoSel.value === 'Senior' ? svc.senior : 0,
        descricao: svc.descricao
      });
    }
  });

  if (itens.length === 0) {
    status.textContent = 'Selecione pelo menos um serviço.';
    return;
  }

  // Monta o payload para a API
  const payload = {
    accessKey,  // ✅ chave que será validada no Apps Script
    nome, email, empresa,
    itens
  };

  try {
    // Envio via fetch para a URL do Apps Script configurada em index.html
    const resp = await fetch(window.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Tentamos ler JSON de retorno (status: OK/ERR)
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || data.status !== 'OK') {
      // Mensagem de erro do servidor, se disponível
      const msg = data.message || `Erro HTTP ${resp.status}`;
      status.textContent = `Falha ao enviar: ${msg}`;
      return;
    }

    // Sucesso!
    status.textContent = 'Enviado com sucesso! Você receberá um e‑mail com o resumo.';
    // Opcional: limpar seleções após enviar
    // document.getElementById('nome').value = '';
    // document.getElementById('email').value = '';
    // document.getElementById('empresa').value = '';
    // document.getElementById('accessKey').value = '';
    // document.querySelectorAll('.servico input[type="checkbox"]').forEach(cb => cb.checked = false);
    // document.querySelectorAll('.servico select.cargo').forEach(sel => { sel.selectedIndex = 0; sel.disabled = true; });

  } catch (err) {
    status.textContent = 'Falha de rede. Verifique sua conexão e tente novamente.';
  }
}

// Inicializa a página
init().catch(err => {
  const status = document.getElementById('status');
  status.textContent = 'Erro ao iniciar: ' + (err?.message || String(err));
});
