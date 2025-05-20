const statusData = [];

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

    const template = document.getElementById('messageTemplate').value.trim() || 'Olá {{nome}}, seu pedido nº {{pedido}} está pronto para retirada.';

    lines.slice(1).forEach(line => {
      const [nome, telefone, pedido] = line.split(',').map(v => v.trim());
      
      // Validação básica
      if (!nome || !telefone || !pedido) {
        updateStatus(nome, telefone, pedido, 'erro', 'Dados incompletos');
        appendErrorItem(output, nome, telefone, pedido, 'Dados incompletos');
        return;
      }

      if (!/^\d{10,15}$/.test(telefone)) {
        updateStatus(nome, telefone, pedido, 'erro', 'Telefone inválido');
        appendErrorItem(output, nome, telefone, pedido, 'Telefone inválido');
        return;
      }

      const mensagem = template
        .replace(/{{nome}}/gi, nome)
        .replace(/{{telefone}}/gi, telefone)
        .replace(/{{pedido}}/gi, pedido);

      const encodedMsg = encodeURIComponent(mensagem);
      const link = `https://wa.me/${telefone}?text=${encodedMsg}`;

      const wrapper = document.createElement('div');
      wrapper.className = 'link-item link-pending';

      const icon = document.createElement('i');
      icon.className = 'fas fa-phone';

      const a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.textContent = `Enviar para ${nome} (${telefone})`;
      a.addEventListener('click', () => {
        wrapper.classList.remove('link-pending');
        wrapper.classList.add('link-sent');
        updateStatus(nome, telefone, pedido, 'enviado');
      });

      const copyBtn = document.createElement('button');
      copyBtn.textContent = '📋 Copiar';
      copyBtn.style.marginLeft = '1rem';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(mensagem);
        copyBtn.textContent = '✅ Copiado!';
        setTimeout(() => (copyBtn.textContent = '📋 Copiar'), 2000);
      });

      wrapper.appendChild(icon);
      wrapper.appendChild(a);
      wrapper.appendChild(copyBtn);
      output.appendChild(wrapper);

      updateStatus(nome, telefone, pedido, 'pendente');
    });
  };
  reader.readAsText(file);
});

function appendErrorItem(container, nome, telefone, pedido, motivo) {
  const wrapper = document.createElement('div');
  wrapper.className = 'link-item link-erro';

  const icon = document.createElement('i');
  icon.className = 'fas fa-exclamation-triangle';

  const text = document.createElement('span');
  text.textContent = `${nome || '[sem nome]'} (${telefone || '[sem telefone]'}): ${motivo}`;

  wrapper.appendChild(icon);
  wrapper.appendChild(text);

  container.appendChild(wrapper);
}

function updateStatus(nome, telefone, pedido, status, motivo = '') {
  const existing = statusData.find(x => x.nome === nome && x.telefone === telefone);
  if (existing) {
    existing.status = status;
    existing.motivo = motivo;
  } else {
    statusData.push({ nome, telefone, pedido, status, motivo });
  }
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
document.getElementById('exportEnviados').addEventListener('click', () => {
  exportToCSV(d => d.status === 'enviado', 'enviados.csv');
});
document.getElementById('exportErros').addEventListener('click', () => {
  exportToCSV(d => d.status === 'erro', 'erros.csv');
});
