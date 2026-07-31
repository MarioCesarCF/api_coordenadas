export const LIMITES_POR_PLANO = {
  free: {
    max_empresas: 5,
    max_usuarios: 1,
    storage_gb: 0,
    calculos_habilitados: false,
    dominio_personalizado_habilitado: false,
  },
  essential: {
    max_empresas: 200,
    max_usuarios: 5,
    storage_gb: 2,
    calculos_habilitados: false,
    dominio_personalizado_habilitado: true,
  },
  profissional: {
    max_empresas: 1000,
    max_usuarios: 20,
    storage_gb: 10,
    calculos_habilitados: true,
    dominio_personalizado_habilitado: true,
  },
  enterprise: {
    max_empresas: 99999,
    max_usuarios: 99999,
    storage_gb: 50,
    calculos_habilitados: true,
    dominio_personalizado_habilitado: true,
  },
};

export const PLANO_LABELS = {
  free: "Free",
  essential: "Essencial",
  profissional: "Profissional",
  enterprise: "Enterprise",
};

export function limitesPorPlano(plano) {
  return LIMITES_POR_PLANO[plano] || LIMITES_POR_PLANO.free;
}
