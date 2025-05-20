const statusData = [];
let countEnviados = 0;
let countPendentes = 0;
let countErros = 0;

document.getElementById('csvFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.trim().split('\n');
    const output = document.getElementById('output');
    output.innerHTML = '';
    statusData.length = 0;
    resetCounters();

    const template = document.getElementById('messageTemplate').value.trim() || 'Olá {{nome}}, seu pedido nº {{pedido}} está pronto.';

    lines.slice(1).forEach(line => {
      const [nome, telefone, pedido] = line.split(',').map(v => v.trim());
      let status = '';
      let motivo = '';

      if (!nome || !telefone || !pedido) {
        status = 'erro';
        motivo = 'Dados incompletos';
      } else if (!/^[0-9]{10,15}$/.test(telefone)) {
        status = 'erro';
        motivo = 'Telefone inválido';
      } else {
        status = 'pendente';
      }

      const mensagem = template
        .replace(/{{nome}}/gi, nome)
        .replace(/{{telefone}}/gi, telefone)
        .replace(/{{pedido}}/gi, pedido);

      const encodedMsg = encodeURIComponent(mensagem);
      const link = `https://wa.me/${telefone}?text=${encodedMsg}`;

      updateStatus(nome, telefone, pedido, status, motivo);
      renderItem(nome, telefone, pedido, mensagem, link, status, motivo);
    });

    updateVisualCounters();
  };

  reader.readAsText(file);
});

function renderItem(nome, telefone, pedido, mensagem, link, status, motivo = '') {
  const wrapper = document.createElement('div');
  wrapper.className = `link-item link-${status}`;

  const icon = document.createElement('i');
  icon.className = {
    enviado: 'fas fa-check-circle',
    pendente: 'fas fa-clock',
    erro: 'fas fa-exclamation-triangle'
  }[status];

  const label = document.createElement('span');
  label.textContent = `${nome} (${telefone})`;

  const statusText = document.createElement('span');
  statusText.className = 'status-text';
  statusText.textContent = {
    enviado: '✅ Enviado',
    pendente: '🕒 Pendente',
    erro: `⚠️ Erro: ${motivo}`
  }[status];

  const copyBtn = document.createElement('button');
  copyBtn.textContent = '📋 Copiar';
  copyBtn.className = 'copy-btn';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(mensagem);
    copyBtn.textContent = '✅ Copiado!';
    setTimeout(() => (copyBtn.textContent = '📋 Copiar'), 2000);
  });

  if (status !== 'erro') {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.textContent = 'Abrir link';
    a.addEventListener('click', () => {
      if (wrapper.classList.contains('link-pendente')) {
        wrapper.classList.remove('link-pendente');
        wrapper.classList.add('link-enviado');
        updateStatus(nome, telefone, pedido, 'enviado');
        countPendentes--;
        countEnviados++;
        updateVisualCounters();
        updateStatusLabel(wrapper, 'enviado');
      }
    });
    wrapper.append(icon, label, statusText, copyBtn, a);
  } else {
    wrapper.append(icon, label, statusText);
  }

  document.getElementById('output').appendChild(wrapper);
}

function updateStatusLabel(wrapper, newStatus) {
  const statusSpan = wrapper.querySelector('.status-text');
  statusSpan.textContent = {
    enviado: '✅ Enviado',
    pendente: '🕒 Pendente',
    erro: '⚠️ Erro'
  }[newStatus];
}

function updateStatus(nome, telefone, pedido, status, motivo = '') {
  const existing = statusData.find(x => x.nome === nome && x.telefone === telefone);
  if (existing) {
    existing.status = status;
    existing.motivo = motivo;
  } else {
    statusData.push({ nome, telefone, pedido, status, motivo });
  }

  if (status === 'erro') countErros++;
  else if (status === 'pendente') countPendentes++;
  else if (status === 'enviado') countEnviados++;
}

function resetCounters() {
  countEnviados = 0;
  countPendentes = 0;
  countErros = 0;
  updateVisualCounters();
}

function updateVisualCounters() {
  document.getElementById('count-enviados').textContent = countEnviados;
  document.getElementById('count-pendentes').textContent = countPendentes;
  document.getElementById('count-erros').textContent = countErros;
}

function exportToCSV(filterFn, filename) {
  const filtered = statusData.filter(filterFn);
  if (filtered.length === 0) {
    alert('Nenhum dado correspondente.');
    return;
  }

  const csv = [
    ['nome', 'telefone', 'pedido', 'status', 'motivo'],
    ...filtered.map(d => [d.nome, d.telefone, d.pedido, d.status, d.motivo])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.getElementById('exportStatus').addEventListener('click', () => {
  exportToCSV(() => true, 'todos_status.csv');
});
