(() => {
  const list = document.querySelector('#product-list');
  const empty = document.querySelector('#empty-state');
  const search = document.querySelector('#search');
  const categoryFilter = document.querySelector('#category-filter');
  const backdrop = document.querySelector('#modal-backdrop');
  const form = document.querySelector('#product-form');
  const errorBox = document.querySelector('#form-error');
  const submitButton = document.querySelector('#submit-button');
  const toast = document.querySelector('#toast');
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  let products = [];
  let toastTimer;
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const number = value => Number(String(value ?? 0).replace(',', '.')) || 0;
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const unit = product => product.unidade_medida || 'un';
  const productIcon = product => ({ kg: '◉', g: '◉', L: '◒', ml: '◒', cx: '▣', pct: '▤', m: '↔' }[unit(product)] || '◇');

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function render() {
    const query = normalize(search.value.trim());
    const category = categoryFilter.value;
    const visible = products.filter(product => {
      const matchesSearch = normalize(product.nome).includes(query) || normalize(product.categoria).includes(query);
      return matchesSearch && (!category || String(product.categoria || '') === category);
    });
    list.innerHTML = visible.map(product => {
      const quantity = number(product.quantidade);
      const total = number(product.valor) * quantity;
      const categoryName = product.categoria ? safe(product.categoria) : 'Sem categoria';
      return `<tr><td><div class="product-cell"><span class="product-thumb">${productIcon(product)}</span><span><strong>${safe(product.nome)}</strong><small>${safe(unit(product))}</small></span></div></td><td><span class="category-tag">${categoryName}</span></td><td>${money.format(number(product.valor))}</td><td><span class="quantity ${quantity <= 5 ? 'low' : ''}">${quantity} ${safe(unit(product))}</span></td><td><span class="total-cell">${money.format(total)}</span></td></tr>`;
    }).join('');
    empty.classList.toggle('show', visible.length === 0);
    document.querySelector('#empty-title').textContent = products.length === 0 ? 'Sua prateleira começa aqui' : 'Nenhum produto encontrado';
    document.querySelector('#empty-message').textContent = products.length === 0 ? 'Cadastre seu primeiro produto para acompanhar seu estoque.' : 'Tente mudar a busca ou o filtro de categoria.';
    document.querySelector('#empty-add').style.display = products.length === 0 ? '' : 'none';
    document.querySelector('#product-count').textContent = products.length;
    document.querySelector('#results-caption').textContent = `Mostrando ${visible.length} ${visible.length === 1 ? 'produto' : 'produtos'}`;
    document.querySelector('#total-products').textContent = products.length;
    document.querySelector('#total-units').textContent = new Intl.NumberFormat('pt-BR').format(products.reduce((sum, product) => sum + number(product.quantidade), 0));
    document.querySelector('#stock-value').textContent = money.format(products.reduce((sum, product) => sum + number(product.valor) * number(product.quantidade), 0));
  }

  function updateCategories() {
    const selected = categoryFilter.value;
    const categories = [...new Set(products.map(product => String(product.categoria || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>' + categories.map(category => `<option value="${safe(category)}">${safe(category)}</option>`).join('');
    categoryFilter.value = categories.includes(selected) ? selected : '';
  }

  async function loadProducts() {
    list.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9a9f9a;height:90px">Carregando produtos...</td></tr>';
    empty.classList.remove('show');
    try {
      const response = await fetch('/produtos', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`A API respondeu com erro ${response.status}.`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('A resposta da API não está no formato esperado.');
      products = data;
      updateCategories();
      render();
    } catch (error) {
      list.innerHTML = '';
      empty.classList.add('show');
      document.querySelector('#empty-title').textContent = 'Não foi possível carregar os produtos';
      document.querySelector('#empty-message').textContent = `${error.message} Confira a conexão com o servidor e tente atualizar.`;
      document.querySelector('#empty-add').style.display = 'none';
      document.querySelector('#results-caption').textContent = 'Falha ao carregar';
      document.querySelector('#total-products').textContent = '—';
      document.querySelector('#total-units').textContent = '—';
      document.querySelector('#stock-value').textContent = '—';
    }
  }

  function openModal() {
    errorBox.textContent = '';
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => form.elements.nome.focus(), 60);
  }
  function closeModal() {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  ['#open-modal', '#open-modal-mobile', '#empty-add'].forEach(selector => document.querySelector(selector).addEventListener('click', openModal));
  ['#close-modal', '#cancel-modal'].forEach(selector => document.querySelector(selector).addEventListener('click', closeModal));
  backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && backdrop.classList.contains('open')) closeModal(); });
  search.addEventListener('input', render);
  categoryFilter.addEventListener('change', render);
  document.querySelector('#refresh').addEventListener('click', loadProducts);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    errorBox.textContent = '';
    const values = new FormData(form);
    const payload = {
      nome: values.get('nome').trim(),
      valor: Number(values.get('valor')),
      quantidade: Number(values.get('quantidade')),
      categoria: values.get('categoria').trim() || null,
      unidade_medida: values.get('unidade_medida')
    };
    if (!payload.nome || !Number.isFinite(payload.valor) || payload.valor < 0 || !Number.isInteger(payload.quantidade) || payload.quantidade < 0 || !payload.unidade_medida) {
      errorBox.textContent = 'Confira o nome, o preço, a quantidade inteira e a unidade de medida.';
      return;
    }
    submitButton.disabled = true;
    submitButton.innerHTML = 'Salvando...';
    try {
      const response = await fetch('/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.details || `A API respondeu com erro ${response.status}.`);
      closeModal();
      form.reset();
      await loadProducts();
      showToast('Produto adicionado ao estoque.');
    } catch (error) {
      errorBox.textContent = `Não foi possível salvar: ${error.message}`;
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Salvar produto <span>→</span>';
    }
  });

  document.querySelector('#today').textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date());
  loadProducts();
})();
