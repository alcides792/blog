/**
 * Vercel Serverless Function: api/deezer.js
 * Atua como um proxy para a API da Deezer, resolvendo problemas de CORS.
 */
export default async function handler(req, res) {
  // Configuração de CORS - Permite que qualquer origem aceda (ajustar em produção)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Lidar com o preflight request do browser
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Obter o endpoint ou URL completo da query string
  // Se não for passado nada, assume o /chart por defeito
  const { url } = req.query;
  const targetPath = url ? decodeURIComponent(url) : 'https://api.deezer.com/chart';

  // Garantir que estamos a chamar apenas a Deezer por segurança
  let finalUrl = targetPath;
  if (!targetPath.startsWith('http')) {
    finalUrl = `https://api.deezer.com/${targetPath}`;
  } else if (!targetPath.startsWith('https://api.deezer.com/')) {
    return res.status(403).json({ error: 'Apenas URLs da api.deezer.com são permitidas.' });
  }

  try {
    const response = await fetch(finalUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro na resposta da Deezer' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('SERVER SIDE ERROR:', error);
    return res.status(500).json({ error: 'Erro ao processar o pedido no servidor.' });
  }
}
