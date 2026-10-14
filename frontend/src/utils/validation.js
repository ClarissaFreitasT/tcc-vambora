export function validateRoteiro(form) {
  const errors = {}
  if (!form.titulo?.trim()) errors.titulo = 'Informe um título para o roteiro.'
  else if (form.titulo.trim().length < 3) errors.titulo = 'Use pelo menos 3 caracteres no título.'
  if (!form.destino?.trim()) errors.destino = 'Informe o destino da viagem.'
  if (form.orcamento !== '' && (Number.isNaN(Number(form.orcamento)) || Number(form.orcamento) < 0)) errors.orcamento = 'O orçamento deve ser um valor maior ou igual a zero.'
  return errors
}

export function validateItem(form) {
  const errors = {}
  if (!form.titulo?.trim()) errors.titulo = 'Informe o nome da atividade.'
  if (form.custoEstimado !== '' && (Number.isNaN(Number(form.custoEstimado)) || Number(form.custoEstimado) < 0)) errors.custoEstimado = 'O custo deve ser maior ou igual a zero.'
  return errors
}