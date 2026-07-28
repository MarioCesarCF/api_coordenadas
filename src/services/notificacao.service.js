import Documento from "../models/Documento.js";

class NotificacaoService {
  async verificarVencimentos(organizacaoId = null) {
    const hoje = new Date();
    const daqui30Dias = new Date();
    daqui30Dias.setDate(hoje.getDate() + 30);

    const filtro = {
      data_vencimento: {
        $gte: hoje,
        $lte: daqui30Dias,
      },
    };

    if (organizacaoId) {
      filtro.organizacao = organizacaoId;
    }

    const documentos = await Documento.find(filtro)
      .populate("empresa", "nome")
      .populate("usuario", "nome email")
      .sort({ data_vencimento: 1 });

    return documentos.map((doc) => {
      const diasRestantes = Math.ceil((doc.data_vencimento - hoje) / (1000 * 60 * 60 * 24));

      let urgencia = "verde";
      let rotulo = "";

      if (diasRestantes <= 1) {
        urgencia = "vermelha";
        rotulo = `Vence amanhã!`;
      } else if (diasRestantes <= 7) {
        urgencia = "laranja";
        rotulo = `Vence em ${diasRestantes} dias`;
      } else if (diasRestantes <= 15) {
        urgencia = "amarela";
        rotulo = `Vence em ${diasRestantes} dias`;
      } else {
        rotulo = `Vence em ${diasRestantes} dias`;
      }

      return {
        documento_id: doc._id,
        nome: doc.nome,
        empresa: doc.empresa?.nome || "N/A",
        data_vencimento: doc.data_vencimento,
        dias_restantes: diasRestantes,
        urgencia,
        rotulo,
      };
    });
  }
}

export default NotificacaoService;
