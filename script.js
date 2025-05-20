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
      if (!telefone || !pedido) return;

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

function updateStatus(nome, telefone, pedido, status) {
  const existing = statusData.find(x => x.nome === nome && x.telefone === telefone);
  if (existing) {
    existing.status = status;
  } else {
    statusData.push({ nome, telefone, pedido, status });
  }
}

document.getElementById('exportStatus').addEventListener('click', () => {
  if (statusData.length === 0) return alert('Nenhum dado disponível.');

  const csv = [
    ['nome', 'telefone', 'pedido', 'status'],
    ...statusData.map(d => [d.nome, d.telefone, d.pedido, d.status])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'status_envio.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
