import Documento from "../models/Documento.js";

class DocumentoRepository {
  async create(data) {
    return Documento.create(data);
  }

  async findAll(filtros = {}) {
    const query = {};

    if (filtros.organizacaoId) query.organizacao = filtros.organizacaoId;
    if (filtros.empresa) query.empresa = filtros.empresa;
    if (filtros.nome) query.nome = { $regex: filtros.nome, $options: "i" };

    if (filtros.vencimento_ate) {
      query.data_vencimento = { $lte: new Date(filtros.vencimento_ate) };
    }

    if (filtros.data_vencimento_gte) {
      query.data_vencimento = { ...query.data_vencimento, $gte: new Date(filtros.data_vencimento_gte) };
    }

    return Documento.find(query)
      .populate("empresa", "nome numero_documento")
      .populate("usuario", "nome email")
      .sort({ data_vencimento: 1, criado_em: -1 });
  }

  async findById(id, organizacaoId = null) {
    const query = { _id: id };
    if (organizacaoId) query.organizacao = organizacaoId;
    return Documento.findOne(query)
      .populate("empresa", "nome numero_documento cidade")
      .populate("usuario", "nome email");
  }

  async update(id, data, organizacaoId = null) {
    const query = { _id: id };
    if (organizacaoId) query.organizacao = organizacaoId;
    return Documento.findOneAndUpdate(query, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id, organizacaoId = null) {
    const query = { _id: id };
    if (organizacaoId) query.organizacao = organizacaoId;
    const doc = await Documento.findOne(query);
    if (!doc) return null;
    await Documento.deleteOne(query);
    return doc;
  }
}

export default DocumentoRepository;
