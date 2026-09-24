// PORTAL DO CLIENTE — protótipo clicável (sem backend real)

function showToast(msg){
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i></i><span></span>';
    document.body.appendChild(toast);
  }
  toast.querySelector('span').textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

document.addEventListener('DOMContentLoaded', () => {
  // Login (maquete): qualquer CNPJ/senha "entra"
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'portal.html';
    });
  }

  // Primeiro acesso: definir senha
  const firstAccessForm = document.getElementById('first-access-form');
  if (firstAccessForm) {
    firstAccessForm.addEventListener('submit', (e) => {
      e.preventDefault();
      document.getElementById('first-access-form-wrap').hidden = true;
      document.getElementById('first-access-success').hidden = false;
    });
  }

  // Filtro de documentos por categoria
  const filterBtns = document.querySelectorAll('.filter-btn');
  const docRows = document.querySelectorAll('[data-category]');
  const dateGroups = document.querySelectorAll('.date-group');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.getAttribute('data-filter');
        docRows.forEach(row => {
          row.hidden = !(cat === 'todos' || row.getAttribute('data-category') === cat);
        });
        dateGroups.forEach(group => {
          const visible = [...group.querySelectorAll('[data-category]')].some(r => !r.hidden);
          group.hidden = !visible;
        });
      });
    });
  }

  // Admin: abas
  const tabBtns = document.querySelectorAll('.tab-btn');
  if (tabBtns.length) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        document.querySelectorAll('[data-tab-panel]').forEach(p => {
          p.hidden = p.getAttribute('data-tab-panel') !== btn.getAttribute('data-tab');
        });
      });
    });
  }

  // Admin: cadastrar cliente (maquete) — adiciona linha na tabela
  const addClientForm = document.getElementById('add-client-form');
  if (addClientForm) {
    addClientForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('novo-nome').value.trim();
      const cnpj = document.getElementById('novo-cnpj').value.trim();
      const email = document.getElementById('novo-email').value.trim();
      const empresa = document.getElementById('novo-empresa').value;
      if (!nome || !cnpj || !email) return;
      const tbody = document.getElementById('client-table-body');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${nome}</td>
        <td style="font-family:var(--font-mono)">${cnpj}</td>
        <td>${empresa}</td>
        <td><span class="status-pill pending"><i></i>Convite enviado</span></td>
        <td><button class="icon-btn" title="Reenviar convite">↻</button></td>
      `;
      tbody.prepend(tr);
      addClientForm.reset();
      showToast(`Convite enviado para ${email} — o cliente define a própria senha no primeiro acesso.`);
    });
  }

  // Admin: gestão de documentos (maquete) — adicionar, editar, excluir, filtrar
  const docTableBody = document.getElementById('doc-table-body');
  const uploadForm = document.getElementById('upload-doc-form');
  if (docTableBody && uploadForm) {
    const submitBtn = document.getElementById('upload-doc-submit');
    const cancelEditBtn = document.getElementById('cancel-edit-doc');
    const uploadTitle = document.getElementById('upload-doc-title');
    const filterSelect = document.getElementById('doc-filter-cliente');
    let editingId = null;

    function companyTagHtml(empresa){
      return empresa === 'Aclaris'
        ? '<span class="company-tag aclaris">Aclaris</span>'
        : '<span class="company-tag stella">Stella Resinas</span>';
    }
    function formatDateBR(iso){
      if (!iso) return '';
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    }
    function exitEditMode(){
      editingId = null;
      submitBtn.textContent = 'Enviar ao portal do cliente';
      uploadTitle.textContent = 'Enviar documento';
      cancelEditBtn.hidden = true;
      uploadForm.reset();
    }

    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cliente = document.getElementById('doc-cliente').value;
      const empresaLabel = document.getElementById('doc-empresa').value;
      const empresaClass = empresaLabel === 'Aclaris' ? 'aclaris' : 'stella';
      const categoria = document.getElementById('doc-categoria').value;
      const dataIso = document.getElementById('doc-data').value;
      const titulo = document.getElementById('doc-titulo').value.trim();
      const dataBR = formatDateBR(dataIso);
      if (!titulo) return;

      if (editingId) {
        const row = docTableBody.querySelector(`tr[data-doc-id="${editingId}"]`);
        if (row) {
          row.dataset.cliente = cliente;
          row.dataset.empresa = empresaClass;
          row.dataset.categoria = categoria;
          row.dataset.data = dataIso;
          row.dataset.titulo = titulo;
          row.children[0].textContent = titulo;
          row.children[1].textContent = cliente;
          row.children[2].innerHTML = companyTagHtml(empresaLabel);
          row.children[3].textContent = categoria;
          row.children[4].textContent = dataBR;
        }
        showToast('Documento atualizado.');
        exitEditMode();
      } else {
        const tr = document.createElement('tr');
        tr.dataset.docId = 'd' + Date.now();
        tr.dataset.cliente = cliente;
        tr.dataset.empresa = empresaClass;
        tr.dataset.categoria = categoria;
        tr.dataset.data = dataIso;
        tr.dataset.titulo = titulo;

        const tdTitulo = document.createElement('td'); tdTitulo.textContent = titulo;
        const tdCliente = document.createElement('td'); tdCliente.textContent = cliente;
        const tdEmpresa = document.createElement('td'); tdEmpresa.innerHTML = companyTagHtml(empresaLabel);
        const tdCategoria = document.createElement('td'); tdCategoria.textContent = categoria;
        const tdData = document.createElement('td'); tdData.style.fontFamily = 'var(--font-mono)'; tdData.textContent = dataBR;
        const tdActions = document.createElement('td'); tdActions.className = 'doc-actions';
        tdActions.innerHTML = '<button class="icon-btn" data-action="editar" title="Editar">✎</button><button class="icon-btn danger" data-action="excluir" title="Excluir">🗑</button>';

        tr.append(tdTitulo, tdCliente, tdEmpresa, tdCategoria, tdData, tdActions);
        docTableBody.prepend(tr);
        showToast('Documento adicionado ao portal do cliente selecionado.');
        uploadForm.reset();
      }
    });

    cancelEditBtn.addEventListener('click', exitEditMode);

    docTableBody.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      if (e.target.dataset.confirm === 'sim') {
        row.remove();
        showToast('Documento excluído do portal do cliente.');
        return;
      }
      if (e.target.dataset.confirm === 'nao') {
        const cell = row.querySelector('.doc-actions');
        cell.innerHTML = cell.dataset.original;
        return;
      }

      const btn = e.target.closest('.icon-btn');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'excluir') {
        const cell = row.querySelector('.doc-actions');
        cell.dataset.original = cell.innerHTML;
        cell.innerHTML = '<span class="confirm-inline">Excluir?<button type="button" class="link-btn" data-confirm="sim">Sim</button><button type="button" class="link-btn" data-confirm="nao">Cancelar</button></span>';
      } else if (action === 'editar') {
        editingId = row.dataset.docId;
        document.getElementById('doc-cliente').value = row.dataset.cliente;
        document.getElementById('doc-empresa').value = row.dataset.empresa === 'aclaris' ? 'Aclaris' : 'Stella Resinas';
        document.getElementById('doc-categoria').value = row.dataset.categoria;
        document.getElementById('doc-data').value = row.dataset.data;
        document.getElementById('doc-titulo').value = row.dataset.titulo;
        submitBtn.textContent = 'Salvar alterações';
        uploadTitle.textContent = 'Editar documento';
        cancelEditBtn.hidden = false;
        uploadForm.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    });

    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        const val = filterSelect.value;
        docTableBody.querySelectorAll('tr').forEach(row => {
          row.hidden = val !== 'todos' && row.dataset.cliente !== val;
        });
      });
    }
  }

  // Reenviar convite (maquete)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.icon-btn[title="Reenviar convite"]')) {
      showToast('Convite reenviado por e-mail.');
    }
  });
});
