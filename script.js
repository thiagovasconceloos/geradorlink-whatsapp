const statusData = [];
let countEnviados = 0;
let countPendentes = 0;
let countErros = 0;

const csvInput = document.getElementById('csvFile');
const output = document.getElementById('output');

csvInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const lines = text.trim().split('\n');
    const template = document.getElementById('messageTemplate').value.trim() || 'Olá {{nome}}, seu pedido nº {{pedido}} está pronto.';

    output.innerHTML = '';
    statusData.length = 0;
    resetCounters();

    // Remove cabeçalho e linhas vazias
    const dataLines = lines.slice(1).filter(line => line.trim());

    dataLines.forEach(line => {
      const [nome, telefone, pedido] = line.split(',').map(x => x.trim());
      const validTel = /^[0-9]{10,15}$/.test(telefone);

      let status = '', motivo = '', mensagem = '', link = '';

      if (!nome || !telefone || !pedido) {
        status = 'erro';
        motivo = 'Dados incompletos';
      } else if (!validTel) {
        status = 'erro';
        motivo = 'Telefone inválido';
      } else {
        status = 'pendente';
        mensagem = template.replace(/{{nome}}/gi, nome).replace(/{{pedido}}/gi, pedido).replace(/{{telefone}}/gi, telefone);
        link = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
      }

      updateStatus(nome, telefone, pedido, status, motivo);
      renderItem(nome, telefone, pedido, mensagem, link, status, motivo);
    });

    updateVisualCounters();
  };
  reader.readAsText(file);
});

function updateStatus(nome, telefone, pedido, status, motivo = '') {
  statusData.push({ nome, telefone, pedido, status, motivo });

  if (status === 'erro') countErros++;
  else if (status === 'pendente') countPendentes++;
  else if (status === 'enviado') countEnviados++;
}

function renderItem(nome, telefone, pedido, mensagem, link, status, motivo = '') {
  const container = document.createElement('div');
  container.className = `link-item link-${status}`;

  const info = document.createElement('span');
  info.innerHTML = `<strong>${nome}</strong> (${telefone})`;

  const statusText = document.createElement('span');
  statusText.className = 'status-text';
  statusText.textContent = status === 'erro' ? `❌ Erro: ${motivo}` : status === 'pendente' ? '🕒 Pendente' : '✅ Enviado';

  container.append(info, statusText);

  if (status === 'pendente') {
    const openBtn = document.createElement('a');
    openBtn.href = link;
    openBtn.target = '_blank';
    openBtn.textContent = 'Abrir link';

    openBtn.addEventListener('click', () => {
      const found = statusData.find(d => d.telefone === telefone && d.pedido === pedido);
      if (found && found.status !== 'enviado') {
        found.status = 'enviado';
        countEnviados++;
        countPendentes--;
        updateVisualCounters();

        container.classList.remove('link-pendente');
        container.classList.add('link-enviado');
        statusText.textContent = '✅ Enviado';
      }
    });

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copiar';
    copyBtn.className = 'copy-btn';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(mensagem);
      copyBtn.textContent = '✅ Copiado';
      setTimeout(() => copyBtn.textContent = '📋 Copiar', 2000);
    });

    container.append(copyBtn, openBtn);
  }

  output.appendChild(container);
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

document.getElementById('exportStatus').addEventListener('click', () => {
  const csv = [
    ['nome', 'telefone', 'pedido', 'status', 'motivo'],
    ...statusData.map(d => [d.nome, d.telefone, d.pedido, d.status, d.motivo])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'status_mensagens.csv';
  link.click();
});
