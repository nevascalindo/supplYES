/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { Supplier, Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "embalagens",
    name: "Embalagens e Descartáveis",
    iconName: "Package",
    description: "Caixas, sacolas kraft, copos, guardanapos e descartáveis em geral."
  },
  {
    id: "alimentos",
    name: "Alimentos e Insumos",
    iconName: "UtensilsCrossed",
    description: "Farinhas, açúcar, laticínios, hortifrúti fresco e óleos industriais."
  },
  {
    id: "gas_energia",
    name: "Gás e Energia",
    iconName: "Flame",
    description: "Gás industrial GLP (P45), carvão de alta performance e lenha."
  },
  {
    id: "logistica",
    name: "Logística e Fretes",
    iconName: "Truck",
    description: "Serviço de motoboy express, fiorino e fretes urgentes."
  },
  {
    id: "manutencao",
    name: "Manutenção e Serviços",
    iconName: "Wrench",
    description: "Conserto de fornos, freezers, balanças e suporte imediato."
  },
  {
    id: "grafica",
    name: "Gráfica e Visual",
    iconName: "Printer",
    description: "Etiquetas, comandas, banners e adesivos rápidos."
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [];
