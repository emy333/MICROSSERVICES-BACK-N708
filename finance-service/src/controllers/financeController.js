const { Op } = require("sequelize");
const axios = require('axios');

const USUARIO_SERVICE_URL = process.env.USUARIO_SERVICE_URL || 'http://localhost:3000/usuarios';
const CREDOR_SERVICE_URL = process.env.CREDOR_SERVICE_URL || 'http://localhost:3000/credores';
const SAIDAS_SERVICE_URL = process.env.SAIDAS_SERVICE_URL || 'http://localhost:3000/saidas';
const ENTRADAS_SERVICE_URL = process.env.ENTRADAS_SERVICE_URL || 'http://localhost:3000/entradas';

//TOTAL SAIDAS
const getTotalSaidas = async (req, res) => {
    const { periodo, id } = req.params;
    const token = req.headers.authorization;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    try {
        const response = await axios.get(`${SAIDAS_SERVICE_URL}/${id}`, {
            headers: {
                Authorization: token,
            }
        });

        const saidas = response.data || [];

        const [mes, ano] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        const saidasFiltradas = saidas.filter(s => {
            const data = new Date(s.data_vencimento);
            return data >= inicioMes && data <= fimMes;
        });

        const totalSaidas = saidasFiltradas.reduce((total, s) => {
            return total + parseFloat(s.valor);
        }, 0);

        return res.status(200).json({ totalSaidas });

    } catch (error) {
        console.error("Erro ao consultar total de saídas:", error?.response?.data || error.message);
        return res.status(500).json({ msg: "Erro ao consultar total de saídas.", error: error.message });
    }
};

//TOTAL DE ENTRADAS
const getTotalEntradas = async (req, res) => {
    const { periodo, id } = req.params;
    const token = req.headers.authorization;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    try {
        const response = await axios.get(`${ENTRADAS_SERVICE_URL}/entradasUsu/${id}`, {
            headers: {
                Authorization: token,
            }
        });

        const entradas = response.data.result || [];

        const [mes, ano] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        const entradasFiltradas = entradas.filter(e => {
            const data = new Date(e.data_referente);
            return data >= inicioMes && data <= fimMes;
        });

        const totalEntradas = entradasFiltradas.reduce((total, e) => {
            return total + parseFloat(e.valor);
        }, 0);

        return res.status(200).json({ totalEntradas });

    } catch (error) {
        console.error("Erro ao consultar total de entradas:", error?.response?.data || error.message);
        return res.status(500).json({ msg: "Erro ao consultar total de entradas.", error: error.message });
    }
};

//SALDO
const getSaldo = async (req, res) => {
    const { periodo, id } = req.params;
    const token = req.headers.authorization;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    try {
        const [mes, ano] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        const entradasRes = await axios.get(`${ENTRADAS_SERVICE_URL}/entradasUsu/${id}`, {
            headers: { Authorization: token }
        });
        const entradas = entradasRes.data.result || [];

        const entradasFiltradas = entradas.filter(e => {
            const data = new Date(e.data_referente);
            return data >= inicioMes && data <= fimMes;
        });

        const totalEntradas = entradasFiltradas.reduce((total, e) => {
            return total + parseFloat(e.valor);
        }, 0);

        const saidasRes = await axios.get(`${SAIDAS_SERVICE_URL}/${id}`, {
            headers: { Authorization: token }
        });
        const saidas = saidasRes.data || [];

        const saidasFiltradas = saidas.filter(s => {
            const data = new Date(s.data_vencimento);
            return data >= inicioMes && data <= fimMes;
        });

        const totalSaidas = saidasFiltradas.reduce((total, s) => {
            return total + parseFloat(s.valor);
        }, 0);

        const saldo = totalEntradas - totalSaidas;

        return res.status(200).json({ saldo });

    } catch (error) {
        console.error("Erro ao consultar saldo do período:", error?.response?.data || error.message);
        return res.status(500).json({ msg: "Erro ao consultar saldo do período.", error: error.message });
    }
};


//TOTAL DESEPESAS A PAGAR
const getTotalDespesasApagar = async (req, res) => {
    const { periodo, id } = req.params;
    const token = req.headers.authorization;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    try {
        const [mes, ano] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        const response = await axios.get(`${SAIDAS_SERVICE_URL}/${id}`, {
            headers: { Authorization: token }
        });

        const saidas = response.data || [];

        const saidasFiltradas = saidas.filter(s => {
            const data = new Date(s.data_vencimento);
            return !s.pago && data >= inicioMes && data <= fimMes;
        });

        const totalDespesasApagar = saidasFiltradas.reduce((total, s) => {
            return total + parseFloat(s.valor);
        }, 0);

        return res.status(200).json({ totalDespesasApagar });

    } catch (error) {
        console.error("Erro ao consultar total de despesas a pagar do período:", error?.response?.data || error.message);
        return res.status(500).json({ msg: "Erro ao consultar total de despesas do período.", error: error.message });
    }
};

//TOTAL DESPESAS PAGAS
const getTotalDespesasPagas = async (req, res) => {
    const { periodo, id } = req.params;
    const token = req.headers.authorization;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    try {
        const [mes, ano] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        // Busca as saídas via micro serviço
        const response = await axios.get(`${SAIDAS_SERVICE_URL}/${id}`, {
            headers: { Authorization: token }
        });

        const saidas = response.data || [];

        // Filtra as saídas que estão pagas (pago === true) e dentro do período
        const saidasPagas = saidas.filter(s => {
            const data = new Date(s.data_vencimento);
            return s.pago === true && data >= inicioMes && data <= fimMes;
        });

        // Soma os valores
        const totalSaidasPagas = saidasPagas.reduce((total, s) => {
            return total + parseFloat(s.valor);
        }, 0);

        return res.status(200).json({ totalSaidasPagas });

    } catch (error) {
        console.error("Erro ao consultar total de despesas pagas do período:", error?.response?.data || error.message);
        return res.status(500).json({ msg: "Erro ao consultar total de despesas do período.", error: error.message });
    }
};

//TOTAL SAIDAS POR CREDOR 
const getTotalDespesasCredor = async (req, res) => {
    const { periodo, id_usuario, id_credor } = req.params;
    const token = req.headers.authorization;

    if (!periodo || !id_usuario || !id_credor) {
        return res.status(400).json({ msg: "Período, ID do usuário ou ID do credor não fornecido." });
    }

    try {
        const [mes, ano] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        // Busca todas as saídas do usuário via microserviço
        const response = await axios.get(`${SAIDAS_SERVICE_URL}/${id_usuario}`, {
            headers: { Authorization: token }
        });

        const saidas = response.data || [];

        // Filtra por data e id_credor
        const saidasCredor = saidas.filter(s => {
            const data = new Date(s.data_vencimento);
            return s.id_credor == id_credor && data >= inicioMes && data <= fimMes;
        });

        // Soma os valores
        const totalSaidasCredor = saidasCredor.reduce((total, s) => {
            return total + parseFloat(s.valor);
        }, 0);

        return res.status(200).json({
            totalSaidasCredor
        });

    } catch (error) {
        console.error("Erro ao consultar total de despesas por credor:", error?.response?.data || error.message);
        res.status(500).json({ msg: "Erro ao consultar total de despesas por credor.", error: error.message });
    }
};


const getTotalDespesasVariaveis = async (req, res) => {
  const { periodo, id } = req.params;
  const token = req.headers.authorization;

  if (!periodo || !id) {
    return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
  }

  if (!token) {
    return res.status(401).json({ msg: "Token de autorização não fornecido." });
  }

  try {
    const [mesStr, anoStr] = periodo.split("-");
    const mes = parseInt(mesStr, 10);
    const ano = parseInt(anoStr, 10);

    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12) {
      return res.status(400).json({ msg: "Período inválido. Use formato MM-AAAA válido." });
    }

    const inicioMes = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0, 0));
    const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

    const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    const response = await axios.get(`${SAIDAS_SERVICE_URL}/${id}`, {
      headers: { Authorization: authHeader }
    });

    const saidas = response.data || [];

    const saidasVariaveis = saidas.filter(s => {
      const dataVenc = new Date(s.data_vencimento);
      return (
        dataVenc >= inicioMes &&
        dataVenc <= fimMes &&
        s.gasto_fixo === false &&
        (s.total_parcela === null || s.total_parcela === 0 || s.total_parcela === 1) &&
        s.pago === true
      );
    });

    const totalSaidasVariaveis = saidasVariaveis.reduce((total, s) => {
      const valor = parseFloat(s.valor);
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);

    return res.status(200).json({ totalSaidasVariaveis });

  } catch (error) {
    console.error("Erro ao consultar total de despesas variáveis do período:", error?.response?.data || error.message);
    return res.status(500).json({
      msg: "Erro ao consultar total de despesas variáveis do período.",
      status: error.response?.status || 500,
      error: error.message
    });
  }
};


const getTotalDespesasFixasParceladas = async (req, res) => {
  const { periodo, id } = req.params;
  const token = req.headers.authorization;

  if (!periodo || !id) {
    return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
  }

  if (!token) {
    return res.status(401).json({ msg: "Token de autorização não fornecido." });
  }

  try {
    const [mesStr, anoStr] = periodo.split("-");
    const mes = parseInt(mesStr, 10);
    const ano = parseInt(anoStr, 10);

    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12) {
      return res.status(400).json({ msg: "Período inválido. Use formato MM-AAAA válido." });
    }

    const inicioMes = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0, 0));
    const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

    const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    const response = await axios.get(`${SAIDAS_SERVICE_URL}/${id}`, {
      headers: { Authorization: authHeader }
    });
    console.log(response)

    const saidas = response.data || [];

    const saidasFixasParceladas = saidas.filter(s => {
      const dataVencimento = new Date(s.data_vencimento);
      const gastoFixo = Boolean(s.gasto_fixo);
      const totalParcela = s.total_parcela ? Number(s.total_parcela) : 0;

      // Filtra despesas fixas ou parceladas dentro do período
      return (
        dataVencimento >= inicioMes &&
        dataVencimento <= fimMes &&
        (gastoFixo || totalParcela > 1)
      );
    });

    const totalSaidasParceladasFixas = saidasFixasParceladas.reduce((acc, curr) => {
      const valor = parseFloat(curr.valor);
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);

    return res.status(200).json({ totalSaidasParceladasFixas });

  } catch (error) {
    console.error("Erro ao consultar total de despesas fixas/parceladas do período:", error?.response?.data || error.message);
    return res.status(500).json({
      msg: "Erro ao consultar total de despesas fixas/parceladas do período.",
      status: error.response?.status || 500,
      error: error.message
    });
  }
};





module.exports = {
    getTotalSaidas,
    getTotalEntradas,
    getTotalDespesasPagas,
    getTotalDespesasApagar,
    getSaldo,
    getTotalDespesasCredor,
    getTotalDespesasVariaveis,
    getTotalDespesasFixasParceladas
}